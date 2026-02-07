import { useState } from "react";
import { Ghost, Settings, Scissors, AlertTriangle } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import SettingsDialog from "./SettingsDialog";
import ExportDropdown from "./ExportDropdown";
import type { ExportFormat } from "./ExportDropdown";

interface LayoutProps {
  children: React.ReactNode;
  onAudit?: () => void | Promise<void>;
  canAudit?: boolean;
  isAuditing?: boolean;
  onExport?: (format: ExportFormat) => void;
  hasAuditResult?: boolean;
}

const Layout = ({ children, onAudit, canAudit, isAuditing, onExport, hasAuditResult }: LayoutProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background bg-grid-pattern">
      {/* Hazard accent line at very top */}
      <div className="h-1 hazard-stripe" />

      {/* Top navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 sm:px-6 h-16">
          {/* LEFT: Logo + tagline */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 border-2 border-destructive/30 flex items-center justify-center">
                <Ghost className="w-5 h-5 text-destructive" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive animate-pulse-glow" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-foreground leading-none">
                GHOST<span className="text-destructive">CUT</span>
              </h1>
              <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase leading-none mt-0.5">
                Cutting hallucinations out of AI
              </p>
            </div>
          </div>

          {/* CENTER: Primary audit action */}
          <div className="hidden sm:flex items-center gap-3">
            {onAudit && (
              <button
                onClick={onAudit}
                disabled={!canAudit || isAuditing}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-destructive text-destructive-foreground font-bold text-sm tracking-wide transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed glow-red"
              >
                {isAuditing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />
                    AUDITING…
                  </>
                ) : (
                  <>
                    <Scissors className="w-4 h-4" />
                    RUN AUDIT
                  </>
                )}
              </button>
            )}
            {!onAudit && !hasAuditResult && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary border border-border">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <span className="text-xs font-mono font-bold text-warning">
                  HALLUCINATION DETECTION SYSTEM
                </span>
              </div>
            )}
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-2">
            <ExportDropdown
              onExport={(fmt) => onExport?.(fmt)}
              disabled={!hasAuditResult}
            />
            <button
              onClick={() => setSettingsOpen(true)}
              className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center hover:bg-accent transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
            </button>
            <ThemeToggle />
            <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border ml-1">
              <span className="text-[10px] font-mono text-muted-foreground">TEAM</span>
              <span className="text-xs font-bold text-primary">AVENGERS</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative">{children}</main>

      {/* Bottom status bar */}
      <footer className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 sm:px-6 h-8">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-verified animate-pulse" />
              SYSTEM ACTIVE
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              v1.0.0-alpha
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-muted-foreground">
              ENGINE: GHOSTCUT FORENSIC CORE
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
