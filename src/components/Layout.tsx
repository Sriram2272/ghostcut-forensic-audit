import { Ghost, Shield, Activity } from "lucide-react";

const GhostcutLogo = () => (
  <div className="flex items-center gap-3">
    <div className="relative">
      <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center glow-cyan-sm">
        <Ghost className="w-5 h-5 text-primary" />
      </div>
      <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-verified border-2 border-background" />
    </div>
    <div>
      <h1 className="text-lg font-bold tracking-tight text-foreground">
        GHOST<span className="text-gradient-cyan">CUT</span>
      </h1>
      <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
        Hallucination Auditor
      </p>
    </div>
  </div>
);

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background bg-grid-pattern">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 h-14">
          <GhostcutLogo />

          <nav className="hidden md:flex items-center gap-1">
            <NavItem icon={<Shield className="w-4 h-4" />} label="Audit" active />
            <NavItem icon={<Activity className="w-4 h-4" />} label="History" />
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary border border-border">
              <span className="text-xs font-mono text-muted-foreground">TEAM</span>
              <span className="text-xs font-semibold text-primary">AVENGERS</span>
            </div>
            <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">A</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative">
        {children}
      </main>
    </div>
  );
};

const NavItem = ({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) => (
  <button
    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
      active
        ? "bg-primary/10 text-primary border border-primary/20"
        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
    }`}
  >
    {icon}
    {label}
  </button>
);

export default Layout;
