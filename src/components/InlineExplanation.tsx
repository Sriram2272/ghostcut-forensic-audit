import { FileText, Quote } from "lucide-react";
import type { SentenceStatus, RetrievedEvidence } from "@/lib/audit-types";

interface InlineExplanationProps {
  status: SentenceStatus;
  reasoning: string;
  retrievedEvidence: RetrievedEvidence[];
}

const statusVerb: Record<SentenceStatus, string> = {
  supported: "supported by",
  contradicted: "contradicted by",
  unverifiable: "not addressed in",
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
    border: "border-warning/20",
    bg: "bg-warning/[0.04]",
    text: "text-warning",
    quote: "border-l-warning/40 bg-warning/[0.06]",
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

  // Extract a concise explanation — first sentence of reasoning
  const shortReasoning = reasoning.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");

  return (
    <div className={`mt-2 rounded-md border ${accent.border} ${accent.bg} p-2 space-y-1.5`}>
      {/* Why it was flagged */}
      <div className="flex items-start gap-1.5">
        <FileText className={`w-3 h-3 mt-0.5 shrink-0 ${accent.text}`} />
        <p className="text-[11px] leading-relaxed text-foreground/80">
          {shortReasoning}
        </p>
      </div>

      {/* Source sentence that caused the decision */}
      {topEvidence && (
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

      {/* No evidence case */}
      {!topEvidence && status === "unverifiable" && (
        <div className={`rounded border-l-2 ${accent.quote} px-2 py-1.5`}>
          <p className="text-[10px] font-mono text-muted-foreground italic">
            No matching source passage found above similarity threshold.
          </p>
        </div>
      )}
    </div>
  );
};

export default InlineExplanation;