import { CheckCircle2, XCircle, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export type ClaimStatus = "verified" | "hallucinated" | "unverifiable";

export interface Claim {
  id: string;
  text: string;
  status: ClaimStatus;
  confidence: number;
  reasoning: string;
  sourceExcerpt?: string;
  sourceDocument?: string;
}

interface AuditResultsProps {
  claims: Claim[];
  originalText: string;
}

const statusConfig: Record<
  ClaimStatus,
  { icon: typeof CheckCircle2; label: string; colorClass: string; bgClass: string; borderClass: string }
> = {
  verified: {
    icon: CheckCircle2,
    label: "VERIFIED",
    colorClass: "text-verified",
    bgClass: "bg-verified/10",
    borderClass: "border-verified/20",
  },
  hallucinated: {
    icon: XCircle,
    label: "HALLUCINATED",
    colorClass: "text-destructive",
    bgClass: "bg-destructive/10",
    borderClass: "border-destructive/20",
  },
  unverifiable: {
    icon: HelpCircle,
    label: "UNVERIFIABLE",
    colorClass: "text-warning",
    bgClass: "bg-warning/10",
    borderClass: "border-warning/20",
  },
};

const AuditResults = ({ claims }: AuditResultsProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Claim-by-Claim Analysis
        </h3>
        <span className="text-xs font-mono text-muted-foreground">
          {claims.length} claims extracted
        </span>
      </div>

      <div className="space-y-2">
        {claims.map((claim, index) => (
          <ClaimCard key={claim.id} claim={claim} index={index} />
        ))}
      </div>
    </div>
  );
};

const ClaimCard = ({ claim, index }: { claim: Claim; index: number }) => {
  const [expanded, setExpanded] = useState(false);
  const config = statusConfig[claim.status];
  const Icon = config.icon;

  return (
    <div
      className={`rounded-lg border ${config.borderClass} ${config.bgClass} overflow-hidden transition-all animate-fade-in-up`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-3 text-left hover:bg-foreground/[0.02] transition-colors"
      >
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${config.colorClass}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-relaxed">{claim.text}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span
              className={`text-[10px] font-mono font-bold tracking-wider ${config.colorClass}`}
            >
              {config.label}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {(claim.confidence * 100).toFixed(0)}% confidence
            </span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 pl-10 space-y-2 border-t border-border/50">
          <div className="pt-2">
            <p className="text-xs font-semibold text-muted-foreground mb-1">
              Reasoning
            </p>
            <p className="text-xs text-foreground/80 leading-relaxed">
              {claim.reasoning}
            </p>
          </div>

          {claim.sourceExcerpt && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                Source Evidence
              </p>
              <div className="px-3 py-2 rounded-md bg-background/50 border border-border">
                <p className="text-xs font-mono text-foreground/70 leading-relaxed italic">
                  "{claim.sourceExcerpt}"
                </p>
                {claim.sourceDocument && (
                  <p className="text-[10px] text-primary mt-1 font-mono">
                    — {claim.sourceDocument}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditResults;
