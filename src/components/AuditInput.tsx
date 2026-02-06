import { AlertTriangle, Scissors } from "lucide-react";

interface AuditInputProps {
  text: string;
  onTextChange: (text: string) => void;
  onAudit: () => void;
  isAuditing: boolean;
  hasDocuments: boolean;
}

const AuditInput = ({
  text,
  onTextChange,
  onAudit,
  isAuditing,
  hasDocuments,
}: AuditInputProps) => {
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <h3 className="text-sm font-semibold text-foreground">
            LLM Output to Audit
          </h3>
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          {wordCount} words
        </span>
      </div>

      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Paste the LLM-generated text you want to audit against your source documents..."
        className="w-full h-48 px-4 py-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground font-mono leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/40 transition-all"
      />

      <button
        onClick={onAudit}
        disabled={!text.trim() || !hasDocuments || isAuditing}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed glow-cyan"
      >
        {isAuditing ? (
          <>
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Auditing…
          </>
        ) : (
          <>
            <Scissors className="w-4 h-4" />
            Run GHOSTCUT Audit
          </>
        )}
      </button>

      {!hasDocuments && text.trim() && (
        <p className="text-xs text-warning font-mono flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3" />
          Upload source documents to enable auditing
        </p>
      )}
    </div>
  );
};

export default AuditInput;
