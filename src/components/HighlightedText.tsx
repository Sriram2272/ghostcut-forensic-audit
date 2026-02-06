import { Ghost, Shield, Scissors, Eye, AlertTriangle } from "lucide-react";

interface HighlightedTextProps {
  text: string;
  highlights: Array<{
    start: number;
    end: number;
    status: "verified" | "hallucinated" | "unverifiable";
  }>;
}

const statusStyles = {
  verified:
    "bg-verified/20 border-b-2 border-verified/60 decoration-verified",
  hallucinated:
    "bg-destructive/20 border-b-2 border-destructive/60 decoration-destructive",
  unverifiable:
    "bg-warning/20 border-b-2 border-warning/60 decoration-warning",
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
        <span key={`plain-${i}`} className="text-foreground/70">
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
      <span key="tail" className="text-foreground/70">
        {text.slice(lastEnd)}
      </span>
    );
  }

  return (
    <p className="text-sm font-mono leading-loose whitespace-pre-wrap">
      {parts}
    </p>
  );
};

export const AuditEmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="relative mb-6">
      <div className="w-24 h-24 rounded-2xl bg-destructive/5 border-2 border-destructive/15 flex items-center justify-center">
        <Ghost className="w-12 h-12 text-destructive/30" />
      </div>
      <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-lg bg-card border-2 border-border flex items-center justify-center glow-red">
        <AlertTriangle className="w-5 h-5 text-destructive" />
      </div>
    </div>
    <h3 className="text-xl font-extrabold text-foreground mb-2">
      Ready to Detect Hallucinations
    </h3>
    <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
      This system forensically audits AI-generated text against your trusted source documents. Every claim is verified, flagged, or marked unverifiable.
    </p>
    <div className="flex flex-col sm:flex-row items-center gap-4 mt-8">
      <Step
        number={1}
        icon={<Eye className="w-4 h-4" />}
        label="Paste LLM output"
        color="text-destructive"
      />
      <div className="hidden sm:block w-8 h-px bg-border" />
      <div className="sm:hidden h-4 w-px bg-border" />
      <Step
        number={2}
        icon={<Shield className="w-4 h-4" />}
        label="Upload source docs"
        color="text-verified"
      />
      <div className="hidden sm:block w-8 h-px bg-border" />
      <div className="sm:hidden h-4 w-px bg-border" />
      <Step
        number={3}
        icon={<Scissors className="w-4 h-4" />}
        label="Run forensic audit"
        color="text-warning"
      />
    </div>
  </div>
);

const Step = ({
  number,
  icon,
  label,
  color,
}: {
  number: number;
  icon: React.ReactNode;
  label: string;
  color: string;
}) => (
  <div className="flex items-center gap-2">
    <div className={`w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center ${color}`}>
      <span className="text-xs font-mono font-bold">{number}</span>
    </div>
    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
      {icon}
      {label}
    </div>
  </div>
);

export default HighlightedText;
