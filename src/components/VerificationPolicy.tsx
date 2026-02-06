import {
  ShieldCheck,
  Lock,
  Globe,
  Search,
  Ban,
  FileText,
  CheckCircle2,
} from "lucide-react";

const policyRows: {
  label: string;
  value: string;
  icon: typeof Lock;
  status: "enforced" | "disabled";
}[] = [
  {
    label: "Source Scope",
    value: "Uploaded documents only",
    icon: FileText,
    status: "enforced",
  },
  {
    label: "External Knowledge",
    value: "Disabled",
    icon: Globe,
    status: "disabled",
  },
  {
    label: "Internet Search",
    value: "Disabled",
    icon: Search,
    status: "disabled",
  },
  {
    label: "Hallucination Tolerance",
    value: "Zero",
    icon: Ban,
    status: "enforced",
  },
];

const VerificationPolicy = () => {
  return (
    <div className="rounded-xl border-2 border-verified/20 bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-verified/6 border-b-2 border-verified/15">
        <div className="w-7 h-7 rounded-md bg-verified/15 border border-verified/25 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-verified" />
        </div>
        <div>
          <h3 className="text-xs font-mono font-extrabold tracking-widest uppercase text-foreground">
            Verification Policy
          </h3>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
            Forensic isolation guarantees
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-md bg-verified/12 border border-verified/20">
          <Lock className="w-3 h-3 text-verified" />
          <span className="text-[9px] font-mono font-extrabold tracking-wider text-verified uppercase">
            Active
          </span>
        </div>
      </div>

      {/* Policy rows */}
      <div className="divide-y divide-border">
        {policyRows.map((row) => {
          const Icon = row.icon;
          const isDisabled = row.status === "disabled";

          return (
            <div
              key={row.label}
              className="flex items-center gap-3 px-4 py-2.5"
            >
              <Icon
                className={`w-3.5 h-3.5 shrink-0 ${
                  isDisabled ? "text-destructive/70" : "text-verified"
                }`}
              />
              <span className="text-xs font-mono font-semibold text-foreground flex-1">
                {row.label}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[9px] font-mono font-extrabold tracking-wider border ${
                  isDisabled
                    ? "text-destructive bg-destructive/8 border-destructive/20"
                    : "text-verified bg-verified/8 border-verified/20"
                }`}
              >
                {row.value.toUpperCase()}
              </span>
              {isDisabled ? (
                <Ban className="w-3 h-3 text-destructive/50" />
              ) : (
                <CheckCircle2 className="w-3 h-3 text-verified/70" />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer assurance */}
      <div className="px-4 py-2.5 bg-muted/50 border-t border-border">
        <p className="text-[10px] font-mono text-muted-foreground leading-relaxed text-center">
          No external facts, cached results, or global knowledge bases influence
          verification. All claims are judged{" "}
          <span className="font-bold text-foreground">solely</span> against
          your uploaded source documents.
        </p>
      </div>
    </div>
  );
};

export default VerificationPolicy;
