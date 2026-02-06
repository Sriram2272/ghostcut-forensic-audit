import { useState, useRef, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  AlertTriangle,
  Flame,
  Info,
  GitCompareArrows,
  FileWarning,
  Wrench,
} from "lucide-react";
import type { AuditSentence, SentenceStatus, HallucinationSeverity } from "@/lib/audit-types";
import VerificationPanel from "@/components/VerificationPanel";
import RetrievedEvidenceTrail from "@/components/RetrievedEvidenceTrail";
import InlineExplanation from "@/components/InlineExplanation";

interface SentenceViewerProps {
  sentences: AuditSentence[];
  selectedId: string | null;
  onSelectSentence: (id: string) => void;
}

const statusConfig: Record<
  SentenceStatus,
  {
    icon: typeof CheckCircle2;
    shield: typeof ShieldCheck;
    label: string;
    color: string;
    bg: string;
    border: string;
    bar: string;
    glow: string;
  }
> = {
  supported: {
    icon: CheckCircle2,
    shield: ShieldCheck,
    label: "SUPPORTED",
    color: "text-verified",
    bg: "bg-verified/8",
    border: "border-verified/25",
    bar: "border-l-[3px] border-l-verified",
    glow: "shadow-[inset_0_0_30px_-12px_hsl(var(--verified)/0.15)]",
  },
  contradicted: {
    icon: XCircle,
    shield: ShieldAlert,
    label: "CONTRADICTED",
    color: "text-destructive",
    bg: "bg-destructive/8",
    border: "border-destructive/25",
    bar: "border-l-[3px] border-l-destructive",
    glow: "shadow-[inset_0_0_30px_-12px_hsl(var(--destructive)/0.15)]",
  },
  unverifiable: {
    icon: HelpCircle,
    shield: ShieldQuestion,
    label: "NO DIRECT EVIDENCE",
    color: "text-warning/80",
    bg: "bg-warning/5",
    border: "border-warning/15",
    bar: "border-l-[3px] border-l-warning/50",
    glow: "shadow-[inset_0_0_25px_-12px_hsl(var(--warning)/0.08)]",
  },
  source_conflict: {
    icon: GitCompareArrows,
    shield: FileWarning,
    label: "SOURCE CONFLICT",
    color: "text-[hsl(var(--conflict))]",
    bg: "bg-[hsl(var(--conflict)/0.08)]",
    border: "border-[hsl(var(--conflict)/0.25)]",
    bar: "border-l-[3px] border-l-[hsl(var(--conflict))]",
    glow: "shadow-[inset_0_0_30px_-12px_hsl(var(--conflict)/0.15)]",
  },
};

const severityConfig: Record<
  HallucinationSeverity,
  {
    icon: typeof Flame;
    label: string;
    color: string;
    bg: string;
    border: string;
  }
> = {
  critical: {
    icon: Flame,
    label: "CRITICAL",
    color: "text-destructive",
    bg: "bg-destructive/15",
    border: "border-destructive/40",
  },
  moderate: {
    icon: AlertTriangle,
    label: "MODERATE",
    color: "text-warning",
    bg: "bg-warning/15",
    border: "border-warning/40",
  },
  minor: {
    icon: Info,
    label: "MINOR",
    color: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border",
  },
};

