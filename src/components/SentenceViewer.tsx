import { useRef, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
} from "lucide-react";
import type { AuditSentence, SentenceStatus } from "@/lib/audit-types";

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
    label: "UNVERIFIABLE",
    color: "text-warning",
    bg: "bg-warning/8",
    border: "border-warning/25",
    bar: "border-l-[3px] border-l-warning",
    glow: "shadow-[inset_0_0_30px_-12px_hsl(var(--warning)/0.15)]",
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
            label="Unverifiable"
            color="text-warning"
            bg="bg-warning/10 border-warning/20"
          />
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
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold tracking-wider ${config.color} ${config.bg} border ${config.border}`}
                    >
                      {config.label}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {(sentence.confidence * 100).toFixed(0)}%
                    </span>
                    {sentence.evidenceIds.length > 0 && (
                      <span className="text-[10px] font-mono text-primary">
                        {sentence.evidenceIds.length} source
                        {sentence.evidenceIds.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Reasoning (visible when selected) */}
                  {isSelected && (
                    <div className="mt-3 pt-2 border-t border-border/50 animate-fade-in-up">
                      <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-1">
                        Reasoning
                      </p>
                      <p className="text-xs text-foreground/70 leading-relaxed">
                        {sentence.reasoning}
                      </p>
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
