import { useRef, useState, useCallback } from "react";
import { Upload, AlertCircle, Loader2 } from "lucide-react";
import { uploadFile } from "@/services/api";
import type { UploadResponse } from "@/types";
import { cn } from "@/lib/utils";

interface UploadSectionProps {
  onUploadComplete: (res: UploadResponse) => void;
  currentSummary: {
    totalRows: number;
    uniqueMolecules: number;
    uniqueProducts: number;
  } | null;
}

export function UploadSection({ onUploadComplete, currentSummary }: UploadSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        setError("Only .xlsx and .xls files are supported.");
        return;
      }
      setError(null);
      setLoading(true);
      setLastFile(file.name);
      try {
        const result = await uploadFile(file);
        if (!result.success) throw new Error(result.error ?? "Upload failed");
        onUploadComplete(result);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Upload failed. Check that the backend is running.",
        );
      } finally {
        setLoading(false);
      }
    },
    [onUploadComplete],
  );

  const triggerInput = () => !loading && inputRef.current?.click();

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept=".xlsx,.xls"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        e.target.value = "";
      }}
    />
  );

  // Compact bar shown after data is loaded
  if (currentSummary) {
    return (
      <div className="rounded-lg border border-border/60 bg-card px-4 py-2.5 flex items-center gap-4 min-w-0">
        {fileInput}
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
            <span>Processing {lastFile}…</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-xs font-medium text-foreground truncate max-w-52">
                {lastFile ?? "Dataset loaded"}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <span>{currentSummary.totalRows.toLocaleString()} rows</span>
              <span className="opacity-30">·</span>
              <span>{currentSummary.uniqueMolecules.toLocaleString()} molecules</span>
              <span className="opacity-30">·</span>
              <span>{currentSummary.uniqueProducts.toLocaleString()} brands</span>
            </div>
            {error && (
              <div className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <button
              onClick={triggerInput}
              className="ml-auto flex items-center gap-1.5 rounded-md border border-border/60 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors shrink-0"
            >
              <Upload className="h-3 w-3" />
              Replace
            </button>
          </>
        )}
      </div>
    );
  }

  // Full drop zone shown when no data is loaded yet
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
      onClick={triggerInput}
      className={cn(
        "rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2.5 py-14 cursor-pointer transition-colors select-none",
        isDragging
          ? "border-primary/60 bg-primary/5"
          : "border-border/40 hover:border-primary/30 hover:bg-primary/[0.02]",
        loading && "pointer-events-none opacity-60",
      )}
    >
      {fileInput}
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground">Processing {lastFile}…</p>
        </>
      ) : (
        <>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Upload className="h-4 w-4" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Drop IQVIA Excel file here</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              or click to browse &nbsp;·&nbsp; .xlsx / .xls
            </p>
          </div>
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-destructive mt-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
