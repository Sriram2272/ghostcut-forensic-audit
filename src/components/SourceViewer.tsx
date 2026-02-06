import { useRef, useEffect, useMemo } from "react";
import { FileText, ChevronRight } from "lucide-react";
import type { SourceDocument, AuditSentence } from "@/lib/audit-types";

interface SourceViewerProps {
  documents: SourceDocument[];
  selectedSentence: AuditSentence | null;
}

const SourceViewer = ({ documents, selectedSentence }: SourceViewerProps) => {
  const paragraphRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Which paragraph IDs are linked to the selected sentence
  const linkedParagraphIds = useMemo(() => {
    if (!selectedSentence) return new Set<string>();
    return new Set(selectedSentence.evidenceIds);
  }, [selectedSentence]);

  // Auto-scroll to the first matching evidence paragraph
  useEffect(() => {
    if (!selectedSentence || selectedSentence.evidenceIds.length === 0) return;

    const firstEvidenceId = selectedSentence.evidenceIds[0];
    const el = paragraphRefs.current[firstEvidenceId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedSentence]);

  const setRef = (id: string) => (el: HTMLDivElement | null) => {
    paragraphRefs.current[id] = el;
  };

  // Status color for the highlight border
  const getHighlightStyle = () => {
    if (!selectedSentence) return {};
    switch (selectedSentence.status) {
      case "supported":
        return {
          borderColor: "hsl(var(--verified))",
          bgClass: "bg-verified/10",
          glowClass: "glow-green",
          labelColor: "text-verified",
          label: "SUPPORTING EVIDENCE",
        };
      case "contradicted":
        return {
          borderColor: "hsl(var(--destructive))",
          bgClass: "bg-destructive/10",
          glowClass: "glow-red",
          labelColor: "text-destructive",
          label: "CONTRADICTING EVIDENCE",
        };
      case "unverifiable":
        return {
          borderColor: "hsl(var(--warning))",
          bgClass: "bg-warning/10",
          glowClass: "glow-amber",
          labelColor: "text-warning",
          label: "PARTIAL REFERENCE",
        };
    }
  };

  const highlightStyle = getHighlightStyle();

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="shrink-0 px-4 py-3 border-b-2 border-border bg-card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-mono font-extrabold tracking-widest uppercase text-foreground">
            Source Knowledge Base
          </h2>
          <span className="text-[10px] font-mono text-muted-foreground">
            {documents.length} documents
          </span>
        </div>
        {/* Active link indicator */}
        {selectedSentence ? (
          <div
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md ${highlightStyle?.bgClass} border border-current/10`}
          >
            <ChevronRight className={`w-3 h-3 ${highlightStyle?.labelColor}`} />
            <span
              className={`text-[10px] font-mono font-extrabold tracking-wider ${highlightStyle?.labelColor}`}
            >
              {highlightStyle?.label}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground ml-auto">
              Sentence #{selectedSentence.id.replace("s", "")}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-muted border border-border">
            <span className="text-[10px] font-mono text-muted-foreground">
              ← Click a sentence to locate evidence
            </span>
          </div>
        )}
      </div>

      {/* Documents scroll area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {documents.map((doc) => (
          <div key={doc.id} className="space-y-1">
            {/* Document name header */}
            <div className="sticky top-0 z-10 flex items-center gap-2 px-3 py-2 rounded-lg bg-card border-2 border-border mb-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono font-bold text-foreground">
                {doc.name}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground uppercase ml-auto">
                {doc.type}
              </span>
            </div>

            {/* Paragraphs */}
            {doc.paragraphs.map((para) => {
              const isEvidence = linkedParagraphIds.has(para.id);

              return (
                <div
                  key={para.id}
                  ref={setRef(para.id)}
                  className={`
                    relative rounded-lg px-4 py-3 transition-all duration-300
                    ${
                      isEvidence
                        ? `${highlightStyle?.bgClass} border-2 ${highlightStyle?.glowClass} animate-fade-in-up`
                        : "border-2 border-transparent"
                    }
                  `}
                  style={
                    isEvidence
                      ? {
                          borderColor: highlightStyle?.borderColor,
                        }
                      : undefined
                  }
                >
                  {/* Evidence label */}
                  {isEvidence && (
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full animate-pulse-glow"
                        style={{ backgroundColor: highlightStyle?.borderColor }}
                      />
                      <span
                        className={`text-[9px] font-mono font-extrabold tracking-widest uppercase ${highlightStyle?.labelColor}`}
                      >
                        Evidence Match
                      </span>
                    </div>
                  )}

                  <p
                    className={`text-sm leading-relaxed font-mono whitespace-pre-line ${
                      isEvidence
                        ? "text-foreground font-medium"
                        : "text-foreground/50"
                    }`}
                  >
                    {para.text}
                  </p>

                  {/* Paragraph ID */}
                  <span className="absolute top-2 right-3 text-[9px] font-mono text-muted-foreground/40">
                    §{para.id}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SourceViewer;
