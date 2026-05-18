import { useRef, useState, useCallback } from "react";
import { Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
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

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/60 bg-card p-5">
        <h2 className="text-sm font-semibold mb-1 text-foreground">Import IQVIA Dataset</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Upload an Excel file (.xlsx) exported from IQVIA. Required columns: Molecule List,
          International Product, MAT Q2 2023/2024/2025 LCD MNF, MAT Q2 2023/2024/2025 Standard
          Units.
        </p>

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
          onClick={() => !loading && inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors select-none",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border/60 hover:border-primary/50 hover:bg-primary/5",
            loading && "pointer-events-none opacity-60",
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Processing {lastFile}…</p>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Upload className="h-5 w-5" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Drop your Excel file here</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  or click to browse — .xlsx / .xls
                </p>
              </div>
            </>
          )}
        </div>

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

        {error && (
          <div className="mt-3 flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {currentSummary && (
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="text-sm font-medium text-foreground">Dataset loaded</span>
            {lastFile && (
              <span className="ml-auto text-xs text-muted-foreground truncate max-w-40">
                {lastFile}
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Total Rows",
                value: currentSummary.totalRows.toLocaleString(),
              },
              {
                label: "Molecules",
                value: currentSummary.uniqueMolecules.toLocaleString(),
              },
              {
                label: "Brands",
                value: currentSummary.uniqueProducts.toLocaleString(),
              },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-md bg-secondary/30 p-2.5 text-center">
                <p className="text-base font-semibold text-foreground tabular-nums">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
