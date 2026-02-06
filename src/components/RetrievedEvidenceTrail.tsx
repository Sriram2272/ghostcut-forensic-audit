import { FileText, Search, AlertTriangle } from "lucide-react";
import type { RetrievedEvidence } from "@/lib/audit-types";

interface RetrievedEvidenceTrailProps {
  evidence: RetrievedEvidence[];
  status: string;
}

const RetrievedEvidenceTrail = ({ evidence, status }: RetrievedEvidenceTrailProps) => {
  if (evidence.length === 0) {
    return (
      <div className="mt-3 pt-2 border-t border-border/30">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-3.5 h-3.5 text-warning" />
          <span className="text-[10px] font-mono font-extrabold tracking-widest text-warning uppercase">
            No Evidence Retrieved
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          No document chunk exceeded the similarity threshold. This claim cannot be verified against uploaded sources.
          No external knowledge or hallucinated evidence was used.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 pt-2 border-t border-border/30">
      <div className="flex items-center gap-2 mb-2">
        <Search className="w-3.5 h-3.5 text-primary" />
        <span className="text-[10px] font-mono font-extrabold tracking-widest text-primary uppercase">
          Retrieved Evidence ({evidence.length} chunk{evidence.length !== 1 ? "s" : ""})
        </span>
      </div>

      <div className="space-y-2">
        {evidence.map((ev, idx) => (
          <div
            key={ev.chunkId}
            className="rounded-lg border border-border bg-muted/30 overflow-hidden"
          >
            {/* Chunk header */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border-b border-border/50">
              <FileText className="w-3 h-3 text-primary shrink-0" />
              <span className="text-[10px] font-mono font-bold text-foreground truncate">
                {ev.documentName}
              </span>
              <span className="text-[9px] font-mono text-muted-foreground ml-auto shrink-0">
                chunk #{ev.chunkIndex}
              </span>
              <SimilarityBadge score={ev.similarityScore} rank={idx + 1} />
            </div>

            {/* Chunk text */}
            <div className="px-3 py-2">
              <p className="text-[11px] font-mono text-foreground/75 leading-relaxed line-clamp-4 whitespace-pre-line">
                {ev.chunkText}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Retrieval disclaimer */}
      <p className="mt-2 text-[9px] font-mono text-muted-foreground/70 leading-relaxed">
        Evidence retrieved exclusively from uploaded documents via TF-IDF similarity search. No external sources consulted.
      </p>
    </div>
  );
};

const SimilarityBadge = ({ score, rank }: { score: number; rank: number }) => {
  const pct = (score * 100).toFixed(1);
  const isHigh = score >= 0.35;
  const isMedium = score >= 0.12 && score < 0.35;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold tracking-wider border shrink-0 ${
        isHigh
          ? "text-verified bg-verified/10 border-verified/30"
          : isMedium
            ? "text-warning bg-warning/10 border-warning/30"
            : "text-muted-foreground bg-muted border-border"
      }`}
    >
      #{rank} {pct}%
    </span>
  );
};

export default RetrievedEvidenceTrail;
