import { useState, useCallback } from "react";
import Layout from "@/components/Layout";
import AuditInput from "@/components/AuditInput";
import DocumentUpload from "@/components/DocumentUpload";
import AuditResults, { type Claim } from "@/components/AuditResults";
import TrustScore from "@/components/TrustScore";
import HighlightedText, { AuditEmptyState } from "@/components/HighlightedText";
import { FileText, RotateCcw, Scissors } from "lucide-react";

const MOCK_CLAIMS: Claim[] = [
  {
    id: "1",
    text: "The company was founded in 2018 by Dr. Sarah Chen.",
    status: "verified",
    confidence: 0.95,
    reasoning:
      "The founding year and founder name match the information in the uploaded company profile document.",
    sourceExcerpt:
      "Founded in 2018, the company was established by Dr. Sarah Chen with a focus on...",
    sourceDocument: "company-profile.pdf",
  },
  {
    id: "2",
    text: "Revenue exceeded $50 million in Q3 2025.",
    status: "hallucinated",
    confidence: 0.88,
    reasoning:
      "The financial report for Q3 2025 shows revenue of $34.2M, not $50M. This is a significant factual discrepancy that could mislead stakeholders.",
    sourceExcerpt: "Q3 2025 Revenue: $34,200,000 (up 12% YoY)",
    sourceDocument: "financial-report-q3-2025.pdf",
  },
  {
    id: "3",
    text: "The platform processes over 10 million requests daily.",
    status: "unverifiable",
    confidence: 0.62,
    reasoning:
      "No source document contains information about daily request volume. This claim cannot be verified or refuted with the provided materials.",
  },
  {
    id: "4",
    text: "The team expanded to 150 employees across 3 offices.",
    status: "verified",
    confidence: 0.91,
    reasoning:
      "The HR summary document confirms the headcount and office locations.",
    sourceExcerpt:
      "Current headcount: 150 FTEs. Offices in San Francisco, London, and Singapore.",
    sourceDocument: "hr-summary-2025.pdf",
  },
  {
    id: "5",
    text: "They partnered with NASA for the Mars communication project.",
    status: "hallucinated",
    confidence: 0.96,
    reasoning:
      "No mention of NASA or any space-related partnership exists in any uploaded document. This appears to be a fabricated claim with no evidentiary basis.",
  },
  {
    id: "6",
    text: "Customer satisfaction ratings average 4.7 out of 5.",
    status: "unverifiable",
    confidence: 0.55,
    reasoning:
      "While the marketing document mentions 'high customer satisfaction,' no specific numerical rating is provided in the source materials.",
  },
];

const MOCK_HIGHLIGHTS = [
  { start: 0, end: 51, status: "verified" as const },
  { start: 52, end: 96, status: "hallucinated" as const },
  { start: 97, end: 155, status: "unverifiable" as const },
  { start: 156, end: 214, status: "verified" as const },
  { start: 215, end: 276, status: "hallucinated" as const },
  { start: 277, end: 333, status: "unverifiable" as const },
];

const Index = () => {
  const [llmText, setLlmText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditComplete, setAuditComplete] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([]);

  const canAudit = llmText.trim().length > 0 && files.length > 0;

  const handleAudit = useCallback(() => {
    setIsAuditing(true);
    setTimeout(() => {
      setClaims(MOCK_CLAIMS);
      setAuditComplete(true);
      setIsAuditing(false);
    }, 2500);
  }, []);

  const handleReset = () => {
    setAuditComplete(false);
    setClaims([]);
  };

  const verifiedCount = claims.filter((c) => c.status === "verified").length;
  const hallucinatedCount = claims.filter((c) => c.status === "hallucinated").length;
  const unverifiableCount = claims.filter((c) => c.status === "unverifiable").length;
  const trustScore = claims.length
    ? Math.round((verifiedCount / claims.length) * 100)
    : 0;

  return (
    <Layout
      onAudit={!auditComplete ? handleAudit : undefined}
      canAudit={canAudit}
      isAuditing={isAuditing}
    >
      <div className="px-4 sm:px-6 py-6 pb-14 max-w-[1440px] mx-auto">
        {/* Mobile audit button (visible on small screens) */}
        {!auditComplete && (
          <div className="sm:hidden mb-4">
            <button
              onClick={handleAudit}
              disabled={!canAudit || isAuditing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-destructive text-destructive-foreground font-bold text-sm tracking-wide transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed glow-red"
            >
              {isAuditing ? (
                <>
                  <div className="w-4 h-4 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />
                  AUDITING…
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

        {!auditComplete ? (
          /* ═══ INPUT MODE ═══ */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: LLM Text Input */}
            <div className="p-5 rounded-xl bg-card border-2 border-border">
              <AuditInput text={llmText} onTextChange={setLlmText} />
            </div>

            {/* Right: Documents + Empty state */}
            <div className="space-y-6">
              <div className="p-5 rounded-xl bg-card border-2 border-border">
                <DocumentUpload files={files} onFilesChange={setFiles} />
              </div>
              <AuditEmptyState />
            </div>
          </div>
        ) : (
          /* ═══ RESULTS MODE ═══ */
          <div className="space-y-6">
            {/* Results header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-px w-8 bg-destructive" />
                <h2 className="text-sm font-mono font-extrabold text-destructive uppercase tracking-widest">
                  Audit Complete — Results Below
                </h2>
                <div className="h-px flex-1 bg-destructive/30" />
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary border border-border text-sm font-semibold text-foreground hover:bg-accent transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                New Audit
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Annotated text + Claims */}
              <div className="lg:col-span-8 space-y-6">
                {/* Highlighted text */}
                <div className="p-5 rounded-xl bg-card border-2 border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                        Annotated Output
                      </h3>
                    </div>
                  </div>
                  <HighlightedText text={llmText} highlights={MOCK_HIGHLIGHTS} />

                  {/* Legend */}
                  <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t-2 border-border">
                    <LegendItem color="bg-verified/30 border-verified/50" label="Verified" />
                    <LegendItem color="bg-destructive/30 border-destructive/50" label="Hallucinated" />
                    <LegendItem color="bg-warning/30 border-warning/50" label="Unverifiable" />
                  </div>
                </div>

                {/* Claims */}
                <div className="p-5 rounded-xl bg-card border-2 border-border">
                  <AuditResults claims={claims} originalText={llmText} />
                </div>
              </div>

              {/* Right: Trust + Sources */}
              <div className="lg:col-span-4 space-y-4">
                <TrustScore
                  score={trustScore}
                  totalClaims={claims.length}
                  verifiedClaims={verifiedCount}
                  hallucinatedClaims={hallucinatedCount}
                  unverifiableClaims={unverifiableCount}
                />

                <div className="p-5 rounded-xl bg-card border-2 border-border">
                  <h4 className="text-[10px] font-mono font-bold tracking-widest uppercase text-muted-foreground mb-3">
                    Referenced Sources
                  </h4>
                  <div className="space-y-2">
                    {[
                      "company-profile.pdf",
                      "financial-report-q3-2025.pdf",
                      "hr-summary-2025.pdf",
                    ].map((doc) => (
                      <div
                        key={doc}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-muted border border-border status-bar-verified"
                      >
                        <FileText className="w-3.5 h-3.5 text-verified" />
                        <span className="text-xs font-mono font-semibold text-foreground truncate">
                          {doc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-2">
    <div className={`w-4 h-2.5 rounded-sm ${color} border-2`} />
    <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
      {label}
    </span>
  </div>
);

export default Index;
