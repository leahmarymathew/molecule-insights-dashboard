import { useRef, useState } from "react";
import { UploadCloud, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function UploadSection() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [drag, setDrag] = useState(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    setFiles((f) => [...f, ...Array.from(e.dataTransfer.files)]);
  };

  return (
    <Card className="border-border/60 bg-card/60 p-6 backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Upload Molecule Dataset</h3>
          <p className="text-xs text-muted-foreground">SMILES, SDF, MOL, or CSV — up to 100MB</p>
        </div>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setFiles([])} disabled={!files.length}>
          Clear
        </Button>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={`group relative cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition ${
          drag ? "border-primary bg-primary/5" : "border-border/70 hover:border-primary/60 hover:bg-primary/5"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept=".sdf,.mol,.csv,.smi,.txt"
          onChange={(e) => e.target.files && setFiles((f) => [...f, ...Array.from(e.target.files!)])}
        />
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition group-hover:scale-110">
          <UploadCloud className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium">Drop files here or click to browse</p>
        <p className="mt-1 text-xs text-muted-foreground">Batch processing enabled · structure validation included</p>
      </div>

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((f, i) => (
            <li key={i} className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2 text-sm">
              <div className="flex items-center gap-2 truncate">
                <FileText className="h-4 w-4 text-primary" />
                <span className="truncate">{f.name}</span>
                <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</span>
              </div>
              <button
                onClick={() => setFiles((arr) => arr.filter((_, idx) => idx !== i))}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
