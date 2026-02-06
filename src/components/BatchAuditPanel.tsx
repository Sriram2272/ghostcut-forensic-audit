import { useState, useCallback } from "react";
import { Plus, Trash2, Play, Layers, GripVertical, FileText, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export interface BatchItem {
  id: string;
  label: string;
  text: string;
}

export interface BatchProgress {
  currentIndex: number;
  totalItems: number;
  currentLabel: string;
  claimsCompleted: number;
  claimsTotal: number;
}

interface BatchAuditPanelProps {
  items: BatchItem[];
  onItemsChange: (items: BatchItem[]) => void;
  onRunBatch: () => void;
  isRunning: boolean;
  progress: BatchProgress | null;
  fileCount: number;
}

const BatchAuditPanel = ({
  items,
  onItemsChange,
  onRunBatch,
  isRunning,
  progress,
  fileCount,
}: BatchAuditPanelProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addItem = useCallback(() => {
    const id = `batch-${Date.now()}`;
    const newItem: BatchItem = {
      id,
      label: `LLM Output #${items.length + 1}`,
      text: "",
    };
    onItemsChange([...items, newItem]);
    setExpandedId(id);
  }, [items, onItemsChange]);

  const updateItem = useCallback(
    (id: string, updates: Partial<BatchItem>) => {
      onItemsChange(items.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    },
    [items, onItemsChange]
  );

  const removeItem = useCallback(
    (id: string) => {
      onItemsChange(items.filter((item) => item.id !== id));
      if (expandedId === id) setExpandedId(null);
    },
    [items, onItemsChange, expandedId]
  );

  const validCount = items.filter((i) => i.text.trim().length > 0).length;
  const canRun = validCount >= 1 && fileCount > 0 && !isRunning;

  const overallPct = progress
    ? ((progress.currentIndex / progress.totalItems) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
            Batch Audit Queue
          </h3>
        </div>
        <span className="px-2 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-mono font-bold border border-primary/20">
          {validCount} / {items.length} READY
        </span>
      </div>

      <p className="text-xs font-mono text-muted-foreground leading-relaxed">
        Queue multiple LLM outputs to audit against the same source documents.
        Each result is auto-saved for side-by-side comparison.
      </p>

      {/* Progress bar during batch run */}
      {isRunning && progress && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-primary font-bold flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              Auditing: {progress.currentLabel}
            </span>
            <span className="text-muted-foreground">
              {progress.currentIndex} / {progress.totalItems}
            </span>
          </div>
          <Progress value={overallPct} className="h-2" />
          {progress.claimsTotal > 0 && (
            <div className="text-[9px] font-mono text-muted-foreground">
              Claims verified: {progress.claimsCompleted} / {progress.claimsTotal}
            </div>
          )}
        </div>
      )}

      {/* Item list */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {items.map((item, idx) => {
          const isExpanded = expandedId === item.id;
          const wordCount = item.text.trim() ? item.text.trim().split(/\s+/).length : 0;
          const isValid = item.text.trim().length > 0;
          const isCurrentlyRunning = isRunning && progress?.currentIndex === idx;

          return (
            <div
              key={item.id}
              className={`rounded-lg border-2 transition-all ${
                isCurrentlyRunning
                  ? "border-primary bg-primary/5 shadow-sm"
                  : isValid
                    ? "border-verified/30 bg-verified/5"
                    : "border-border bg-card"
              }`}
            >
              {/* Item header row */}
              <div
                className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <GripVertical className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                <span className="text-[10px] font-mono font-bold text-muted-foreground w-5 shrink-0">
                  #{idx + 1}
                </span>

                {isCurrentlyRunning && (
                  <Loader2 className="w-3 h-3 text-primary animate-spin shrink-0" />
                )}

                <input
                  type="text"
                  value={item.label}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateItem(item.id, { label: e.target.value })}
                  className="flex-1 text-xs font-mono font-semibold bg-transparent text-foreground border-none outline-none placeholder:text-muted-foreground min-w-0"
                  placeholder="Label this output..."
                  disabled={isRunning}
                />

                <div className="flex items-center gap-2 shrink-0">
                  {isValid && (
                    <span className="text-[9px] font-mono text-verified font-bold">
                      {wordCount}w
                    </span>
                  )}
                  {!isValid && (
                    <span className="text-[9px] font-mono text-muted-foreground">empty</span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(item.id);
                    }}
                    disabled={isRunning}
                    className="p-1 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive disabled:opacity-40"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Expanded textarea */}
              {isExpanded && (
                <div className="px-3 pb-3">
                  <textarea
                    value={item.text}
                    onChange={(e) => updateItem(item.id, { text: e.target.value })}
                    placeholder="Paste LLM-generated text to audit…"
                    disabled={isRunning}
                    className="w-full min-h-[120px] px-3 py-2 rounded-md bg-muted border border-border text-xs text-foreground placeholder:text-muted-foreground font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all disabled:opacity-50"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add + Run buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={addItem}
          disabled={isRunning}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border-2 border-dashed border-border text-xs font-mono font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
          Add LLM Output
        </button>

        <button
          onClick={onRunBatch}
          disabled={!canRun}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-destructive text-destructive-foreground font-bold text-xs tracking-wide transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed glow-red"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              RUNNING…
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              RUN BATCH ({validCount})
            </>
          )}
        </button>
      </div>

      {/* Requirements warning */}
      {fileCount === 0 && items.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-warning/10 border border-warning/20">
          <FileText className="w-3.5 h-3.5 text-warning shrink-0" />
          <p className="text-xs text-warning font-mono">
            Upload source documents before running batch audit
          </p>
        </div>
      )}
    </div>
  );
};

export default BatchAuditPanel;
