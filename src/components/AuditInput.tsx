import { AlertTriangle } from "lucide-react";

interface AuditInputProps {
  text: string;
  onTextChange: (text: string) => void;
}

const AuditInput = ({ text, onTextChange }: AuditInputProps) => {
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-3 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse-glow" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
            LLM Output Under Review
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
            {wordCount} words
          </span>
          {wordCount > 0 && (
            <span className="px-2 py-0.5 rounded bg-warning/15 text-warning text-[10px] font-mono font-bold border border-warning/20">
              UNAUDITED
            </span>
          )}
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Paste the LLM-generated text you want to forensically audit against your source documents…"
        className="flex-1 min-h-[220px] w-full px-4 py-3 rounded-lg bg-muted border-2 border-border text-sm text-foreground placeholder:text-muted-foreground font-mono leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-destructive/30 focus:border-destructive/40 transition-all"
      />

      {!text.trim() && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-warning/10 border border-warning/20">
          <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />
          <p className="text-xs text-warning font-mono">
            Paste LLM-generated text above to begin hallucination analysis
          </p>
        </div>
      )}
    </div>
  );
};

export default AuditInput;
