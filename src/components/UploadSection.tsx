import { useRef, useState, useCallback } from "react";
import { Upload, AlertCircle, Loader2 } from "lucide-react";
import { uploadFile } from "@/services/api";
import type { UploadResponse } from "@/types";
import { cn } from "@/lib/utils";

interface UploadSectionProps {
  onUploadComplete: (res: UploadResponse) => void;
  onLoadingChange?: (loading: boolean) => void;
  currentSummary: {
    totalRows: number;
    uniqueMolecules: number;
    uniqueProducts: number;
  } | null;
  isDefaultDataset?: boolean;
}

export function UploadSection({
  onUploadComplete,
  onLoadingChange,
  currentSummary,
  isDefaultDataset = false,
}: UploadSectionProps) {
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
      onLoadingChange?.(true);
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
        onLoadingChange?.(false);
      }
    },
    [onUploadComplete, onLoadingChange],
  );

  const triggerInput = () => !loading && inputRef.current?.click();

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept=".xlsx,.xls"
      aria-label="Upload IQVIA Excel file"
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
      <div className="rounded-lg border border-border bg-card px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 min-w-0">
        {fileInput}
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
            <span>Processing {lastFile}…</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full shrink-0",
                  isDefaultDataset ? "bg-sky-500" : "bg-emerald-500",
                )}
              />
              <span className="text-xs font-medium text-foreground truncate max-w-52">
                {isDefaultDataset ? "Using: Default dataset" : (lastFile ?? "Dataset loaded")}
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
              className="ml-auto flex items-center gap-1.5 rounded-md border border-border-strong bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-secondary hover:border-foreground/40 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Upload className="h-3.5 w-3.5" />
              {isDefaultDataset ? "Replace with your own file" : "Replace"}
            </button>
          </>
        )}
      </div>
    );
  }

  // Full drop zone shown when no data is loaded yet
  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        className={cn(
          "rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-3 py-14 transition-colors select-none",
          isDragging
            ? "border-primary/60 bg-primary/5"
            : "border-border hover:border-primary/40 hover:bg-primary/[0.02]",
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
              <p className="text-xs text-muted-foreground mt-0.5">or drag &amp; drop .xlsx / .xls</p>
            </div>
            <button
              type="button"
              onClick={triggerInput}
              className="mt-1 flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Upload className="h-3.5 w-3.5" />
              Browse Files
            </button>
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-destructive mt-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </>
        )}
      </div>
      <div className="rounded-lg border border-border/60 bg-secondary/20 px-4 py-3">
        <p className="text-xs font-medium text-foreground mb-1">Expected columns</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Molecule List · International Product · MAT Q2 2023/2024/2025_LCD MNF (revenue) · MAT
          Q2 2023/2024/2025_Standard Units
        </p>
      </div>
    </div>
  );
}
