import { useState, useMemo, useEffect } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, FlaskConical } from "lucide-react";
import type { MoleculeAnalytics, SortField, SortDirection } from "@/types";
import { cn } from "@/lib/utils";

interface Column {
  key: SortField;
  label: string;
  align?: "right" | "center";
}

const GROWTH_COLUMNS: Column[] = [
  { key: "Molecule", label: "Molecule" },
  { key: "Competition_Count", label: "Competition", align: "right" },
  { key: "Monopoly_Flag", label: "Monopoly", align: "center" },
  { key: "Revenue_2023", label: "Revenue 2023", align: "right" },
  { key: "Revenue_2024", label: "Revenue 2024", align: "right" },
  { key: "Revenue_2025", label: "Revenue 2025", align: "right" },
  { key: "STD_2023", label: "STD 2023", align: "right" },
  { key: "STD_2024", label: "STD 2024", align: "right" },
  { key: "STD_2025", label: "STD 2025", align: "right" },
  { key: "STD_CAGR", label: "STD CAGR", align: "right" },
];

const REVENUE_COLUMNS: Column[] = [
  { key: "Molecule", label: "Molecule" },
  { key: "Opportunity_Score", label: "Opp. Score", align: "right" },
  { key: "Competition_Count", label: "Competition", align: "right" },
  { key: "Monopoly_Flag", label: "Monopoly", align: "center" },
  { key: "Revenue_2023", label: "Revenue 2023", align: "right" },
  { key: "Revenue_2024", label: "Revenue 2024", align: "right" },
  { key: "Revenue_2025", label: "Revenue 2025", align: "right" },
  { key: "STD_CAGR", label: "STD CAGR", align: "right" },
  { key: "Revenue_CAGR", label: "Rev CAGR", align: "right" },
];

function fmtRevenue(v: number) {
  return Math.round(v).toLocaleString();
}

function fmtCagr(v: number) {
  return v.toFixed(2);
}

function renderCell(col: SortField, m: MoleculeAnalytics) {
  switch (col) {
    case "Molecule":
      return (
        <td key={col} className="px-4 py-2.5 font-medium text-foreground whitespace-nowrap">
          {m.Molecule}
        </td>
      );
    case "Opportunity_Score":
      return (
        <td
          key={col}
          className={cn(
            "px-4 py-2.5 text-right tabular-nums font-semibold",
            m.Opportunity_Score >= 60
              ? "text-emerald-400"
              : m.Opportunity_Score >= 40
                ? "text-yellow-400"
                : "text-muted-foreground",
          )}
        >
          {m.Opportunity_Score.toFixed(1)}
        </td>
      );
    case "Competition_Count":
      return (
        <td key={col} className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
          {m.Competition_Count}
        </td>
      );
    case "Monopoly_Flag":
      return (
        <td key={col} className="px-4 py-2.5 text-center">
          {m.Monopoly_Flag ? (
            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-red-400/10 text-red-400 border border-red-400/20 whitespace-nowrap">
              Monopoly
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/40">—</span>
          )}
        </td>
      );
    case "Revenue_2023":
    case "Revenue_2024":
    case "Revenue_2025":
      return (
        <td key={col} className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
          {fmtRevenue(m[col] as number)}
        </td>
      );
    case "STD_2023":
    case "STD_2024":
    case "STD_2025":
      return (
        <td key={col} className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
          {Math.round(m[col] as number).toLocaleString()}
        </td>
      );
    case "STD_CAGR":
    case "Revenue_CAGR": {
      const v = m[col] as number;
      return (
        <td
          key={col}
          className={cn(
            "px-4 py-2.5 text-right tabular-nums font-medium",
            v > 0 ? "text-emerald-400" : "text-red-400",
          )}
        >
          {fmtCagr(v)}
        </td>
      );
    }
    default:
      return (
        <td key={col} className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
          {String((m as Record<string, unknown>)[col] ?? "")}
        </td>
      );
  }
}

export function ResultsTable({
  data,
  analysisMode,
}: {
  data: MoleculeAnalytics[];
  analysisMode: "growth" | "revenue";
}) {
  const columns = analysisMode === "growth" ? GROWTH_COLUMNS : REVENUE_COLUMNS;
  const [sortField, setSortField] = useState<SortField>(
    analysisMode === "growth" ? "STD_CAGR" : "Opportunity_Score",
  );
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  useEffect(() => {
    setSortField(analysisMode === "growth" ? "STD_CAGR" : "Opportunity_Score");
    setSortDir("desc");
  }, [analysisMode]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  const sorted = useMemo(
    () =>
      [...data].sort((a, b) => {
        const av = a[sortField];
        const bv = b[sortField];
        const mult = sortDir === "asc" ? 1 : -1;
        if (typeof av === "boolean" && typeof bv === "boolean") {
          return mult * (Number(av) - Number(bv));
        }
        if (typeof av === "number" && typeof bv === "number") {
          return mult * (av - bv);
        }
        if (typeof av === "string" && typeof bv === "string") {
          return mult * av.localeCompare(bv);
        }
        return 0;
      }),
    [data, sortField, sortDir],
  );

  if (!data.length) {
    return (
      <div className="rounded-lg border border-border/60 bg-card p-12 flex flex-col items-center gap-3 text-center">
        <FlaskConical className="h-10 w-10 text-muted-foreground opacity-30" />
        <p className="text-sm text-muted-foreground">No molecules match the current filters.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-secondary/20">
              {columns.map(({ key, label, align }) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className={cn(
                    "px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground cursor-pointer select-none hover:text-foreground whitespace-nowrap transition-colors",
                    align === "right" && "text-right",
                    align === "center" && "text-center",
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {align === "right" && (
                      <>
                        {sortField === key ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-30" />
                        )}
                        {label}
                      </>
                    )}
                    {align !== "right" && (
                      <>
                        {label}
                        {sortField === key ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-30" />
                        )}
                      </>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((m, i) => (
              <tr
                key={m.Molecule}
                className={cn(
                  "border-b border-border/40 hover:bg-secondary/20 transition-colors",
                  i % 2 === 1 && "bg-secondary/10",
                )}
              >
                {columns.map(({ key }) => renderCell(key, m))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t border-border/40 bg-secondary/10">
        <span className="text-xs text-muted-foreground">
          {data.length} molecule{data.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
