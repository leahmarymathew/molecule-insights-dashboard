import { FlaskConical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { MoleculeAnalytics } from "@/lib/analyzeMolecules";

interface Props {
  data: MoleculeAnalytics[];
}

const n0 = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 0 });
const n2 = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 });
const pct = (v: number) => `${v.toFixed(1)}%`;
const ratio = (v: number) => `${(v * 100).toFixed(1)}%`;

const COLS: { key: keyof MoleculeAnalytics | "Monopoly_Flag"; label: string; align?: string }[] = [
  { key: "Molecule", label: "Molecule" },
  { key: "Competition_Count", label: "Competition", align: "text-right" },
  { key: "Top_Brand", label: "Top Brand" },
  { key: "Dominance_Ratio", label: "Dominance", align: "text-right" },
  { key: "Monopoly_Flag", label: "Monopoly" },
  { key: "Revenue_2025", label: "Revenue 2025", align: "text-right" },
  { key: "STD_2025", label: "STD 2025", align: "text-right" },
  { key: "STD_CAGR", label: "STD CAGR", align: "text-right" },
  { key: "Revenue_per_STD_2025", label: "Rev/STD 2025", align: "text-right" },
  { key: "Revenue_per_STD_CAGR", label: "Rev/STD CAGR", align: "text-right" },
  { key: "Investment_Efficiency", label: "Invest. Eff.", align: "text-right" },
  { key: "Opportunity_Score", label: "Opportunity", align: "text-right" },
];

function renderCell(row: MoleculeAnalytics, key: string) {
  switch (key) {
    case "Molecule": return <span className="font-medium">{row.Molecule}</span>;
    case "Competition_Count": return n0(row.Competition_Count);
    case "Top_Brand": return <span className="text-muted-foreground">{row.Top_Brand}</span>;
    case "Dominance_Ratio": return ratio(row.Dominance_Ratio);
    case "Monopoly_Flag":
      return row.Monopoly_Flag
        ? <Badge className="bg-accent/20 text-accent hover:bg-accent/20">Monopoly</Badge>
        : <Badge variant="outline" className="text-muted-foreground">Competitive</Badge>;
    case "Revenue_2025": return n0(row.Revenue_2025);
    case "STD_2025": return n0(row.STD_2025);
    case "STD_CAGR": return <span className={row.STD_CAGR >= 0 ? "text-primary" : "text-destructive"}>{pct(row.STD_CAGR)}</span>;
    case "Revenue_per_STD_2025": return n2(row.Revenue_per_STD_2025);
    case "Revenue_per_STD_CAGR": return <span className={row.Revenue_per_STD_CAGR >= 0 ? "text-primary" : "text-destructive"}>{pct(row.Revenue_per_STD_CAGR)}</span>;
    case "Investment_Efficiency": return n2(row.Investment_Efficiency);
    case "Opportunity_Score": return <span className="font-semibold text-primary">{n2(row.Opportunity_Score)}</span>;
    default: return null;
  }
}

export function ResultsTable({ data }: Props) {
  const preview = data.slice(0, 200);

  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-base">Molecule Analytics</CardTitle>
        <p className="text-xs text-muted-foreground">
          {data.length > 0 ? `${data.length} molecules · ranked by Opportunity Score` : "No data uploaded yet"}
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border border-border/60">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                {COLS.map((c) => (
                  <TableHead key={c.key} className={`whitespace-nowrap text-xs ${c.align ?? ""}`}>{c.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COLS.length} className="py-16">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <FlaskConical className="h-7 w-7" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">No analytics yet</p>
                        <p className="mt-1 text-xs text-muted-foreground">Upload a dataset to compute molecule-level metrics.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                preview.map((row) => (
                  <TableRow key={row.Molecule} className="border-border/40">
                    {COLS.map((c) => (
                      <TableCell key={c.key} className={`whitespace-nowrap text-xs ${c.align ?? ""}`}>
                        {renderCell(row, c.key)}
                      </TableCell>
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
