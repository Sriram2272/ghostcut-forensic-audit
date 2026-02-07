import { useState, useRef, useEffect } from "react";
import { Download, FileText, FileJson, FileSpreadsheet, FileType } from "lucide-react";

export type ExportFormat = "pdf" | "json" | "csv" | "markdown";

interface ExportDropdownProps {
  onExport: (format: ExportFormat) => void;
  disabled?: boolean;
}

const formats: { value: ExportFormat; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: "pdf",
    label: "PDF Report",
    icon: <FileText className="w-3.5 h-3.5" />,
    description: "Full forensic report with charts",
  },
  {
    value: "json",
    label: "JSON",
    icon: <FileJson className="w-3.5 h-3.5" />,
    description: "Structured data for integrations",
  },
  {
    value: "csv",
    label: "CSV",
    icon: <FileSpreadsheet className="w-3.5 h-3.5" />,
    description: "Spreadsheet-compatible table",
  },
  {
    value: "markdown",
    label: "Markdown",
    icon: <FileType className="w-3.5 h-3.5" />,
    description: "Readable report for docs/wikis",
  },
];

const ExportDropdown = ({ onExport, disabled }: ExportDropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title="Export Audit Report"
      >
        <Download className="w-4 h-4 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border-2 border-border bg-card shadow-lg z-[100] overflow-hidden animate-fade-in-up">
          <div className="px-3 py-2 border-b border-border bg-muted">
            <span className="text-[10px] font-mono font-bold tracking-wider text-muted-foreground uppercase">
              Export Format
            </span>
          </div>
          <div className="py-1">
            {formats.map((fmt) => (
              <button
                key={fmt.value}
                onClick={() => {
                  onExport(fmt.value);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors group"
              >
                <div className="w-7 h-7 rounded-md bg-secondary border border-border flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {fmt.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-foreground block">{fmt.label}</span>
                  <span className="text-[10px] text-muted-foreground">{fmt.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportDropdown;
