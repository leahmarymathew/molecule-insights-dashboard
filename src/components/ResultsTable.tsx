import { useState, useMemo, useEffect, useRef } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, FlaskConical, Columns3 } from "lucide-react";
import type { MoleculeAnalytics, SortField, SortDirection } from "@/types";
import { cn } from "@/lib/utils";

interface Column {
  key: SortField | "Flags";
  label: string;
  align?: "right" | "center";
  sortable?: boolean;
}

// Every field the backend returns for a molecule, in both Growth and Revenue
// analyses (they share the exact same result shape — see backend/main.py's
// `compute_analytics`). Both modes can show any of these; only the
// default-visible subset differs per mode.
const ALL_COLUMNS: Column[] = [
  { key: "Molecule", label: "Molecule" },
  { key: "Opportunity_Score", label: "Opp. Score", align: "right" },
  { key: "Competition_Count", label: "Competition", align: "right" },
  { key: "Dominance_Ratio", label: "Dominance", align: "right" },
  { key: "Monopoly_Flag", label: "Monopoly", align: "center" },
  { key: "Revenue_2023", label: "Revenue 2023", align: "right" },
  { key: "Revenue_2024", label: "Revenue 2024", align: "right" },
  { key: "Revenue_2025", label: "Revenue 2025", align: "right" },
  { key: "STD_2023", label: "STD 2023", align: "right" },
  { key: "STD_2024", label: "STD 2024", align: "right" },
  { key: "STD_2025", label: "STD 2025", align: "right" },
  { key: "STD_CAGR", label: "STD CAGR", align: "right" },
  { key: "Revenue_CAGR", label: "Rev CAGR", align: "right" },
  { key: "Flags", label: "Flags", sortable: false },
];

const DEFAULT_VISIBLE: Record<"growth" | "revenue", Set<Column["key"]>> = {
  growth: new Set(["Molecule", "Competition_Count", "Revenue_2025", "STD_2025", "STD_CAGR", "Flags"]),
  revenue: new Set([
    "Molecule",
    "Opportunity_Score",
    "Competition_Count",
    "Dominance_Ratio",
    "Revenue_2025",
    "Revenue_CAGR",
    "Flags",
  ]),
};

function fmtRevenue(v: number) {
  return Math.round(v).toLocaleString();
}

function fmtCagr(v: number) {
  return v.toFixed(2);
}

export const FLAG_STYLES: Record<string, string> = {
  SINGLE_BRAND: "bg-zinc-50 text-zinc-600 border-zinc-200",
  DEAD: "bg-red-100 text-red-700 border-red-200",
  EXITING: "bg-red-50 text-red-600 border-red-200",
  COLLAPSING: "bg-orange-50 text-orange-700 border-orange-200",
  SPIKE: "bg-yellow-50 text-yellow-700 border-yellow-200",
  VOL_DOWN_REV_UP: "bg-violet-50 text-violet-700 border-violet-200",
  HIGH_DOMINANCE: "bg-amber-50 text-amber-700 border-amber-200",
};

export const FLAG_LABELS: Record<string, string> = {
  SINGLE_BRAND: "Single Brand",
  DEAD: "Dead",
  EXITING: "Exiting",
  COLLAPSING: "Collapsing",
  SPIKE: "Spike",
  VOL_DOWN_REV_UP: "Vol↓Rev↑",
  HIGH_DOMINANCE: "High Dominance",
};

function renderCell(col: SortField | "Flags", m: MoleculeAnalytics) {
  switch (col) {
    case "Molecule":
      return (
        <td
          key={col}
          title={m.Molecule}
          className="px-4 py-2.5 font-medium text-foreground max-w-[220px] truncate"
        >
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
              ? "text-emerald-600"
              : m.Opportunity_Score >= 40
                ? "text-amber-600"
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
            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
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
    case "Dominance_Ratio":
      return (
        <td key={col} className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
          {(m.Dominance_Ratio * 100).toFixed(1)}%
        </td>
      );
    case "Flags":
      return (
        <td key={col} className="px-4 py-2.5">
          {m.Flags.length === 0 ? (
            <span className="text-xs text-muted-foreground/40">—</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {m.Flags.map((f) => (
                <span
                  key={f}
                  className={cn(
                    "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border whitespace-nowrap",
                    FLAG_STYLES[f] ?? "bg-muted text-muted-foreground border-border",
                  )}
                >
                  {FLAG_LABELS[f] ?? f}
                </span>
              ))}
            </div>
          )}
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
            v > 0 ? "text-emerald-600" : "text-red-600",
          )}
        >
          {fmtCagr(v)}
        </td>
      );
    }
    default:
      return (
        <td key={col} className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
          {String((m as unknown as Record<string, unknown>)[col] ?? "")}
        </td>
      );
  }
}

