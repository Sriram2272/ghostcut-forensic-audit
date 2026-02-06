import { useState, useCallback } from "react";
import type { AuditResult } from "@/lib/audit-types";

export interface AuditSnapshot {
  id: string;
  label: string;
  timestamp: number;
  result: AuditResult;
  durationMs: number;
}

/**
 * Hook to manage audit history for comparison mode.
 * Stores up to 10 audit snapshots in memory.
 */
export function useAuditHistory() {
  const [snapshots, setSnapshots] = useState<AuditSnapshot[]>([]);

  const saveSnapshot = useCallback(
    (result: AuditResult, durationMs: number, label?: string) => {
      const id = `audit-${Date.now()}`;
      const snapshot: AuditSnapshot = {
        id,
        label: label || `Audit ${new Date().toLocaleTimeString()}`,
        timestamp: Date.now(),
        result,
        durationMs,
      };
      setSnapshots((prev) => [...prev.slice(-9), snapshot]); // keep max 10
      return id;
    },
    []
  );

  const removeSnapshot = useCallback((id: string) => {
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clearSnapshots = useCallback(() => {
    setSnapshots([]);
  }, []);

  return { snapshots, saveSnapshot, removeSnapshot, clearSnapshots };
}
