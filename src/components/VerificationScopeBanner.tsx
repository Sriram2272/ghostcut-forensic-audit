import { ShieldCheck, Lock, FileText } from "lucide-react";

interface VerificationScopeBannerProps {
  documentCount: number;
  variant?: "compact" | "full";
}

const VerificationScopeBanner = ({
  documentCount,
  variant = "compact",
}: VerificationScopeBannerProps) => {
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-verified/8 border border-verified/20">
        <Lock className="w-3 h-3 text-verified" />
        <span className="text-[9px] font-mono font-extrabold tracking-wider text-verified uppercase">
          Scope: Uploaded Docs Only
        </span>
        <span className="text-[9px] font-mono text-muted-foreground">
          ({documentCount})
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border-2 border-verified/25 bg-verified/5 p-3">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="w-4 h-4 text-verified" />
        <span className="text-[10px] font-mono font-extrabold tracking-widest text-verified uppercase">
          Verification Scope: Uploaded Documents Only
        </span>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs text-foreground/70 leading-relaxed">
          All claims are verified <span className="font-bold text-foreground">exclusively</span> against
          user-uploaded source documents. No preloaded data, cached knowledge, demo content, or external
          knowledge bases are used.
        </p>
        <div className="flex items-center gap-3 pt-1">
          <div className="flex items-center gap-1.5">
            <FileText className="w-3 h-3 text-verified" />
            <span className="text-[10px] font-mono font-bold text-verified">
              {documentCount} SOURCE{documentCount !== 1 ? "S" : ""} IN SCOPE
            </span>
          </div>
          <div className="h-3 w-px bg-border" />
          <span className="text-[10px] font-mono text-muted-foreground">
            Claims without source evidence → UNVERIFIABLE
          </span>
        </div>
      </div>
    </div>
  );
};

export default VerificationScopeBanner;