function defaultVisibility(mode: "growth" | "revenue") {
  const defaults = DEFAULT_VISIBLE[mode];
  return Object.fromEntries(ALL_COLUMNS.map((c) => [c.key, defaults.has(c.key)]));
}

export function ResultsTable({
  data,
  analysisMode,
  onResetFilters,
  onRowClick,
}: {
  data: MoleculeAnalytics[];
  analysisMode: "growth" | "revenue";
  onResetFilters?: () => void;
  onRowClick?: (molecule: MoleculeAnalytics) => void;
}) {
  const optionalColumns = ALL_COLUMNS.filter((c) => !DEFAULT_VISIBLE[analysisMode].has(c.key));

  const [visible, setVisible] = useState<Record<string, boolean>>(() =>
    defaultVisibility(analysisMode),
  );
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const columnsButtonRef = useRef<HTMLButtonElement>(null);
  const [sortField, setSortField] = useState<SortField>(
    analysisMode === "growth" ? "STD_CAGR" : "Opportunity_Score",
  );
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  useEffect(() => {
    setSortField(analysisMode === "growth" ? "STD_CAGR" : "Opportunity_Score");
    setSortDir("desc");
    setVisible(defaultVisibility(analysisMode));
  }, [analysisMode]);

  useEffect(() => {
    if (!columnsMenuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setColumnsMenuOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setColumnsMenuOpen(false);
        columnsButtonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [columnsMenuOpen]);

  const columns = ALL_COLUMNS.filter((c) => visible[c.key]);

  function toggleSort(field: SortField | "Flags") {
    if (field === "Flags") return;
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field as SortField);
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

  const columnsToggle = optionalColumns.length > 0 && (
    <div className="relative" ref={menuRef}>
      <button
        ref={columnsButtonRef}
        onClick={() => setColumnsMenuOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={columnsMenuOpen}
        className="flex items-center gap-1.5 rounded-md border border-border-strong bg-card px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-secondary hover:border-foreground/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Columns3 className="h-3.5 w-3.5" />
        Columns
      </button>
      {columnsMenuOpen && (
        <div
          role="menu"
          aria-label="Toggle table columns"
          className="absolute right-0 z-10 mt-1 w-48 rounded-md border border-border bg-popover p-2 shadow-md"
        >
          {optionalColumns.map((c) => (
            <label
              key={c.key}
              className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-popover-foreground hover:bg-secondary cursor-pointer"
            >
              <input
                type="checkbox"
                checked={visible[c.key] ?? false}
                onChange={(e) => setVisible((v) => ({ ...v, [c.key]: e.target.checked }))}
                className="h-3.5 w-3.5 accent-primary"
              />
              {c.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );

  if (!data.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 flex flex-col items-center gap-3 text-center">
        <FlaskConical className="h-10 w-10 text-muted-foreground opacity-30" />
        <p className="text-sm text-muted-foreground">No molecules match the current filters.</p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Reset filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-end gap-2 px-4 py-2 border-b border-border">
        {columnsToggle}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              {columns.map(({ key, label, align, sortable = true }) => (
                <th
                  key={key}
                  scope="col"
                  aria-sort={
                    !sortable
                      ? undefined
                      : sortField === key
                        ? sortDir === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                  }
                  className={cn(
                    "px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap",
                    align === "right" && "text-right",
                    align === "center" && "text-center",
                  )}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(key)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        align === "right" && "flex-row-reverse",
                      )}
                    >
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
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1">{label}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((m, i) => (
              <tr
                key={m.Molecule}
                onClick={onRowClick ? () => onRowClick(m) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? "button" : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRowClick(m);
                        }
                      }
                    : undefined
                }
                className={cn(
                  "border-b border-border/60 hover:bg-secondary/30 transition-colors",
                  i % 2 === 1 && "bg-secondary/15",
                  onRowClick && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                )}
              >
                {columns.map(({ key }) => renderCell(key, m))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t border-border bg-secondary/15">
        <span className="text-xs text-muted-foreground">
          {data.length} molecule{data.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
