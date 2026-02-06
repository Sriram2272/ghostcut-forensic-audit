import { useMemo } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  GitCompareArrows,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import type { AuditSnapshot } from "@/hooks/use-audit-history";
import { computeStrictAuditStats } from "@/lib/audit-types";

interface AuditComparisonProps {
  snapshots: AuditSnapshot[];
  onRemoveSnapshot: (id: string) => void;
}

const AuditComparison = ({ snapshots, onRemoveSnapshot }: AuditComparisonProps) => {
  if (snapshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 px-8">
        <GitCompareArrows className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-sm font-mono font-bold text-foreground mb-2">No Audits to Compare</h3>
        <p className="text-xs font-mono text-muted-foreground text-center max-w-md leading-relaxed">
          Run multiple audits and save them to compare trust scores, risk levels, and claim distributions side by side.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4">
      <div className="flex items-center gap-3 mb-6">
        <GitCompareArrows className="w-4 h-4 text-primary" />
        <h2 className="text-xs font-mono font-extrabold tracking-widest uppercase text-foreground">
          Audit Comparison ({snapshots.length})
        </h2>
      </div>

      {/* Comparison cards grid */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(snapshots.length, 3)}, 1fr)` }}>
        {snapshots.map((snapshot, idx) => (
          <ComparisonCard
            key={snapshot.id}
            snapshot={snapshot}
            index={idx}
            onRemove={() => onRemoveSnapshot(snapshot.id)}
            prevSnapshot={idx > 0 ? snapshots[idx - 1] : null}
          />
        ))}
      </div>

      {/* Summary comparison table */}
      {snapshots.length >= 2 && (
        <div className="mt-8">
          <h3 className="text-[10px] font-mono font-extrabold tracking-widest uppercase text-muted-foreground mb-3">
            Comparison Summary
          </h3>
          <ComparisonTable snapshots={snapshots} />
        </div>
      )}
    </div>
  );
};

const ComparisonCard = ({
  snapshot,
  index,
  onRemove,
  prevSnapshot,
}: {
  snapshot: AuditSnapshot;
  index: number;
  onRemove: () => void;
  prevSnapshot: AuditSnapshot | null;
}) => {
  const stats = useMemo(() => computeStrictAuditStats(snapshot.result.sentences), [snapshot]);
  const prevStats = useMemo(
    () => (prevSnapshot ? computeStrictAuditStats(prevSnapshot.result.sentences) : null),
    [prevSnapshot]
  );

  const scoreDelta = prevStats ? stats.trustScore - prevStats.trustScore : null;

  const riskBg =
    stats.riskLevel === "HIGH"
      ? "border-destructive/30 bg-destructive/5"
      : stats.riskLevel === "MEDIUM"
        ? "border-warning/30 bg-warning/5"
        : "border-verified/30 bg-verified/5";

  const riskColor =
    stats.riskLevel === "HIGH"
      ? "text-destructive"
      : stats.riskLevel === "MEDIUM"
        ? "text-warning"
        : "text-verified";

  const scoreColor =
    stats.trustScore >= 80 ? "text-verified" : stats.trustScore >= 50 ? "text-warning" : "text-destructive";

  return (
    <div className={`rounded-xl border-2 ${riskBg} p-4 space-y-4 relative`}>
      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute top-3 right-3 p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
        title="Remove from comparison"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* Header */}
      <div>
        <span className="text-[10px] font-mono font-bold text-muted-foreground">
          #{index + 1}
        </span>
        <h4 className="text-xs font-mono font-bold text-foreground truncate pr-6">
          {snapshot.label}
        </h4>
        <p className="text-[9px] font-mono text-muted-foreground mt-0.5">
          {new Date(snapshot.timestamp).toLocaleString()}
        </p>
      </div>

      {/* Trust Score */}
      <div className="text-center">
        <span className={`text-3xl font-extrabold font-mono ${scoreColor}`}>
          {stats.trustScore}
        </span>
        <span className="text-xs font-mono text-muted-foreground"> / 100</span>
        {scoreDelta !== null && scoreDelta !== 0 && (
          <div className="flex items-center justify-center gap-1 mt-1">
            {scoreDelta > 0 ? (
              <TrendingUp className="w-3 h-3 text-verified" />
            ) : (
              <TrendingDown className="w-3 h-3 text-destructive" />
            )}
            <span
              className={`text-[10px] font-mono font-bold ${
                scoreDelta > 0 ? "text-verified" : "text-destructive"
              }`}
            >
              {scoreDelta > 0 ? "+" : ""}
              {scoreDelta}
            </span>
          </div>
        )}
      </div>

      {/* Risk badge */}
      <div className="flex justify-center">
        <span
          className={`text-[9px] font-mono font-extrabold tracking-widest px-2 py-1 rounded border ${riskBg} ${riskColor}`}
        >
          {stats.riskLevel} RISK
        </span>
      </div>

      {/* Distribution bar */}
      <div className="space-y-2">
        <div className="relative w-full h-3 rounded-full overflow-hidden bg-muted border border-border">
          <div className="absolute inset-0 flex">
            {stats.percentages.supported > 0 && (
              <div className="h-full bg-verified" style={{ width: `${stats.percentages.supported}%` }} />
            )}
            {stats.percentages.contradicted > 0 && (
              <div className="h-full bg-destructive" style={{ width: `${stats.percentages.contradicted}%` }} />
            )}
            {stats.percentages.unverifiable > 0 && (
              <div className="h-full bg-warning" style={{ width: `${stats.percentages.unverifiable}%` }} />
            )}
            {stats.percentages.sourceConflict > 0 && (
              <div className="h-full bg-conflict" style={{ width: `${stats.percentages.sourceConflict}%` }} />
            )}
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-1.5">
          <MiniStat icon={<ShieldCheck className="w-3 h-3 text-verified" />} label="Supported" value={stats.supported} pct={stats.percentages.supported} />
          <MiniStat icon={<ShieldAlert className="w-3 h-3 text-destructive" />} label="Contradicted" value={stats.contradicted} pct={stats.percentages.contradicted} />
          <MiniStat icon={<ShieldQuestion className="w-3 h-3 text-warning" />} label="Unverifiable" value={stats.unverifiable} pct={stats.percentages.unverifiable} />
          <MiniStat icon={<GitCompareArrows className="w-3 h-3 text-conflict" />} label="Conflicts" value={stats.sourceConflict} pct={stats.percentages.sourceConflict} />
        </div>
      </div>

      {/* Meta */}
      <div className="pt-2 border-t border-border space-y-1">
        <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
          <span>Claims</span>
          <span className="font-bold text-foreground">{stats.total}</span>
        </div>
        <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
          <span>Documents</span>
          <span className="font-bold text-foreground">{snapshot.result.documents.length}</span>
        </div>
        <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
          <span>Duration</span>
          <span className="font-bold text-foreground">
            {snapshot.durationMs < 1000 ? `${snapshot.durationMs}ms` : `${(snapshot.durationMs / 1000).toFixed(1)}s`}
          </span>
        </div>
      </div>
    </div>
  );
};

const MiniStat = ({
  icon,
  label,
  value,
  pct,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  pct: number;
}) => (
  <div className="flex items-center gap-1">
    {icon}
    <span className="text-[9px] font-mono text-muted-foreground">{label}</span>
    <span className="text-[9px] font-mono font-bold text-foreground ml-auto">
      {value} ({pct}%)
    </span>
  </div>
);

const ComparisonTable = ({ snapshots }: { snapshots: AuditSnapshot[] }) => {
  const rows = snapshots.map((s, i) => {
    const stats = computeStrictAuditStats(s.result.sentences);
    return { index: i + 1, label: s.label, stats };
  });

  return (
    <div className="overflow-x-auto rounded-lg border-2 border-border">
      <table className="w-full text-[10px] font-mono">
        <thead>
          <tr className="bg-muted border-b border-border">
            <th className="text-left px-3 py-2 font-extrabold text-muted-foreground tracking-wider">#</th>
            <th className="text-left px-3 py-2 font-extrabold text-muted-foreground tracking-wider">Audit</th>
            <th className="text-center px-3 py-2 font-extrabold text-muted-foreground tracking-wider">Score</th>
            <th className="text-center px-3 py-2 font-extrabold text-muted-foreground tracking-wider">Risk</th>
            <th className="text-center px-3 py-2 font-extrabold text-verified tracking-wider">Sup.</th>
            <th className="text-center px-3 py-2 font-extrabold text-destructive tracking-wider">Cont.</th>
            <th className="text-center px-3 py-2 font-extrabold text-warning tracking-wider">Unv.</th>
            <th className="text-center px-3 py-2 font-extrabold text-muted-foreground tracking-wider">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const scoreColor =
              row.stats.trustScore >= 80 ? "text-verified" : row.stats.trustScore >= 50 ? "text-warning" : "text-destructive";
            const riskColor =
              row.stats.riskLevel === "HIGH" ? "text-destructive" : row.stats.riskLevel === "MEDIUM" ? "text-warning" : "text-verified";

            return (
              <tr key={row.index} className="border-b border-border/50 hover:bg-muted/50">
                <td className="px-3 py-2 font-bold">{row.index}</td>
                <td className="px-3 py-2 truncate max-w-[150px]">{row.label}</td>
                <td className={`px-3 py-2 text-center font-extrabold ${scoreColor}`}>{row.stats.trustScore}</td>
                <td className={`px-3 py-2 text-center font-extrabold ${riskColor}`}>{row.stats.riskLevel}</td>
                <td className="px-3 py-2 text-center">{row.stats.percentages.supported}%</td>
                <td className="px-3 py-2 text-center">{row.stats.percentages.contradicted}%</td>
                <td className="px-3 py-2 text-center">{row.stats.percentages.unverifiable}%</td>
                <td className="px-3 py-2 text-center font-bold">{row.stats.total}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AuditComparison;
