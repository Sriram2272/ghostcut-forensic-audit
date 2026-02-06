import { FileText, Quote, HelpCircle, AlertTriangle } from "lucide-react";
import type { SentenceStatus, RetrievedEvidence } from "@/lib/audit-types";

interface InlineExplanationProps {
  status: SentenceStatus;
  reasoning: string;
  retrievedEvidence: RetrievedEvidence[];
}

const statusVerb: Record<SentenceStatus, string> = {
  supported: "supported by",
  contradicted: "contradicted by",
  unverifiable: "not found in",
  source_conflict: "disputed across",
};

const statusAccent: Record<SentenceStatus, { border: string; bg: string; text: string; quote: string }> = {
  supported: {
    border: "border-verified/20",
    bg: "bg-verified/[0.04]",
    text: "text-verified",
    quote: "border-l-verified/40 bg-verified/[0.06]",
  },
  contradicted: {
    border: "border-destructive/20",
    bg: "bg-destructive/[0.04]",
    text: "text-destructive",
    quote: "border-l-destructive/40 bg-destructive/[0.06]",
  },
  unverifiable: {
    border: "border-warning/15",
    bg: "bg-warning/[0.03]",
    text: "text-warning/80",
    quote: "border-l-warning/30 bg-warning/[0.04]",
  },
  source_conflict: {
    border: "border-[hsl(var(--conflict)/0.2)]",
    bg: "bg-[hsl(var(--conflict)/0.04)]",
    text: "text-[hsl(var(--conflict))]",
    quote: "border-l-[hsl(var(--conflict)/0.4)] bg-[hsl(var(--conflict)/0.06)]",
  },
};

const InlineExplanation = ({ status, reasoning, retrievedEvidence }: InlineExplanationProps) => {
  const accent = statusAccent[status];
  const topEvidence = retrievedEvidence.length > 0 ? retrievedEvidence[0] : null;
  const isUnverifiable = status === "unverifiable";

  // For UNVERIFIABLE: use the mandated template, not model reasoning
  const shortReasoning = isUnverifiable
    ? "This claim cannot be verified because the uploaded source documents do not contain any information about this topic. The system does not assume, infer, or hallucinate missing facts."
    : reasoning.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");

  return (
    <div className={`mt-2 rounded-md border ${accent.border} ${accent.bg} p-2 space-y-1.5`}>
      {/* Label for UNVERIFIABLE */}
      {isUnverifiable && (
        <div className="flex items-center gap-1.5 mb-0.5">
          <HelpCircle className={`w-3 h-3 shrink-0 ${accent.text}`} />
          <span className={`text-[9px] font-mono font-extrabold tracking-widest uppercase ${accent.text}`}>
            NO DIRECT EVIDENCE FOUND IN SOURCE DOCUMENTS
          </span>
        </div>
      )}

      {/* Why it was flagged */}
      <div className="flex items-start gap-1.5">
        <FileText className={`w-3 h-3 mt-0.5 shrink-0 ${accent.text}`} />
        <p className="text-[11px] leading-relaxed text-foreground/80">
          {shortReasoning}
        </p>
      </div>

      {/* Reviewer guidance for UNVERIFIABLE */}
      {isUnverifiable && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-warning/[0.06] border border-warning/10">
          <AlertTriangle className="w-3 h-3 shrink-0 text-warning/70" />
          <span className="text-[10px] font-mono font-bold text-warning/80">
            Recommended action: Human review required.
          </span>
        </div>
      )}

      {/* Source sentence that caused the decision (non-unverifiable) */}
      {topEvidence && !isUnverifiable && (
        <div className={`rounded border-l-2 ${accent.quote} px-2 py-1.5`}>
          <div className="flex items-center gap-1 mb-0.5">
            <Quote className={`w-2.5 h-2.5 ${accent.text}`} />
            <span className={`text-[9px] font-mono font-bold tracking-wider uppercase ${accent.text}`}>
              {statusVerb[status]} "{topEvidence.documentName}"
            </span>
          </div>
          <p className="text-[11px] text-foreground/70 leading-relaxed line-clamp-3 italic">
            "{topEvidence.chunkText.slice(0, 220)}{topEvidence.chunkText.length > 220 ? "…" : ""}"
          </p>
        </div>
      )}

      {/* No evidence case — UNVERIFIABLE */}
      {isUnverifiable && (
        <div className={`rounded border-l-2 ${accent.quote} px-2 py-1.5`}>
          <p className="text-[10px] font-mono text-muted-foreground italic">
            No matching source passage found above similarity threshold. Confidence refers to certainty that the source is silent — not that the claim is false.
          </p>
        </div>
      )}

      {/* Source sentence for unverifiable with weak evidence (shouldn't happen but safe) */}
      {topEvidence && isUnverifiable && (
        <div className={`rounded border-l-2 ${accent.quote} px-2 py-1.5`}>
          <div className="flex items-center gap-1 mb-0.5">
            <Quote className={`w-2.5 h-2.5 ${accent.text}`} />
            <span className={`text-[9px] font-mono font-bold tracking-wider uppercase ${accent.text}`}>
              Nearest passage (below threshold) from "{topEvidence.documentName}"
            </span>
          </div>
          <p className="text-[11px] text-foreground/70 leading-relaxed line-clamp-3 italic">
            "{topEvidence.chunkText.slice(0, 220)}{topEvidence.chunkText.length > 220 ? "…" : ""}"
          </p>
        </div>
      )}
    </div>
  );
};

export default InlineExplanation;