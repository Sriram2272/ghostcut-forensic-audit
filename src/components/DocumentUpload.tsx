import { Upload, FileText, X } from "lucide-react";
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
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Source Documents</h3>
        <span className="text-xs font-mono text-muted-foreground">
          ({files.length} loaded)
        </span>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
          isDragging
            ? "border-primary bg-primary/5 glow-cyan-sm"
            : "border-border hover:border-primary/40 hover:bg-secondary/50"
        }`}
      >
        <input
          type="file"
          multiple
          accept=".pdf,.txt,.md,.doc,.docx,.json,.csv"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drop source files or{" "}
          <span className="text-primary font-medium">browse</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1 font-mono">
          PDF, TXT, MD, DOC, JSON, CSV
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2 rounded-md bg-secondary border border-border group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs font-mono text-foreground truncate">
                  {file.name}
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {(file.size / 1024).toFixed(1)}KB
                </span>
              </div>
              <button
                onClick={() => removeFile(i)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
              >
                <X className="w-3 h-3 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
