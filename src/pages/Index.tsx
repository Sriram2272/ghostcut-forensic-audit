import { useState, useCallback, useMemo, useRef } from "react";
import Layout from "@/components/Layout";
import AuditInput from "@/components/AuditInput";
import DocumentUpload from "@/components/DocumentUpload";
import SentenceViewer from "@/components/SentenceViewer";
import SourceViewer from "@/components/SourceViewer";
import TrustDashboard from "@/components/TrustDashboard";
import ClaimGraphView from "@/components/ClaimGraphView";
import AuditComparison from "@/components/AuditComparison";
import VerificationScopeBanner from "@/components/VerificationScopeBanner";
import VerificationPolicy from "@/components/VerificationPolicy";
import BatchAuditPanel from "@/components/BatchAuditPanel";
import type { BatchItem, BatchProgress } from "@/components/BatchAuditPanel";
import { AuditEmptyState } from "@/components/HighlightedText";
import type { AuditResult } from "@/lib/audit-types";
import { ingestDocuments, InMemoryVectorIndex } from "@/lib/document-pipeline";
import { runVerification } from "@/lib/verification-engine";
import { generateAuditPDF } from "@/lib/pdf-export";
import { generateAuditJSON, generateAuditCSV, generateAuditMarkdown } from "@/lib/json-export";
import type { ExportFormat } from "@/components/ExportDropdown";
import { useAuditHistory } from "@/hooks/use-audit-history";
import { RotateCcw, Scissors, BarChart3, GitBranch, Columns2, GitCompareArrows, Save, Layers } from "lucide-react";
import { toast } from "sonner";

type WorkspaceView = "split" | "graph" | "compare";
type InputMode = "single" | "batch";

