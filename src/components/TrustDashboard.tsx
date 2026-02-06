import { useMemo, useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  GitCompareArrows,
  Clock,
  AlertTriangle,
  Activity,
  TrendingDown,
  Info,
  X,
} from "lucide-react";
import type { AuditSentence } from "@/lib/audit-types";
import { computeStrictAuditStats } from "@/lib/audit-types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TrustDashboardProps {
  sentences: AuditSentence[];
  auditDurationMs: number;
}

// ═══ RISK DOMAIN DETECTION ═══
function detectRiskDomains(sentences: AuditSentence[]): string[] {
  const domains: string[] = [];
  const allText = sentences.map((s) => s.text + " " + s.reasoning).join(" ").toLowerCase();

  if (/\b(fda|clinical|patient|medical|diagnosis|drug|treatment|health|hospital)\b/.test(allText)) {
    domains.push("medical");
  }
  if (/\b(sec|revenue|valuation|financial|investor|ipo|earnings|arr|profit)\b/.test(allText)) {
    domains.push("financial");
  }
  if (/\b(regulation|compliance|legal|court|lawsuit|patent|license|filing)\b/.test(allText)) {
    domains.push("legal");
  }
  return domains.length > 0 ? domains : ["general"];
}

const RISK_EXPLANATIONS: Record<string, string> = {
  medical:
    "If uncorrected, fabricated medical claims could endanger patient safety, lead to misdiagnosis, or violate FDA regulatory requirements.",
  financial:
    "If uncorrected, inflated or fabricated financial figures could mislead investors, violate SEC regulations, and constitute material misrepresentation.",
  legal:
    "If uncorrected, false regulatory or compliance claims could expose the organization to legal liability and enforcement actions.",
  general:
    "If uncorrected, unverified claims could erode trust, damage credibility, and lead to uninformed decision-making.",
};

const RISK_LEVEL_STYLE = {
  LOW: { label: "LOW RISK", color: "text-verified", bg: "bg-verified/12 border-verified/30", icon: ShieldCheck },
  MEDIUM: { label: "MEDIUM RISK", color: "text-warning", bg: "bg-warning/12 border-warning/30", icon: AlertTriangle },
  HIGH: { label: "HIGH RISK", color: "text-destructive", bg: "bg-destructive/12 border-destructive/30", icon: ShieldAlert },
};

