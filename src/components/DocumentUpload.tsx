import { Upload, FileText, X, ShieldCheck } from "lucide-react";
import { useState, useCallback } from "react";

interface DocumentUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

const DocumentUpload = ({ files, onFilesChange }: DocumentUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = Array.from(e.dataTransfer.files);
      onFilesChange([...files, ...dropped]);
    },
    [files, onFilesChange]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      onFilesChange([...files, ...selected]);
    }
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-verified" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
            Source Documents
          </h3>
        </div>
        <span className="px-2 py-0.5 rounded bg-verified/15 text-verified text-[10px] font-mono font-bold border border-verified/20">
          {files.length} LOADED
        </span>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? "border-verified bg-verified/5 glow-green"
            : "border-border hover:border-verified/40 hover:bg-muted/50"
        }`}
      >
        <input
          type="file"
          multiple
          accept=".pdf,.txt,.md,.doc,.docx,.json,.csv"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? "text-verified" : "text-muted-foreground"}`} />
        <p className="text-sm font-semibold text-foreground">
          Drop truth-source files here
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          or <span className="text-primary font-semibold underline">browse files</span>
        </p>
        <p className="text-[10px] text-muted-foreground mt-2 font-mono tracking-wider">
          PDF • TXT • MD • DOC • JSON • CSV
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2.5 rounded-md bg-muted border border-border group status-bar-verified"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-3.5 h-3.5 text-verified shrink-0" />
                <span className="text-xs font-mono font-semibold text-foreground truncate">
                  {file.name}
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                  {(file.size / 1024).toFixed(1)}KB
                </span>
              </div>
              <button
                onClick={() => removeFile(i)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
              >
                <X className="w-3.5 h-3.5 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
