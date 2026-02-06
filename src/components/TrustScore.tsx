import { ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";

interface TrustScoreProps {
  score: number;
  totalClaims: number;
  verifiedClaims: number;
  hallucinatedClaims: number;
  unverifiableClaims: number;
}

const TrustScore = ({
  score,
  totalClaims,
  verifiedClaims,
  hallucinatedClaims,
  unverifiableClaims,
}: TrustScoreProps) => {
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = () => {
    if (score >= 80) return "text-verified";
    if (score >= 50) return "text-warning";
    return "text-destructive";
  };

  const getStrokeColor = () => {
    if (score >= 80) return "hsl(var(--verified))";
    if (score >= 50) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  };

  const getGlowClass = () => {
    if (score >= 80) return "glow-green";
    if (score >= 50) return "glow-amber";
    return "glow-red";
  };

  const getVerdict = () => {
    if (score >= 80) return { text: "LOW RISK", color: "text-verified", bg: "bg-verified/15 border-verified/30" };
    if (score >= 50) return { text: "MEDIUM RISK", color: "text-warning", bg: "bg-warning/15 border-warning/30" };
    return { text: "HIGH RISK", color: "text-destructive", bg: "bg-destructive/15 border-destructive/30" };
  };

  const verdict = getVerdict();

  return (
    <div className="p-6 rounded-xl bg-card border-2 border-border">
      <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-muted-foreground text-center mb-4">
        Trust Verification Score
      </h3>

      {/* Gauge */}
      <div className={`relative w-36 h-36 mx-auto ${getGlowClass()} rounded-full`}>
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
          <span className={`text-4xl font-extrabold font-mono ${getScoreColor()}`}>
            {score}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono mt-0.5">/ 100</span>
        </div>
      </div>

      {/* Verdict badge */}
      <div className={`flex items-center justify-center gap-2 mt-4 px-4 py-2 rounded-lg border ${verdict.bg}`}>
        <ShieldAlert className={`w-4 h-4 ${verdict.color}`} />
        <span className={`text-xs font-mono font-extrabold tracking-widest ${verdict.color}`}>
          {verdict.text}
        </span>
      </div>

      {/* Breakdown */}
      <div className="mt-5 space-y-2.5">
        <MetricRow
          icon={<div className="w-2.5 h-2.5 rounded-full bg-foreground/60" />}
          label="Total Claims Extracted"
          value={totalClaims}
          color="text-foreground"
        />
        <div className="h-px bg-border" />
        <MetricRow
          icon={<ShieldCheck className="w-3.5 h-3.5 text-verified" />}
          label="Verified by Source"
          value={verifiedClaims}
          color="text-verified"
        />
        <MetricRow
          icon={<ShieldAlert className="w-3.5 h-3.5 text-destructive" />}
          label="Hallucinated"
          value={hallucinatedClaims}
          color="text-destructive"
          bold
        />
        <MetricRow
          icon={<ShieldQuestion className="w-3.5 h-3.5 text-warning" />}
          label="Unverifiable"
          value={unverifiableClaims}
          color="text-warning"
        />
      </div>
    </div>
  );
};

const MetricRow = ({
  icon,
  label,
  value,
  color,
  bold,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bold?: boolean;
}) => (
  <div className="flex items-center justify-between text-xs">
    <span className="flex items-center gap-2 text-muted-foreground">
      {icon}
      {label}
    </span>
    <span className={`font-mono font-bold ${color} ${bold ? "text-sm" : ""}`}>
      {value}
    </span>
  </div>
);

export default TrustScore;