const Index = () => {
  // ═══ SINGLE AUDIT STATE ═══
  const [llmText, setLlmText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditComplete, setAuditComplete] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [selectedSentenceId, setSelectedSentenceId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>("split");
  const [auditDurationMs, setAuditDurationMs] = useState(0);
  const auditStartRef = useRef<number>(0);
  const vectorIndexRef = useRef<InMemoryVectorIndex | null>(null);

  // ═══ BATCH AUDIT STATE ═══
  const [inputMode, setInputMode] = useState<InputMode>("single");
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);

  const { snapshots, saveSnapshot, removeSnapshot, clearSnapshots } = useAuditHistory();

  const canAudit = llmText.trim().length > 0 && files.length > 0;

  // ═══ HANDLERS ═══

  const handleExport = useCallback((format: ExportFormat) => {
    if (!auditResult) {
      toast.error("No audit results to export.");
      return;
    }
    try {
      switch (format) {
        case "pdf":
          generateAuditPDF(auditResult, auditDurationMs);
          break;
        case "json":
          generateAuditJSON(auditResult, auditDurationMs);
          break;
        case "csv":
          generateAuditCSV(auditResult, auditDurationMs);
          break;
        case "markdown":
          generateAuditMarkdown(auditResult, auditDurationMs);
          break;
      }
      toast.success(`${format.toUpperCase()} report generated`, {
        description: "Forensic audit report downloaded successfully.",
      });
    } catch (err) {
      toast.error("Export failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    }
  }, [auditResult, auditDurationMs]);

  const handleSaveToHistory = useCallback(() => {
    if (!auditResult) return;
    saveSnapshot(auditResult, auditDurationMs);
    toast.success("Audit saved for comparison", {
      description: `Snapshot saved. View in Compare tab.`,
    });
  }, [auditResult, auditDurationMs, saveSnapshot]);

  const handleAudit = useCallback(async () => {
    if (files.length === 0) {
      toast.error("No source documents uploaded. Audit aborted.", {
        description: "Upload at least one source document before running a forensic audit.",
      });
      return;
    }

    if (!llmText.trim()) {
      toast.error("No LLM output provided.", {
        description: "Paste the LLM-generated text you want to audit.",
      });
      return;
    }

    setIsAuditing(true);
    auditStartRef.current = Date.now();

    try {
      const { documents: ingestedDocs, index, totalChunks } = await ingestDocuments(files);
      vectorIndexRef.current = index;

      if (index.size === 0) {
        toast.error("Retrieval failed: no chunks indexed.");
        setIsAuditing(false);
        return;
      }

      toast.info(`Ingested ${files.length} document${files.length > 1 ? "s" : ""}`, {
        description: `${totalChunks} chunks indexed. Retrieval scope: uploaded documents only.`,
      });

      const result = await runVerification(llmText, index, ingestedDocs);

      setAuditResult(result);
      setAuditDurationMs(Date.now() - auditStartRef.current);
      setAuditComplete(true);
      setSelectedSentenceId(null);
    } catch (err) {
      toast.error("Audit failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsAuditing(false);
    }
  }, [llmText, files]);

  // ═══ BATCH AUDIT HANDLER ═══

  const handleBatchAudit = useCallback(async () => {
    const validItems = batchItems.filter((i) => i.text.trim().length > 0);

    if (validItems.length === 0) {
      toast.error("No LLM outputs in the batch queue.");
      return;
    }

    if (files.length === 0) {
      toast.error("No source documents uploaded.", {
        description: "Upload at least one source document before running batch audit.",
      });
      return;
    }

    setIsBatchRunning(true);
    const batchStart = Date.now();

    try {
      // Ingest documents once for all batch items
      const { documents: ingestedDocs, index, totalChunks } = await ingestDocuments(files);
      vectorIndexRef.current = index;

      if (index.size === 0) {
        toast.error("Retrieval failed: no chunks indexed.");
        setIsBatchRunning(false);
        return;
      }

      toast.info(`Ingested ${files.length} document${files.length > 1 ? "s" : ""}`, {
        description: `${totalChunks} chunks indexed. Running ${validItems.length} audits sequentially.`,
      });

      let lastResult: AuditResult | null = null;
      let lastDuration = 0;

      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i];

        setBatchProgress({
          currentIndex: i,
          totalItems: validItems.length,
          currentLabel: item.label,
          claimsCompleted: 0,
          claimsTotal: 0,
        });

        const itemStart = Date.now();

        try {
          const result = await runVerification(
            item.text,
            index,
            ingestedDocs,
            (completed, total) => {
              setBatchProgress((prev) =>
                prev ? { ...prev, claimsCompleted: completed, claimsTotal: total } : prev
              );
            }
          );

          const itemDuration = Date.now() - itemStart;

          // Auto-save each result to comparison history
          saveSnapshot(result, itemDuration, item.label);

          lastResult = result;
          lastDuration = itemDuration;

          toast.success(`✓ ${item.label}`, {
            description: `Completed in ${itemDuration < 1000 ? `${itemDuration}ms` : `${(itemDuration / 1000).toFixed(1)}s`}. Auto-saved.`,
          });
        } catch (err) {
          toast.error(`✗ ${item.label} failed`, {
            description: err instanceof Error ? err.message : String(err),
          });
        }
      }

      setBatchProgress(null);

      // Show the last result in the workspace and switch to compare view
      if (lastResult) {
        setAuditResult(lastResult);
        setAuditDurationMs(lastDuration);
        setAuditComplete(true);
        setSelectedSentenceId(null);
        setWorkspaceView("compare");

        toast.success(`Batch audit complete`, {
          description: `${validItems.length} audits completed. Viewing comparison.`,
        });
      }
    } catch (err) {
      toast.error("Batch audit failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsBatchRunning(false);
      setBatchProgress(null);
    }
  }, [batchItems, files, saveSnapshot]);

  const handleReset = useCallback(() => {
    setLlmText("");
    setFiles([]);
    setAuditComplete(false);
    setAuditResult(null);
    setSelectedSentenceId(null);
    setShowStats(false);
    setWorkspaceView("split");
    setAuditDurationMs(0);
    setInputMode("single");
    setBatchItems([]);
    setBatchProgress(null);
    auditStartRef.current = 0;
    if (vectorIndexRef.current) {
      vectorIndexRef.current.clear();
      vectorIndexRef.current = null;
    }
    toast.success("New forensic audit initialized", {
      description: "All previous data cleared. Context is fully isolated.",
    });
  }, []);

  const selectedSentence = useMemo(
    () => auditResult?.sentences.find((s) => s.id === selectedSentenceId) ?? null,
    [selectedSentenceId, auditResult]
  );

  const counts = useMemo(() => {
    if (!auditResult)
      return { total: 0, supported: 0, contradicted: 0, unverifiable: 0, source_conflict: 0 };
    const s = auditResult.sentences;
    return {
      total: s.length,
      supported: s.filter((x) => x.status === "supported").length,
      contradicted: s.filter((x) => x.status === "contradicted").length,
      unverifiable: s.filter((x) => x.status === "unverifiable").length,
      source_conflict: s.filter((x) => x.status === "source_conflict").length,
    };
  }, [auditResult]);

  // ═══ INPUT SCREEN ═══

  if (!auditComplete || !auditResult) {
    return (
      <Layout onAudit={inputMode === "single" ? handleAudit : undefined} canAudit={canAudit} isAuditing={isAuditing || isBatchRunning}>
        <div className="px-4 sm:px-6 py-6 pb-14 max-w-[1440px] mx-auto">
          {/* Mode toggle */}
          <div className="flex items-center justify-center gap-1 mb-6">
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted border border-border">
              <button
                onClick={() => setInputMode("single")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                  inputMode === "single"
                    ? "bg-background border border-border text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                Single Audit
              </button>
              <button
                onClick={() => setInputMode("batch")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                  inputMode === "batch"
                    ? "bg-background border border-border text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Batch Audit
              </button>
            </div>
          </div>

          {/* Mobile audit button (single mode only) */}
          {inputMode === "single" && (
            <div className="sm:hidden mb-4">
              <button
                onClick={handleAudit}
                disabled={!canAudit || isAuditing}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-destructive text-destructive-foreground font-bold text-sm tracking-wide transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed glow-red"
              >
                {isAuditing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />
                    PROCESSING DOCUMENTS…
                  </>
                ) : (
                  <>
                    <Scissors className="w-4 h-4" />
                    RUN AUDIT
                  </>
                )}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column: input area */}
            <div className="p-5 rounded-xl bg-card border-2 border-border">
              {inputMode === "single" ? (
                <AuditInput text={llmText} onTextChange={setLlmText} />
              ) : (
                <BatchAuditPanel
                  items={batchItems}
                  onItemsChange={setBatchItems}
                  onRunBatch={handleBatchAudit}
                  isRunning={isBatchRunning}
                  progress={batchProgress}
                  fileCount={files.length}
                />
              )}
            </div>

            {/* Right column: documents + policy */}
            <div className="space-y-6">
              <div className="p-5 rounded-xl bg-card border-2 border-border">
                <DocumentUpload files={files} onFilesChange={setFiles} />
              </div>
              <VerificationPolicy />
              {inputMode === "single" && <AuditEmptyState />}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ═══ WORKSPACE MODE ═══
  return (
    <Layout onExport={handleExport} hasAuditResult>
      {/* Workspace toolbar */}
      <div className="border-b-2 border-border bg-card/50 backdrop-blur-sm px-4 sm:px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary border border-border text-xs font-semibold text-foreground hover:bg-accent transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New Audit
          </button>
          <div className="h-4 w-px bg-border" />
          <span className="text-[10px] font-mono text-destructive font-extrabold tracking-wider">
            {counts.contradicted} HALLUCINATION{counts.contradicted !== 1 ? "S" : ""} DETECTED
          </span>
          <div className="h-4 w-px bg-border" />
          <VerificationScopeBanner documentCount={auditResult.documents.length} variant="compact" />
        </div>

        {/* View switcher */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted border border-border">
          <ViewTab
            active={workspaceView === "split"}
            onClick={() => setWorkspaceView("split")}
            icon={<Columns2 className="w-3.5 h-3.5" />}
            label="Audit"
          />
          <ViewTab
            active={workspaceView === "graph"}
            onClick={() => setWorkspaceView("graph")}
            icon={<GitBranch className="w-3.5 h-3.5" />}
            label="Graph"
          />
          <ViewTab
            active={workspaceView === "compare"}
            onClick={() => setWorkspaceView("compare")}
            icon={<GitCompareArrows className="w-3.5 h-3.5" />}
            label={`Compare${snapshots.length > 0 ? ` (${snapshots.length})` : ""}`}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveToHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border bg-secondary border-border text-xs font-semibold text-foreground hover:bg-accent transition-colors"
            title="Save audit for comparison"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
          <button
            onClick={() => setShowStats(!showStats)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors ${
              showStats
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary border-border text-foreground hover:bg-accent"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Stats
          </button>
        </div>
      </div>

      {/* Main workspace content */}
      <div className="flex" style={{ height: "calc(100vh - 7.5rem)" }}>
        {workspaceView === "split" ? (
          <>
            <div className={`${showStats ? "w-[37.5%]" : "w-1/2"} border-r-2 border-border overflow-hidden`}>
              <SentenceViewer
                sentences={auditResult.sentences}
                selectedId={selectedSentenceId}
                onSelectSentence={setSelectedSentenceId}
              />
            </div>
            <div className={`${showStats ? "w-[37.5%]" : "w-1/2"} overflow-hidden`}>
              <SourceViewer
                documents={auditResult.documents}
                selectedSentence={selectedSentence}
              />
            </div>
          </>
        ) : workspaceView === "graph" ? (
          <div className={`${showStats ? "w-3/4" : "w-full"} overflow-hidden`}>
            <ClaimGraphView sentences={auditResult.sentences} />
          </div>
        ) : (
          <div className={`${showStats ? "w-3/4" : "w-full"} overflow-hidden`}>
            <AuditComparison snapshots={snapshots} onRemoveSnapshot={removeSnapshot} />
          </div>
        )}

        {/* STATS PANEL (optional) */}
        {showStats && (
          <div className="w-1/4 border-l-2 border-border overflow-y-auto p-4 bg-card/50 animate-slide-in-right">
            <TrustDashboard
              sentences={auditResult.sentences}
              auditDurationMs={auditDurationMs}
            />
          </div>
        )}
      </div>
    </Layout>
  );
};

const ViewTab = ({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
      active
        ? "bg-background border border-border text-foreground shadow-sm"
        : "text-muted-foreground hover:text-foreground"
    }`}
  >
    {icon}
    {label}
  </button>
);

export default Index;
