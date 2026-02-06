import { Ghost, Shield, Scissors, Eye } from "lucide-react";

interface HighlightedTextProps {
  text: string;
  highlights: Array<{
    start: number;
    end: number;
    status: "verified" | "hallucinated" | "unverifiable";
  }>;
}

const statusStyles = {
  verified: "bg-verified/15 border-b-2 border-verified/40",
  hallucinated: "bg-destructive/15 border-b-2 border-destructive/40",
  unverifiable: "bg-warning/15 border-b-2 border-warning/40",
};

const HighlightedText = ({ text, highlights }: HighlightedTextProps) => {
  if (!highlights.length) {
    return (
      <p className="text-sm font-mono text-foreground/80 leading-relaxed whitespace-pre-wrap">
        {text}
      </p>
    );
  }

  const sorted = [...highlights].sort((a, b) => a.start - b.start);
  const parts: React.ReactNode[] = [];
  let lastEnd = 0;

  sorted.forEach((h, i) => {
    if (h.start > lastEnd) {
      parts.push(
        <span key={`plain-${i}`} className="text-foreground/80">
          {text.slice(lastEnd, h.start)}
        </span>
      );
    }
    parts.push(
      <span
        key={`hl-${i}`}
        className={`${statusStyles[h.status]} px-0.5 rounded-sm cursor-pointer transition-all hover:brightness-125`}
        title={h.status.toUpperCase()}
      >
        {text.slice(h.start, h.end)}
      </span>
    );
    lastEnd = h.end;
  });

  if (lastEnd < text.length) {
    parts.push(
      <span key="tail" className="text-foreground/80">
        {text.slice(lastEnd)}
      </span>
    );
  }

  return (
    <p className="text-sm font-mono leading-relaxed whitespace-pre-wrap">
      {parts}
    </p>
  );
};

// Empty state component
export const AuditEmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="relative mb-6">
      <div className="w-20 h-20 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center">
        <Ghost className="w-10 h-10 text-primary/40" />
      </div>
      <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center">
        <Scissors className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-1">
      Ready to Audit
    </h3>
    <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
      Paste LLM-generated text and upload source documents to begin hallucination detection.
    </p>
    <div className="flex items-center gap-4 mt-6">
      <Step icon={<Eye className="w-3.5 h-3.5" />} label="1. Paste LLM output" />
      <div className="w-6 h-px bg-border" />
      <Step icon={<Shield className="w-3.5 h-3.5" />} label="2. Upload sources" />
      <div className="w-6 h-px bg-border" />
      <Step icon={<Scissors className="w-3.5 h-3.5" />} label="3. Run audit" />
    </div>
  </div>
);

const Step = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
    {icon}
    {label}
  </div>
);

export default HighlightedText;
