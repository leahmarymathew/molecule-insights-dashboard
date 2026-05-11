import { FlaskConical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EXPECTED_COLUMNS, type DatasetRow } from "@/lib/parseDataset";

interface Props {
  rows: DatasetRow[];
}

const fmt = (v: string | number | null) => {
  if (v === null || v === "") return "—";
  if (typeof v === "number") return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return v;
};

export function ResultsTable({ rows }: Props) {
  const preview = rows.slice(0, 100);

  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-base">Raw Dataset Preview</CardTitle>
        <p className="text-xs text-muted-foreground">
          {rows.length > 0 ? `Showing first ${preview.length} of ${rows.length} rows` : "No data uploaded yet"}
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border border-border/60">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                {EXPECTED_COLUMNS.map((c) => (
                  <TableHead key={c} className="whitespace-nowrap text-xs">{c}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={EXPECTED_COLUMNS.length} className="py-16">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <FlaskConical className="h-7 w-7" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">No results yet</p>
                        <p className="mt-1 text-xs text-muted-foreground">Upload a file to preview the parsed data.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                preview.map((r, i) => (
                  <TableRow key={i} className="border-border/40">
                    {EXPECTED_COLUMNS.map((c) => (
                      <TableCell key={c} className="whitespace-nowrap text-xs">{fmt(r[c])}</TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
