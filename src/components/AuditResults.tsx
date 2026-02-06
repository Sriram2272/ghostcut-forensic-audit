import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import { useState } from "react";

export type ClaimStatus = "verified" | "hallucinated" | "unverifiable";

export interface Claim {
  id: string;
  text: string;
  status: ClaimStatus;
  confidence: { low: number; high: number; explanation?: string };
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
  {
    icon: typeof CheckCircle2;
    label: string;
    colorClass: string;
    bgClass: string;
    borderClass: string;
    barClass: string;
  }
> = {
  verified: {
    icon: CheckCircle2,
    label: "VERIFIED",
    colorClass: "text-verified",
    bgClass: "bg-verified/8",
    borderClass: "border-verified/20",
    barClass: "status-bar-verified",
  },
  hallucinated: {
    icon: XCircle,
    label: "HALLUCINATED",
    colorClass: "text-destructive",
    bgClass: "bg-destructive/8",
    borderClass: "border-destructive/20",
    barClass: "status-bar-hallucinated",
  },
  unverifiable: {
    icon: HelpCircle,
    label: "UNVERIFIABLE",
    colorClass: "text-warning",
    bgClass: "bg-warning/8",
    borderClass: "border-warning/20",
    barClass: "status-bar-unverifiable",
  },
};

const AuditResults = ({ claims }: AuditResultsProps) => {
  const hallucinatedCount = claims.filter(
    (c) => c.status === "hallucinated"
  ).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
            Claim-by-Claim Forensic Analysis
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
            {claims.length} claims
          </span>
          {hallucinatedCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-destructive/15 border border-destructive/20">
              <AlertTriangle className="w-3 h-3 text-destructive" />
              <span className="text-[10px] font-mono font-bold text-destructive">
                {hallucinatedCount} FLAGGED
              </span>
            </span>
          )}
        </div>
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
      className={`rounded-lg border-2 ${config.borderClass} ${config.bgClass} ${config.barClass} overflow-hidden transition-all animate-fade-in-up`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-foreground/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          <span className="text-[10px] font-mono font-bold text-muted-foreground">
            #{index + 1}
          </span>
          <Icon className={`w-5 h-5 ${config.colorClass}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-relaxed font-medium">
            {claim.text}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold tracking-wider ${config.colorClass} ${config.bgClass} border ${config.borderClass}`}
            >
              {config.label}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {(claim.confidence.low * 100).toFixed(0)}–{(claim.confidence.high * 100).toFixed(0)}% confidence
            </span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pl-14 space-y-3 border-t border-border/50 animate-fade-in-up">
          <div className="pt-3">
            <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-1">
              Reasoning
            </p>
            <p className="text-xs text-foreground/80 leading-relaxed">
              {claim.reasoning}
            </p>
          </div>

          {claim.sourceExcerpt && (
            <div>
              <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-1">
                Source Evidence
              </p>
              <div className="px-3 py-2.5 rounded-md bg-muted border-2 border-border status-bar-verified">
                <p className="text-xs font-mono text-foreground/70 leading-relaxed italic">
                  "{claim.sourceExcerpt}"
                </p>
                {claim.sourceDocument && (
                  <p className="text-[10px] text-verified mt-1.5 font-mono font-bold">
                    📄 {claim.sourceDocument}
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