const TrustDashboard = ({ sentences, auditDurationMs }: TrustDashboardProps) => {
  const [formulaOpen, setFormulaOpen] = useState(false);

  const stats = useMemo(() => computeStrictAuditStats(sentences), [sentences]);
  const riskDomains = useMemo(() => detectRiskDomains(sentences), [sentences]);
  const riskStyle = RISK_LEVEL_STYLE[stats.riskLevel];
  const RiskIcon = riskStyle.icon;

  // Format audit duration
  const auditTimeLabel = useMemo(() => {
    if (auditDurationMs < 1000) return `${auditDurationMs}ms`;
    return `${(auditDurationMs / 1000).toFixed(1)}s`;
  }, [auditDurationMs]);

  // Score gauge
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (stats.trustScore / 100) * circumference;

  const getStrokeColor = () => {
    if (stats.trustScore >= 80) return "hsl(var(--verified))";
    if (stats.trustScore >= 50) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  };

  const getScoreColor = () => {
    if (stats.trustScore >= 80) return "text-verified";
    if (stats.trustScore >= 50) return "text-warning";
    return "text-destructive";
  };

  const getGlowClass = () => {
    if (stats.trustScore >= 80) return "glow-green";
    if (stats.trustScore >= 50) return "glow-amber";
    return "glow-red";
  };

  if (stats.insufficient) {
    return (
      <div className="space-y-4 animate-fade-in-up">
        <div className="p-5 rounded-xl bg-card border-2 border-border text-center">
          <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-3" />
          <p className="text-sm font-mono font-bold text-foreground">Insufficient data to compute</p>
          <p className="text-xs font-mono text-muted-foreground mt-1">No claims have been analyzed yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-mono font-extrabold tracking-[0.2em] uppercase text-muted-foreground">
          Trust & Explainability
        </h3>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted border border-border">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] font-mono font-bold text-muted-foreground">
            {auditTimeLabel}
          </span>
        </div>
      </div>

      {/* ═══ SCORE GAUGE + VERDICT ═══ */}
      <div className="p-5 rounded-xl bg-card border-2 border-border">
        {/* Gauge */}
        <div className={`relative w-32 h-32 mx-auto ${getGlowClass()} rounded-full`}>
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke={getStrokeColor()}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-extrabold font-mono ${getScoreColor()}`}>
              {stats.trustScore}
            </span>
            <span className="text-[9px] text-muted-foreground font-mono mt-0.5">/ 100</span>
          </div>
        </div>

        {/* Verdict badge */}
        <div className={`flex items-center justify-center gap-2 mt-3 px-3 py-1.5 rounded-lg border ${riskStyle.bg}`}>
          <RiskIcon className={`w-4 h-4 ${riskStyle.color}`} />
          <span className={`text-[10px] font-mono font-extrabold tracking-widest ${riskStyle.color}`}>
            {riskStyle.label}
          </span>
        </div>

        {/* Risk reason */}
        <p className="text-[10px] font-mono text-muted-foreground text-center mt-2 leading-relaxed">
          {stats.riskReason}
        </p>

        {/* "How this is calculated" tooltip */}
        <div className="flex justify-center mt-2">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setFormulaOpen(!formulaOpen)}
                  className="flex items-center gap-1 text-[9px] font-mono text-primary/70 hover:text-primary transition-colors"
                >
                  <Info className="w-3 h-3" />
                  How this is calculated
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs p-3">
                <FormulaExplanation />
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Expandable formula panel */}
        {formulaOpen && (
          <div className="mt-3 p-3 rounded-lg bg-muted/60 border border-border animate-fade-in-up relative">
            <button
              onClick={() => setFormulaOpen(false)}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
            <FormulaExplanation />
          </div>
        )}
      </div>

      {/* ═══ CONFIDENCE DISTRIBUTION ═══ */}
      <div className="p-4 rounded-xl bg-card border-2 border-border">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-mono font-extrabold tracking-widest uppercase text-muted-foreground">
            Verdict Distribution
          </span>
        </div>

        {/* Stacked bar — proportional to actual percentages */}
        <div className="relative w-full h-5 rounded-full overflow-hidden bg-muted border border-border">
          <div className="absolute inset-0 flex">
            {stats.percentages.supported > 0 && (
              <div
                className="h-full bg-verified transition-all duration-700 ease-out"
                style={{ width: `${stats.percentages.supported}%` }}
              />
            )}
            {stats.percentages.contradicted > 0 && (
              <div
                className="h-full bg-destructive transition-all duration-700 ease-out"
                style={{ width: `${stats.percentages.contradicted}%` }}
              />
            )}
            {stats.percentages.unverifiable > 0 && (
              <div
                className="h-full bg-warning transition-all duration-700 ease-out"
                style={{ width: `${stats.percentages.unverifiable}%` }}
              />
            )}
            {stats.percentages.sourceConflict > 0 && (
              <div
                className="h-full bg-conflict transition-all duration-700 ease-out"
                style={{ width: `${stats.percentages.sourceConflict}%` }}
              />
            )}
          </div>
        </div>

        {/* Rounding notice */}
        {stats.roundingAdjusted && (
          <p className="text-[8px] font-mono text-muted-foreground/60 mt-1 text-right">
            * Percentages adjusted by ±1% to sum to exactly 100%
          </p>
        )}

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <BreakdownRow
            icon={<ShieldCheck className="w-3 h-3 text-verified" />}
            label="Supported"
            count={stats.supported}
            pct={stats.percentages.supported}
            color="text-verified"
          />
          <BreakdownRow
            icon={<ShieldAlert className="w-3 h-3 text-destructive" />}
            label="Contradicted"
            count={stats.contradicted}
            pct={stats.percentages.contradicted}
            color="text-destructive"
          />
          <BreakdownRow
            icon={<ShieldQuestion className="w-3 h-3 text-warning" />}
            label="Unverifiable"
            count={stats.unverifiable}
            pct={stats.percentages.unverifiable}
            color="text-warning"
          />
          <BreakdownRow
            icon={<GitCompareArrows className="w-3 h-3 text-conflict" />}
            label="Conflicts"
            count={stats.sourceConflict}
            pct={stats.percentages.sourceConflict}
            color="text-conflict"
          />
        </div>

        {/* Sum verification */}
        <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
          <span className="text-[9px] font-mono text-muted-foreground">Total</span>
          <span className="text-[9px] font-mono font-bold text-foreground">
            {stats.total} claims · {stats.percentages.supported + stats.percentages.contradicted + stats.percentages.unverifiable + stats.percentages.sourceConflict}%
          </span>
        </div>
      </div>

      {/* ═══ RISK ASSESSMENT ═══ */}
      {stats.contradicted > 0 && (
        <div className="p-4 rounded-xl border-2 border-destructive/25 bg-destructive/5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-destructive" />
            <span className="text-[10px] font-mono font-extrabold tracking-widest uppercase text-destructive">
              Risk Assessment
            </span>
            {stats.hasCriticalContradiction && (
              <span className="px-1.5 py-0.5 rounded bg-destructive/20 border border-destructive/30 text-[8px] font-mono font-extrabold text-destructive tracking-wider">
                CRITICAL
              </span>
            )}
          </div>
          <div className="space-y-2">
            {riskDomains.map((domain) => (
              <p key={domain} className="text-xs text-foreground/75 leading-relaxed font-mono">
                <span className="inline-block px-1.5 py-0.5 rounded bg-destructive/10 border border-destructive/20 text-destructive text-[9px] font-extrabold uppercase tracking-wider mr-1.5">
                  {domain}
                </span>
                {RISK_EXPLANATIONS[domain]}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* ═══ AUDIT COMPLETION DETAILS ═══ */}
      <div className="p-3 rounded-lg bg-muted/50 border border-border">
        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
          <span>Claims analyzed</span>
          <span className="font-bold text-foreground">{stats.total}</span>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mt-1">
          <span>Sources referenced</span>
          <span className="font-bold text-foreground">
            {new Set(sentences.flatMap((s) => s.evidenceIds)).size}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mt-1">
          <span>Corrections available</span>
          <span className="font-bold text-verified">
            {sentences.filter((s) => s.correction).length}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mt-1">
          <span>Audit duration</span>
          <span className="font-bold text-foreground">{auditTimeLabel}</span>
        </div>
      </div>
    </div>
  );
};

// ═══ FORMULA EXPLANATION ═══
const FormulaExplanation = () => (
  <div className="space-y-2.5 text-[10px] font-mono">
    <div>
      <p className="font-extrabold text-foreground tracking-wider uppercase mb-1">Trust Score Formula</p>
      <div className="px-2 py-1.5 rounded bg-muted border border-border">
        <code className="text-[9px] text-primary">
          Score = 100 − (Contradicted% × 1.5) − (Unverifiable% × 0.5)
        </code>
      </div>
      <p className="text-muted-foreground mt-1 leading-relaxed">
        Clamped between 0 and 100. Contradictions penalized 3× more than unverifiable claims.
      </p>
    </div>
    <div>
      <p className="font-extrabold text-foreground tracking-wider uppercase mb-1">Risk Classification</p>
      <div className="space-y-1 text-muted-foreground">
        <p><span className="text-destructive font-bold">HIGH</span> → Any CRITICAL contradiction OR contradicted ≥ 30%</p>
        <p><span className="text-warning font-bold">MEDIUM</span> → Contradicted between 10–29%</p>
        <p><span className="text-verified font-bold">LOW</span> → Contradicted &lt; 10%</p>
      </div>
    </div>
    <div>
      <p className="font-extrabold text-foreground tracking-wider uppercase mb-1">Percentages</p>
      <p className="text-muted-foreground leading-relaxed">
        Each % = (count ÷ total) × 100. Largest-remainder rounding ensures all percentages sum to exactly 100%.
      </p>
    </div>
  </div>
);

// ═══ BREAKDOWN ROW ═══
const BreakdownRow = ({
  icon,
  label,
  count,
  pct,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  pct: number;
  color: string;
}) => (
  <div className="flex items-center gap-1.5">
    {icon}
    <span className="text-[10px] font-mono text-muted-foreground flex-1">{label}</span>
    <span className={`text-[10px] font-mono font-extrabold ${color}`}>
      {count}
    </span>
    <span className="text-[9px] font-mono text-muted-foreground">
      ({pct}%)
    </span>
  </div>
);

export default TrustDashboard;
