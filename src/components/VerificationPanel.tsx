import { useState } from "react";
import {
  Brain,
  Scale,
  Calculator,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  MinusCircle,
  ShieldAlert,
  Users,
} from "lucide-react";
import type { MultiModelVerification, VerifierResult, VerifierType, VerifierVerdict } from "@/lib/audit-types";

interface VerificationPanelProps {
  verification: MultiModelVerification;
}

const verifierMeta: Record<VerifierType, { icon: typeof Brain; label: string; description: string }> = {
  nli: {
    icon: Brain,
    label: "NLI Model",
    description: "RoBERTa-style natural language inference",
  },
  llm_judge: {
    icon: Scale,
    label: "LLM Judge",
    description: "Large language model reasoning evaluation",
  },
  rule_based: {
    icon: Calculator,
    label: "Rule Engine",
    description: "Numeric consistency & pattern checks",
  },
};

const verdictConfig: Record<VerifierVerdict, { icon: typeof CheckCircle2; label: string; color: string; bg: string; border: string }> = {
  supported: {
    icon: CheckCircle2,
    label: "SUPPORTED",
    color: "text-verified",
    bg: "bg-verified/10",
    border: "border-verified/30",
  },
  contradicted: {
    icon: XCircle,
    label: "CONTRADICTED",
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
  },
  unverifiable: {
    icon: HelpCircle,
    label: "UNVERIFIABLE",
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
  },
  not_applicable: {
    icon: MinusCircle,
    label: "N/A",
    color: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border",
  },
};

const VerificationPanel = ({ verification }: VerificationPanelProps) => {
  const applicableResults = verification.results.filter(r => r.verdict !== "not_applicable");
  const hasDisagreement = !verification.consensus;

  return (
    <div className={`rounded-lg border-2 overflow-hidden animate-fade-in-up ${
      hasDisagreement
        ? "border-[hsl(var(--uncertain)/0.4)] bg-[hsl(var(--uncertain)/0.04)]"
        : "border-border bg-card/50"
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-2.5 border-b ${
        hasDisagreement
          ? "bg-[hsl(var(--uncertain)/0.08)] border-[hsl(var(--uncertain)/0.2)]"
          : "bg-muted/50 border-border"
      }`}>
        <div className="flex items-center gap-2">
          <Users className={`w-3.5 h-3.5 ${hasDisagreement ? "text-[hsl(var(--uncertain))]" : "text-primary"}`} />
          <span className={`text-[10px] font-mono font-extrabold tracking-widest uppercase ${
            hasDisagreement ? "text-[hsl(var(--uncertain))]" : "text-foreground"
          }`}>
            Multi-Model Verification
          </span>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-mono font-extrabold tracking-wider border ${
          hasDisagreement
            ? "text-[hsl(var(--uncertain))] bg-[hsl(var(--uncertain)/0.12)] border-[hsl(var(--uncertain)/0.3)]"
            : "text-verified bg-verified/10 border-verified/30"
        }`}>
          {hasDisagreement ? (
            <>
              <AlertTriangle className="w-3 h-3" />
              DISAGREEMENT
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3" />
              CONSENSUS
            </>
          )}
        </div>
      </div>

      <div className="px-4 py-3 space-y-2.5">
        {/* Verifier results */}
        {verification.results.map((result) => (
          <VerifierRow key={result.verifier} result={result} />
        ))}

        {/* Disagreement warning */}
        {hasDisagreement && verification.disagreementNote && (
          <div className="mt-1 rounded-md border border-[hsl(var(--uncertain)/0.3)] bg-[hsl(var(--uncertain)/0.06)] px-3 py-2.5">
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[hsl(var(--uncertain))]" />
              <span className="text-[9px] font-mono font-extrabold tracking-widest text-[hsl(var(--uncertain))] uppercase">
                Verification Uncertain — Human Review Recommended
              </span>
            </div>
            <p className="text-[11px] text-foreground/70 leading-relaxed">
              {verification.disagreementNote}
            </p>
          </div>
        )}

        {/* Consensus bar */}
        {!hasDisagreement && applicableResults.length > 1 && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-verified/[0.06] border border-verified/15">
            <CheckCircle2 className="w-3 h-3 text-verified" />
            <span className="text-[10px] font-mono text-verified/80">
              All {applicableResults.length} applicable models agree
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══ VERIFIER ROW ═══
const VerifierRow = ({ result }: { result: VerifierResult }) => {
  const [expanded, setExpanded] = useState(false);
  const meta = verifierMeta[result.verifier];
  const verdict = verdictConfig[result.verdict];
  const VerifierIcon = meta.icon;
  const VerdictIcon = verdict.icon;
  const isNA = result.verdict === "not_applicable";

  return (
    <div
      className={`rounded-md border transition-all cursor-pointer ${
        isNA ? "border-border/50 opacity-50" : `${verdict.border}`
      } ${expanded ? verdict.bg : "hover:bg-muted/30"}`}
      onClick={() => !isNA && setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3 px-3 py-2">
        {/* Verifier icon + name */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <VerifierIcon className={`w-4 h-4 shrink-0 ${isNA ? "text-muted-foreground/50" : "text-primary"}`} />
          <div className="min-w-0">
            <span className="text-[10px] font-mono font-bold text-foreground block truncate">
              {meta.label}
            </span>
            <span className="text-[9px] font-mono text-muted-foreground block truncate">
              {result.modelName}
            </span>
          </div>
        </div>

        {/* Verdict badge */}
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-extrabold tracking-wider border shrink-0 ${verdict.color} ${verdict.bg} ${verdict.border}`}>
          <VerdictIcon className="w-3 h-3" />
          {verdict.label}
        </div>

        {/* Confidence */}
        {!isNA && (
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="relative w-12 h-1.5 rounded-full bg-muted overflow-hidden">
              {/* Range band */}
              <div
                className={`absolute h-full rounded-full opacity-30 ${
                  result.verdict === "supported"
                    ? "bg-verified"
                    : result.verdict === "contradicted"
                      ? "bg-destructive"
                      : "bg-warning"
                }`}
                style={{
                  left: `${result.confidence.low * 100}%`,
                  width: `${(result.confidence.high - result.confidence.low) * 100}%`,
                }}
              />
              {/* Midpoint bar */}
              <div
                className={`h-full rounded-full transition-all ${
                  result.verdict === "supported"
                    ? "bg-verified"
                    : result.verdict === "contradicted"
                      ? "bg-destructive"
                      : "bg-warning"
                }`}
                style={{ width: `${((result.confidence.low + result.confidence.high) / 2) * 100}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-muted-foreground w-14 text-right">
              {(result.confidence.low * 100).toFixed(0)}–{(result.confidence.high * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {/* Expanded reasoning */}
      {expanded && !isNA && (
        <div className="px-3 pb-2.5 pt-0.5 border-t border-border/30 space-y-1.5">
          {result.confidence.explanation && (
            <p className="text-[10px] font-mono text-primary/80 italic leading-relaxed">
              ⓘ {result.confidence.explanation}
            </p>
          )}
          <p className="text-[11px] text-foreground/70 leading-relaxed">
            {result.reasoning}
          </p>
        </div>
      )}
    </div>
  );
};

export default VerificationPanel;