const SentenceViewer = ({
  sentences,
  selectedId,
  onSelectSentence,
}: SentenceViewerProps) => {
  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedId && selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedId]);

  const counts = {
    supported: sentences.filter((s) => s.status === "supported").length,
    contradicted: sentences.filter((s) => s.status === "contradicted").length,
    unverifiable: sentences.filter((s) => s.status === "unverifiable").length,
    source_conflict: sentences.filter((s) => s.status === "source_conflict").length,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="shrink-0 px-4 py-3 border-b-2 border-border bg-card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-mono font-extrabold tracking-widest uppercase text-foreground">
            LLM Output Analysis
          </h2>
          <span className="text-[10px] font-mono text-muted-foreground">
            {sentences.length} sentences
          </span>
        </div>
        {/* Status summary bar */}
        <div className="flex items-center gap-3">
          <StatusChip
            count={counts.supported}
            label="Supported"
            color="text-verified"
            bg="bg-verified/10 border-verified/20"
          />
          <StatusChip
            count={counts.contradicted}
            label="Contradicted"
            color="text-destructive"
            bg="bg-destructive/10 border-destructive/20"
          />
          <StatusChip
            count={counts.unverifiable}
            label="No Evidence"
            color="text-warning/80"
            bg="bg-warning/8 border-warning/15"
          />
          {counts.source_conflict > 0 && (
            <StatusChip
              count={counts.source_conflict}
              label="Conflicts"
              color="text-[hsl(var(--conflict))]"
              bg="bg-[hsl(var(--conflict)/0.1)] border-[hsl(var(--conflict)/0.2)]"
            />
          )}
        </div>
      </div>

      {/* Sentences list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {sentences.map((sentence, index) => {
          const config = statusConfig[sentence.status];
          const Icon = config.icon;
          const isSelected = selectedId === sentence.id;

          return (
            <div
              key={sentence.id}
              ref={isSelected ? selectedRef : undefined}
              onClick={() => onSelectSentence(sentence.id)}
              className={`
                group relative rounded-lg border-2 cursor-pointer transition-all duration-150
                ${config.bar} ${config.bg}
                ${
                  isSelected
                    ? `${config.border} ${config.glow} ring-1 ring-inset ring-current/10 scale-[1.01]`
                    : `border-transparent hover:${config.border} hover:scale-[1.005]`
                }
              `}
              style={{
                animationDelay: `${index * 40}ms`,
              }}
            >
              <div className="flex items-start gap-3 p-3">
                {/* Index + Icon */}
                <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                  <span className="text-[10px] font-mono font-bold text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm leading-relaxed ${
                      isSelected
                        ? "text-foreground font-semibold"
                        : "text-foreground/85"
                    }`}
                  >
                    {sentence.text}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold tracking-wider ${config.color} ${config.bg} border ${config.border}`}
                    >
                      {sentence.status === "supported"
                        ? `SUPPORTED (Confidence ${(sentence.confidence.low * 100).toFixed(0)}–${(sentence.confidence.high * 100).toFixed(0)}%)`
                        : config.label}
                    </span>
                    
                    {/* Severity badge for contradicted claims */}
                    {sentence.status === "contradicted" && sentence.severity && (
                      <SeverityBadge severity={sentence.severity.level} reasoning={sentence.severity.reasoning} />
                    )}

                    {/* Source conflict badge */}
                    {sentence.status === "source_conflict" && (
                      <SourceConflictBadge explanation={sentence.sourceConflict?.explanation ?? "Sources provide contradictory information."} />
                    )}

                    {/* Correction available badge */}
                    {sentence.status === "contradicted" && sentence.correction && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold tracking-wider border cursor-help text-verified bg-verified/10 border-verified/30">
                        <Wrench className="w-3 h-3" />
                        FIX READY
                    </span>
                    )}

                    {/* Verification disagreement badge — hide for supported to avoid semantic confusion */}
                    {sentence.verification && !sentence.verification.consensus && sentence.status !== "supported" && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold tracking-wider border cursor-help text-[hsl(var(--uncertain))] bg-[hsl(var(--uncertain)/0.1)] border-[hsl(var(--uncertain)/0.3)]">
                        <AlertTriangle className="w-3 h-3" />
                        UNCERTAIN
                      </span>
                    )}

                    <span className="text-[10px] font-mono text-muted-foreground">
                      {(sentence.confidence.low * 100).toFixed(0)}–{(sentence.confidence.high * 100).toFixed(0)}%
                    </span>
                    {sentence.evidenceIds.length > 0 && (
                      <span className="text-[10px] font-mono text-primary">
                        {sentence.evidenceIds.length} source
                        {sentence.evidenceIds.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Inline explanation — always visible */}
                  <InlineExplanation
                    status={sentence.status}
                    reasoning={sentence.reasoning}
                    retrievedEvidence={sentence.retrievedEvidence}
                  />

                  {/* Reasoning (visible when selected) */}
                  {isSelected && (
                    <div className="mt-3 pt-2 border-t border-border/50 animate-fade-in-up">
                      {/* Confidence explanation */}
                      {sentence.confidence.explanation && (
                        <div className="mb-2 px-2 py-1.5 rounded bg-primary/5 border border-primary/15">
                          <p className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest mb-0.5">
                            Confidence {(sentence.confidence.low * 100).toFixed(0)}–{(sentence.confidence.high * 100).toFixed(0)}%
                          </p>
                          <p className="text-[11px] text-foreground/75 leading-relaxed italic">
                            {sentence.confidence.explanation}
                          </p>
                        </div>
                      )}

                      <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-1">
                        Reasoning
                      </p>
                      <p className="text-xs text-foreground/70 leading-relaxed">
                        {sentence.reasoning}
                      </p>

                      {/* Severity reasoning (only for contradicted) */}
                      {sentence.status === "contradicted" && sentence.severity && (
                        <div className="mt-2 pt-2 border-t border-border/30">
                          <p className="text-[10px] font-mono font-bold text-destructive uppercase tracking-widest mb-1">
                            Severity Assessment
                          </p>
                          <p className="text-xs text-foreground/70 leading-relaxed">
                            {sentence.severity.reasoning}
                          </p>
                        </div>
                      )}

                      {/* Source conflict explanation */}
                      {sentence.status === "source_conflict" && sentence.sourceConflict && (
                        <div className="mt-2 pt-2 border-t border-[hsl(var(--conflict)/0.3)]">
                          <div className="flex items-center gap-2 mb-1.5">
                            <GitCompareArrows className="w-3.5 h-3.5 text-[hsl(var(--conflict))]" />
                            <p className="text-[10px] font-mono font-bold text-[hsl(var(--conflict))] uppercase tracking-widest">
                              Source-Level Conflict
                            </p>
                          </div>
                          <p className="text-xs text-foreground/70 leading-relaxed mb-2">
                            {sentence.sourceConflict.explanation}
                          </p>
                          <div className="text-[10px] font-mono text-muted-foreground">
                            ⬅ Click to view both sources side-by-side in the right panel
                          </div>
                        </div>
                      )}

                      {/* Retrieved Evidence Trail */}
                      <RetrievedEvidenceTrail
                        evidence={sentence.retrievedEvidence}
                        status={sentence.status}
                      />

                      {/* Multi-Model Verification Panel */}
                      {sentence.verification && (
                        <div className="mt-3 pt-2 border-t border-border/30">
                          <VerificationPanel verification={sentence.verification} />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selection indicator */}
                <div
                  className={`shrink-0 w-2 h-2 rounded-full mt-1.5 transition-all ${
                    isSelected
                      ? `${config.color.replace("text-", "bg-")} scale-125`
                      : "bg-muted-foreground/20 group-hover:bg-muted-foreground/40"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ═══ SEVERITY BADGE WITH HOVER TOOLTIP ═══
const SeverityBadge = ({
  severity,
  reasoning,
}: {
  severity: HallucinationSeverity;
  reasoning: string;
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = severityConfig[severity];
  const SevIcon = config.icon;

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold tracking-wider border cursor-help ${config.color} ${config.bg} ${config.border}`}
      >
        <SevIcon className="w-3 h-3" />
        {config.label}
      </span>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute left-0 bottom-full mb-2 z-50 w-72 animate-fade-in-up">
          <div className={`rounded-lg border-2 ${config.border} bg-card shadow-2xl p-3`}>
            <div className="flex items-center gap-2 mb-1.5">
              <SevIcon className={`w-4 h-4 ${config.color}`} />
              <span className={`text-[10px] font-mono font-extrabold tracking-widest ${config.color}`}>
                {config.label} SEVERITY
              </span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              {reasoning}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══ SOURCE CONFLICT BADGE WITH HOVER TOOLTIP ═══
const SourceConflictBadge = ({
  explanation,
}: {
  explanation: string;
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold tracking-wider border cursor-help text-[hsl(var(--conflict))] bg-[hsl(var(--conflict)/0.12)] border-[hsl(var(--conflict)/0.35)]"
      >
        <GitCompareArrows className="w-3 h-3" />
        SOURCE CONFLICT
      </span>

      {showTooltip && (
        <div className="absolute left-0 bottom-full mb-2 z-50 w-80 animate-fade-in-up">
          <div className="rounded-lg border-2 border-[hsl(var(--conflict)/0.4)] bg-card shadow-2xl p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <GitCompareArrows className="w-4 h-4 text-[hsl(var(--conflict))]" />
              <span className="text-[10px] font-mono font-extrabold tracking-widest text-[hsl(var(--conflict))]">
                NOT A MODEL HALLUCINATION
              </span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              {explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusChip = ({
  count,
  label,
  color,
  bg,
}: {
  count: number;
  label: string;
  color: string;
  bg: string;
}) => (
  <div
    className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${bg}`}
  >
    <span className={`text-xs font-mono font-extrabold ${color}`}>{count}</span>
    <span className="text-[10px] font-mono text-muted-foreground">{label}</span>
  </div>
);

export default SentenceViewer;
