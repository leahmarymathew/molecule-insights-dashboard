import { Filter, RotateCcw } from "lucide-react";
import type { FilterParams } from "@/types";

interface FilterPanelProps {
  filters: FilterParams;
  onChange: (f: FilterParams) => void;
  onReset: () => void;
  totalCount: number;
  filteredCount: number;
}

export function FilterPanel({
  filters,
  onChange,
  onReset,
  totalCount,
  filteredCount,
}: FilterPanelProps) {
  function set<K extends keyof FilterParams>(key: K, val: FilterParams[K]) {
    onChange({ ...filters, [key]: val });
  }

  const activeCount = [
    filters.minStdCagr !== -Infinity,
    filters.maxCompetitionCount !== 100,
    filters.minRevenue2023 !== 0,
    filters.minRevenue2024 !== 0,
    filters.minRevenue2025 !== 0,
    filters.minRevenueCagr !== -Infinity,
    filters.monopolyMode !== "all",
  ].filter(Boolean).length;

  return (
    <div className="rounded-lg border border-border/60 bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filters</span>
          {activeCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">
            {filteredCount} / {totalCount} molecules
          </span>
          {activeCount > 0 && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <NumericFilter
          label="Min STD CAGR"
          value={filters.minStdCagr}
          onChange={(v) => set("minStdCagr", v)}
          step={0.01}
          placeholder="any"
          noFilterValue={-Infinity}
        />
        <NumericFilter
          label="Max Competition"
          value={filters.maxCompetitionCount}
          onChange={(v) => set("maxCompetitionCount", v)}
          step={1}
          placeholder="100"
        />
        <NumericFilter
          label="Min Revenue 2023"
          value={filters.minRevenue2023}
          onChange={(v) => set("minRevenue2023", v)}
          step={10000}
          placeholder="0"
        />
        <NumericFilter
          label="Min Revenue 2024"
          value={filters.minRevenue2024}
          onChange={(v) => set("minRevenue2024", v)}
          step={10000}
          placeholder="0"
        />
        <NumericFilter
          label="Min Revenue 2025"
          value={filters.minRevenue2025}
          onChange={(v) => set("minRevenue2025", v)}
          step={10000}
          placeholder="0"
        />
        <NumericFilter
          label="Min Rev CAGR %"
          value={filters.minRevenueCagr}
          onChange={(v) => set("minRevenueCagr", v)}
          step={1}
          placeholder="any"
          noFilterValue={-Infinity}
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Monopoly</label>
          <select
            value={filters.monopolyMode}
            onChange={(e) => set("monopolyMode", e.target.value as FilterParams["monopolyMode"])}
            className="h-8 w-full rounded-md border border-border/60 bg-secondary/30 px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All</option>
            <option value="monopoly_only">Monopoly Only</option>
            <option value="exclude_monopoly">Exclude Monopoly</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function NumericFilter({
  label,
  value,
  onChange,
  step,
  placeholder,
  noFilterValue = -Infinity,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
  placeholder: string;
  noFilterValue?: number;
}) {
  const displayValue = value === noFilterValue ? "" : String(value);
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <input
        type="number"
        value={displayValue}
        onChange={(e) => {
          const parsed = parseFloat(e.target.value);
          onChange(isNaN(parsed) ? noFilterValue : parsed);
        }}
        step={step}
        placeholder={placeholder}
        className="h-8 w-full rounded-md border border-border/60 bg-secondary/30 px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
    </div>
  );
}
