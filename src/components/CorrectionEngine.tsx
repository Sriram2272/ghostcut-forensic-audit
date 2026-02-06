import { useState } from "react";
import {
  Lock,
  FileText,
  ArrowRight,
  ShieldCheck,
  Trash2,
  BookOpen,
} from "lucide-react";
import type { LockedCorrection, CorrectionCitation } from "@/lib/audit-types";

interface CorrectionEngineProps {
  originalText: string;
  correction: LockedCorrection;
}

const CorrectionEngine = ({ originalText, correction }: CorrectionEngineProps) => {
  return (
    <div className="rounded-lg border-2 border-verified/30 bg-verified/[0.04] overflow-hidden animate-fade-in-up">
      {/* Header — Source-Locked Mode */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-verified/[0.08] border-b border-verified/20">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-verified" />
          <span className="text-[10px] font-mono font-extrabold tracking-widest text-verified uppercase">
            Source-Locked Correction
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-verified/10 border border-verified/20">
          <ShieldCheck className="w-3 h-3 text-verified" />
          <span className="text-[9px] font-mono font-bold text-verified tracking-wider">
            NO NEW FACTS
          </span>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Original (struck through) */}
        <div>
          <p className="text-[9px] font-mono font-extrabold text-destructive tracking-widest uppercase mb-1.5 flex items-center gap-1.5">
            <Trash2 className="w-3 h-3" />
            Original (Hallucinated)
          </p>
          <p className="text-xs text-destructive/60 leading-relaxed line-through decoration-destructive/40">
            {originalText}
          </p>
        </div>

        {/* Arrow separator */}
        <div className="flex items-center gap-2 py-0.5">
          <div className="flex-1 h-px bg-border" />
          <ArrowRight className="w-3.5 h-3.5 text-verified shrink-0" />
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Corrected version with inline citations */}
        <div>
          <p className="text-[9px] font-mono font-extrabold text-verified tracking-widest uppercase mb-1.5 flex items-center gap-1.5">
            <BookOpen className="w-3 h-3" />
            Corrected (Source-Locked)
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            {correction.segments.map((segment, i) =>
              segment.citation ? (
                <CitedSegment key={i} text={segment.text} citation={segment.citation} />
              ) : (
                <span key={i}>{segment.text}</span>
              )
            )}
          </p>
        </div>

        {/* Removed content warning */}
        {correction.removedContent && (
          <div className="rounded-md border border-destructive/20 bg-destructive/[0.05] px-3 py-2">
            <p className="text-[9px] font-mono font-extrabold text-destructive tracking-widest uppercase mb-1 flex items-center gap-1.5">
              <Trash2 className="w-3 h-3" />
              Content Removed
            </p>
            <p className="text-[11px] text-destructive/70 leading-relaxed">
              {correction.removedContent}
            </p>
          </div>
        )}

        {/* Source-locked note */}
        <div className="rounded-md border border-border bg-muted/50 px-3 py-2">
          <div className="flex items-start gap-2">
            <Lock className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[10px] font-mono text-muted-foreground leading-relaxed">
              {correction.sourceLockedNote}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══ CITED SEGMENT — Inline citation with hover tooltip ═══
const CitedSegment = ({
  text,
  citation,
}: {
  text: string;
  citation: CorrectionCitation;
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <span
      className="relative inline"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="text-verified font-semibold border-b border-dashed border-verified/40 cursor-help transition-colors hover:border-verified">
        {text}
      </span>
      <sup className="text-[8px] font-mono font-bold text-verified/60 ml-0.5 cursor-help">
        [{citation.paragraphId}]
      </sup>

      {/* Citation tooltip */}
      {showTooltip && (
        <span className="absolute left-0 bottom-full mb-2 z-50 w-80 animate-fade-in-up pointer-events-none">
          <span className="block rounded-lg border-2 border-verified/30 bg-card shadow-2xl p-3">
            <span className="flex items-center gap-2 mb-2">
              <FileText className="w-3.5 h-3.5 text-verified shrink-0" />
              <span className="text-[10px] font-mono font-bold text-foreground truncate">
                {citation.documentName}
              </span>
              <span className="text-[9px] font-mono text-muted-foreground ml-auto shrink-0">
                §{citation.paragraphId}
              </span>
            </span>
            <span className="block text-[11px] font-mono text-foreground/70 leading-relaxed bg-verified/[0.06] rounded px-2 py-1.5 border border-verified/15">
              "{citation.excerpt}"
            </span>
            <span className="flex items-center gap-1.5 mt-2">
              <Lock className="w-2.5 h-2.5 text-verified" />
              <span className="text-[8px] font-mono font-bold text-verified tracking-wider uppercase">
                Source-Verified Fact
              </span>
            </span>
          </span>
        </span>
      )}
    </span>
  );
};

export default CorrectionEngine;
