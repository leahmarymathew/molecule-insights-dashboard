import { useRef, useState } from "react";
import { UploadCloud, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { parseDatasetFile, type DatasetRow } from "@/lib/parseDataset";

interface Props {
  onParsed: (rows: DatasetRow[], file: File) => void;
}

export function UploadSection({ onParsed }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (f: File) => {
    setFile(f);
    setLoading(true);
    setError(null);
    try {
      const rows = await parseDatasetFile(f);
      onParsed(rows, f);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse file");
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  return (
    <Card className="border-border/60 bg-card/60 p-6 backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Upload Dataset</h3>
          <p className="text-xs text-muted-foreground">Excel (.xlsx, .xls) or CSV</p>
        </div>
        {file && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setFile(null); onParsed([], new File([], "")); }}>
            Clear
          </Button>
        )}
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={`group relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition ${
          drag ? "border-primary bg-primary/5" : "border-border/70 hover:border-primary/60 hover:bg-primary/5"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition group-hover:scale-110">
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <UploadCloud className="h-6 w-6" />}
        </div>
        <p className="text-sm font-medium">{loading ? "Parsing…" : "Drop file or click to browse"}</p>
        <p className="mt-1 text-xs text-muted-foreground">First sheet will be parsed automatically</p>
      </div>

      {file && !loading && (
        <div className="mt-4 flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2 text-sm">
          <div className="flex items-center gap-2 truncate">
            <FileText className="h-4 w-4 text-primary" />
            <span className="truncate">{file.name}</span>
            <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
          </div>
          <button onClick={() => { setFile(null); onParsed([], new File([], "")); }} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
    </Card>
  );
}
