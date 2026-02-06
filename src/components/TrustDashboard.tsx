import { useMemo } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  GitCompareArrows,
  Clock,
  AlertTriangle,
  Activity,
  TrendingDown,
} from "lucide-react";
import type { AuditSentence } from "@/lib/audit-types";

interface TrustDashboardProps {
  score: number;
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

const TrustDashboard = ({ score, sentences, auditDurationMs }: TrustDashboardProps) => {
  const counts = useMemo(() => {
    const total = sentences.length;
    const supported = sentences.filter((s) => s.status === "supported").length;
    const contradicted = sentences.filter((s) => s.status === "contradicted").length;
    const unverifiable = sentences.filter((s) => s.status === "unverifiable").length;
    const sourceConflict = sentences.filter((s) => s.status === "source_conflict").length;
    return { total, supported, contradicted, unverifiable, sourceConflict };
  }, [sentences]);

  const percentages = useMemo(() => {
    if (counts.total === 0) return { supported: 0, contradicted: 0, unverifiable: 0, sourceConflict: 0 };
    return {
      supported: Math.round((counts.supported / counts.total) * 100),
      contradicted: Math.round((counts.contradicted / counts.total) * 100),
      unverifiable: Math.round((counts.unverifiable / counts.total) * 100),
      sourceConflict: Math.round((counts.sourceConflict / counts.total) * 100),
    };
  }, [counts]);

  const riskDomains = useMemo(() => detectRiskDomains(sentences), [sentences]);

  const riskLevel = useMemo(() => {
    if (score >= 80) return { label: "LOW RISK", color: "text-verified", bg: "bg-verified/12 border-verified/30", icon: ShieldCheck };
    if (score >= 50) return { label: "MEDIUM RISK", color: "text-warning", bg: "bg-warning/12 border-warning/30", icon: AlertTriangle };
    return { label: "HIGH RISK", color: "text-destructive", bg: "bg-destructive/12 border-destructive/30", icon: ShieldAlert };
  }, [score]);

  const RiskIcon = riskLevel.icon;

  // Format audit duration
  const auditTimeLabel = useMemo(() => {
    if (auditDurationMs < 1000) return `${auditDurationMs}ms`;
    return `${(auditDurationMs / 1000).toFixed(1)}s`;
  }, [auditDurationMs]);

  // Score gauge
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getStrokeColor = () => {
    if (score >= 80) return "hsl(var(--verified))";
    if (score >= 50) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  };

  const getScoreColor = () => {
    if (score >= 80) return "text-verified";
    if (score >= 50) return "text-warning";
    return "text-destructive";
  };

  const getGlowClass = () => {
    if (score >= 80) return "glow-green";
    if (score >= 50) return "glow-amber";
    return "glow-red";
  };

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
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="8"
            />
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
              {score}
            </span>
            <span className="text-[9px] text-muted-foreground font-mono mt-0.5">/ 100</span>
          </div>
        </div>

        {/* Verdict badge */}
        <div className={`flex items-center justify-center gap-2 mt-3 px-3 py-1.5 rounded-lg border ${riskLevel.bg}`}>
          <RiskIcon className={`w-4 h-4 ${riskLevel.color}`} />
          <span className={`text-[10px] font-mono font-extrabold tracking-widest ${riskLevel.color}`}>
            {riskLevel.label}
          </span>
        </div>
      </div>

      {/* ═══ CONFIDENCE METER ═══ */}
      <div className="p-4 rounded-xl bg-card border-2 border-border">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-mono font-extrabold tracking-widest uppercase text-muted-foreground">
            Confidence Distribution
          </span>
        </div>

        {/* Stacked bar */}
        <div className="relative w-full h-5 rounded-full overflow-hidden bg-muted border border-border">
          <div className="absolute inset-0 flex">
            {percentages.supported > 0 && (
              <div
                className="h-full bg-verified transition-all duration-700 ease-out"
                style={{ width: `${percentages.supported}%` }}
              />
            )}
            {percentages.contradicted > 0 && (
              <div
                className="h-full bg-destructive transition-all duration-700 ease-out"
                style={{ width: `${percentages.contradicted}%` }}
              />
            )}
            {percentages.unverifiable > 0 && (
              <div
                className="h-full bg-warning transition-all duration-700 ease-out"
                style={{ width: `${percentages.unverifiable}%` }}
              />
            )}
            {percentages.sourceConflict > 0 && (
              <div
                className="h-full bg-conflict transition-all duration-700 ease-out"
                style={{ width: `${percentages.sourceConflict}%` }}
              />
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <BreakdownRow
            icon={<ShieldCheck className="w-3 h-3 text-verified" />}
            label="Supported"
            count={counts.supported}
            pct={percentages.supported}
            color="text-verified"
          />
          <BreakdownRow
            icon={<ShieldAlert className="w-3 h-3 text-destructive" />}
            label="Contradicted"
            count={counts.contradicted}
            pct={percentages.contradicted}
            color="text-destructive"
          />
          <BreakdownRow
            icon={<ShieldQuestion className="w-3 h-3 text-warning" />}
            label="Unverifiable"
            count={counts.unverifiable}
            pct={percentages.unverifiable}
            color="text-warning"
          />
          <BreakdownRow
            icon={<GitCompareArrows className="w-3 h-3 text-conflict" />}
            label="Conflicts"
            count={counts.sourceConflict}
            pct={percentages.sourceConflict}
            color="text-conflict"
          />
        </div>
      </div>

      {/* ═══ RISK EXPLANATION ═══ */}
      {counts.contradicted > 0 && (
        <div className="p-4 rounded-xl border-2 border-destructive/25 bg-destructive/5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-destructive" />
            <span className="text-[10px] font-mono font-extrabold tracking-widest uppercase text-destructive">
              Risk Assessment
            </span>
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
          <span className="font-bold text-foreground">{counts.total}</span>
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
