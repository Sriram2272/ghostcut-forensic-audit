import { useState, useCallback, useMemo, useRef } from "react";
import Layout from "@/components/Layout";
import AuditInput from "@/components/AuditInput";
import DocumentUpload from "@/components/DocumentUpload";
import SentenceViewer from "@/components/SentenceViewer";
import SourceViewer from "@/components/SourceViewer";
import TrustDashboard from "@/components/TrustDashboard";
import ClaimGraphView from "@/components/ClaimGraphView";
import VerificationScopeBanner from "@/components/VerificationScopeBanner";
import VerificationPolicy from "@/components/VerificationPolicy";
import { AuditEmptyState } from "@/components/HighlightedText";
import { computeWeightedTrustScore } from "@/lib/audit-types";
import type { AuditResult } from "@/lib/audit-types";
import { ingestDocuments, InMemoryVectorIndex } from "@/lib/document-pipeline";
import { runVerification } from "@/lib/verification-engine";
import { RotateCcw, Scissors, BarChart3, GitBranch, Columns2 } from "lucide-react";
import { toast } from "sonner";

type WorkspaceView = "split" | "graph";

const Index = () => {
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

  const canAudit = llmText.trim().length > 0 && files.length > 0;

  const handleAudit = useCallback(async () => {
    // ═══ STRICT SOURCE SCOPE: refuse audit without documents ═══
    if (files.length === 0) {
      toast.error("No source documents uploaded. Audit aborted.", {
        description:
          "Upload at least one source document before running a forensic audit. No preloaded data or external knowledge is used.",
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
      // 1. Ingest documents → read, chunk, vectorize, index
      const { documents: ingestedDocs, index, totalChunks } = await ingestDocuments(files);
      vectorIndexRef.current = index;

      if (index.size === 0) {
        toast.error("Retrieval failed: no chunks indexed.", {
          description:
            "Documents were uploaded but produced no indexable text chunks. The audit cannot proceed without a populated vector index.",
        });
        setIsAuditing(false);
        return;
      }

      toast.info(`Ingested ${files.length} document${files.length > 1 ? "s" : ""}`, {
        description: `${totalChunks} chunks indexed in memory. Retrieval-augmented verification scope: uploaded documents only.`,
      });

      // 2. Verify claims against the index
      const result = runVerification(llmText, index, ingestedDocs);

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

  const handleReset = useCallback(() => {
    setLlmText("");
    setFiles([]);
    setAuditComplete(false);
    setAuditResult(null);
    setSelectedSentenceId(null);
    setShowStats(false);
    setWorkspaceView("split");
    setAuditDurationMs(0);
    auditStartRef.current = 0;
    // Clear vector index
    if (vectorIndexRef.current) {
      vectorIndexRef.current.clear();
      vectorIndexRef.current = null;
    }
    toast.success("New forensic audit initialized", {
      description:
        "All previous sources, claim graphs, verification results, and vector index have been cleared. Context is fully isolated.",
    });
  }, []);

  const weightedScore = useMemo(
    () => (auditResult ? computeWeightedTrustScore(auditResult.sentences) : 0),
    [auditResult]
  );

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

  if (!auditComplete || !auditResult) {
    // ═══ INPUT MODE ═══
    return (
      <Layout
        onAudit={handleAudit}
        canAudit={canAudit}
        isAuditing={isAuditing}
      >
        <div className="px-4 sm:px-6 py-6 pb-14 max-w-[1440px] mx-auto">
          {/* Mobile audit button */}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-card border-2 border-border">
              <AuditInput text={llmText} onTextChange={setLlmText} />
            </div>
            <div className="space-y-6">
              <div className="p-5 rounded-xl bg-card border-2 border-border">
                <DocumentUpload files={files} onFilesChange={setFiles} />
              </div>
              <VerificationPolicy />
              <AuditEmptyState />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ═══ WORKSPACE MODE — Split Screen ═══
  return (
    <Layout>
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
        </div>

        <div className="flex items-center gap-2">
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
            {/* LEFT PANEL — Sentence Viewer */}
            <div className={`${showStats ? "w-[37.5%]" : "w-1/2"} border-r-2 border-border overflow-hidden`}>
              <SentenceViewer
                sentences={auditResult.sentences}
                selectedId={selectedSentenceId}
                onSelectSentence={setSelectedSentenceId}
              />
            </div>

            {/* RIGHT PANEL — Source Viewer */}
            <div className={`${showStats ? "w-[37.5%]" : "w-1/2"} overflow-hidden`}>
              <SourceViewer
                documents={auditResult.documents}
                selectedSentence={selectedSentence}
              />
            </div>
          </>
        ) : (
          /* GRAPH VIEW */
          <div className={`${showStats ? "w-3/4" : "w-full"} overflow-hidden`}>
            <ClaimGraphView sentences={auditResult.sentences} />
          </div>
        )}

        {/* STATS PANEL (optional) */}
        {showStats && (
          <div className="w-1/4 border-l-2 border-border overflow-y-auto p-4 bg-card/50 animate-slide-in-right">
            <TrustDashboard
              score={weightedScore}
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
