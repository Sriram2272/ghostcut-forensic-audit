interface TrustScoreProps {
  score: number; // 0-100
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
    if (score >= 50) return "";
    return "glow-red";
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-card border border-border">
      <h3 className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
        Trust Score
      </h3>

      {/* Gauge */}
      <div className={`relative w-32 h-32 ${getGlowClass()} rounded-full`}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="6"
          />
          {/* Score arc */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={getStrokeColor()}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold font-mono ${getScoreColor()}`}>
            {score}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">/ 100</span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="w-full space-y-2">
        <MetricRow
          label="Total Claims"
          value={totalClaims}
          color="text-foreground"
        />
        <MetricRow
          label="Verified"
          value={verifiedClaims}
          color="text-verified"
          icon="●"
        />
        <MetricRow
          label="Hallucinated"
          value={hallucinatedClaims}
          color="text-destructive"
          icon="●"
        />
        <MetricRow
          label="Unverifiable"
          value={unverifiableClaims}
          color="text-warning"
          icon="●"
        />
      </div>
    </div>
  );
};

const MetricRow = ({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon?: string;
}) => (
  <div className="flex items-center justify-between text-xs">
    <span className="flex items-center gap-1.5 text-muted-foreground">
      {icon && <span className={`text-[8px] ${color}`}>{icon}</span>}
      {label}
    </span>
    <span className={`font-mono font-semibold ${color}`}>{value}</span>
  </div>
);

export default TrustScore;
