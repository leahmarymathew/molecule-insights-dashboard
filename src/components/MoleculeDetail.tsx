import { useMemo } from "react";
import { ArrowLeft, Target, Users, ShieldAlert, TrendingUp, Download, AlertTriangle } from "lucide-react";
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { BrandDetail, MoleculeAnalytics, SectorSplit, InnovationMix, BrandTrend } from "@/types";
import { KpiCard } from "@/components/KpiCard";
import { FLAG_STYLES, FLAG_LABELS } from "@/components/ResultsTable";
import { cn } from "@/lib/utils";

interface MoleculeDetailProps {
  molecule: MoleculeAnalytics;
  onBack: () => void;
}

function fmtRevenue(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function fmtRevenueExact(v: number) {
  return `$${Math.round(v).toLocaleString()}`;
}

const TREND_STYLES: Record<BrandTrend, string> = {
  LEADING: "bg-emerald-50 text-emerald-700 border-emerald-200",
  RISING: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DECLINING: "bg-red-50 text-red-700 border-red-200",
  NEW_ENTRANT: "bg-blue-50 text-blue-700 border-blue-200",
  STABLE: "bg-zinc-50 text-zinc-600 border-zinc-200",
};

const TREND_LABELS: Record<BrandTrend, string> = {
  LEADING: "Leading",
  RISING: "Rising",
  DECLINING: "Declining",
  NEW_ENTRANT: "New Entrant",
  STABLE: "Stable",
};

function fmtUnits(v: number) {
  return Math.round(v).toLocaleString();
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
}

function exportBrandsCsv(molecule: MoleculeAnalytics, brands: BrandDetail[]) {
  if (!brands.length) return;
  const rows = brands.map((b) => ({
    Rank: b.Brand_Rank,
    Trend: b.Trend.join(" / "),
    Brand: b.Brand,
    Manufacturer: b.Manufacturer,
    Corporation: b.Corporation,
    Revenue_2023: b.Revenue_2023,
    Revenue_2024: b.Revenue_2024,
    Revenue_2025: b.Revenue_2025,
    Market_Share_Pct: +(b.Market_Share * 100).toFixed(1),
    CAGR_Pct: b.Brand_CAGR === null ? "" : b.Brand_CAGR.toFixed(1),
    Also_Owns: b.Also_Owns.join("; "),
  }));
  const sheet = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(sheet);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizeFilename(molecule.Molecule)}_brands.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  fontSize: "11px",
  color: "var(--foreground)",
  padding: "8px 10px",
  outline: "none",
  boxShadow: "none",
};

const AXIS_TICK = { fontSize: 10, fill: "var(--muted-foreground)" } as const;

interface SplitSegment {
  key: string;
  label: string;
  value: number;
  color: string;
}

function SplitBar({
  title,
  subtitle,
  segments,
}: {
  title: string;
  subtitle?: string;
  segments: SplitSegment[];
}) {
  const visible = segments.filter((s) => s.value > 0);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {subtitle && <p className="mb-3 text-xs text-muted-foreground/80">{subtitle}</p>}
      {visible.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground/60">No revenue data available.</p>
      ) : (
        <>
          <div
            className="flex h-3 w-full overflow-hidden rounded-full border border-border"
            role="img"
            aria-label={visible.map((s) => `${s.label} ${(s.value * 100).toFixed(0)}%`).join(", ")}
          >
            {visible.map((s) => (
              <div
                key={s.key}
                style={{ width: `${s.value * 100}%`, backgroundColor: s.color }}
                title={`${s.label}: ${(s.value * 100).toFixed(1)}%`}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {visible.map((s) => (
              <span
                key={s.key}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {(s.value * 100).toFixed(1)}%
                </span>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function sectorSegments(split: SectorSplit): SplitSegment[] {
  return [
    { key: "HOSPITAL", label: "Hospital", value: split.HOSPITAL, color: "var(--chart-1)" },
    { key: "RETAIL", label: "Retail", value: split.RETAIL, color: "var(--chart-2)" },
    { key: "UNKNOWN", label: "Unknown", value: split.UNKNOWN, color: "var(--border-strong)" },
  ];
}

function innovationSegments(mix: InnovationMix): SplitSegment[] {
  return [
    {
      key: "INNOVATIVE_BRANDED_PRODUCTS",
      label: "Innovative Branded",
      value: mix.INNOVATIVE_BRANDED_PRODUCTS,
      color: "var(--chart-1)",
    },
    {
      key: "NON_ORIGINAL_BRANDED_PRODUCTS",
      label: "Non-Original Branded",
      value: mix.NON_ORIGINAL_BRANDED_PRODUCTS,
      color: "var(--chart-2)",
    },
    {
      key: "UNBRANDED_PRODUCTS",
      label: "Unbranded",
      value: mix.UNBRANDED_PRODUCTS,
      color: "var(--chart-3)",
    },
    { key: "UNKNOWN", label: "Unknown", value: mix.UNKNOWN, color: "var(--border-strong)" },
  ];
}

export function MoleculeDetail({ molecule: m, onBack }: MoleculeDetailProps) {
  const revenueTrend = useMemo(
    () => [
      { year: "2023", value: m.Revenue_2023 },
      { year: "2024", value: m.Revenue_2024 },
      { year: "2025", value: m.Revenue_2025 },
    ],
    [m],
  );

  const volumeTrend = useMemo(
    () => [
      { year: "2023", value: m.STD_2023 },
      { year: "2024", value: m.STD_2024 },
      { year: "2025", value: m.STD_2025 },
    ],
    [m],
  );

  const brands = useMemo(() => [...m.Brands].sort((a, b) => a.Brand_Rank - b.Brand_Rank), [m]);

  const leadBrand = useMemo(
    () =>
      brands.length
        ? brands.reduce((top, b) => (b.Market_Share > top.Market_Share ? b : top), brands[0])
        : null,
    [brands],
  );

  return (
    <div className="space-y-4">
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-md px-1 py-1 text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Molecules
        </button>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">{m.Molecule}</h2>
          {m.Monopoly_Flag && (
            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border whitespace-nowrap bg-red-50 text-red-700 border-red-200">
              Monopoly
            </span>
          )}
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
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Opportunity Score"
          value={m.Opportunity_Score.toFixed(1)}
          icon={Target}
          hint="0–100 composite score"
          highlight={m.Opportunity_Score >= 60 ? "green" : m.Opportunity_Score >= 40 ? "amber" : undefined}
        />
        <KpiCard
          label="Competition"
          value={String(m.Competition_Count)}
          icon={Users}
          hint={m.Competition_Count === 1 ? "Single brand" : `${m.Competition_Count} brands competing`}
        />
        <KpiCard
          label="Dominance"
          value={`${(m.Dominance_Ratio * 100).toFixed(1)}%`}
          icon={ShieldAlert}
          hint={m.Monopoly_Flag ? "Monopoly (≥80% share)" : "Top brand's share"}
          highlight={m.Monopoly_Flag ? "red" : undefined}
        />
        <KpiCard
          label="Revenue 2025"
          value={fmtRevenue(m.Revenue_2025)}
          icon={TrendingUp}
          hint={`${m.Revenue_CAGR >= 0 ? "+" : ""}${m.Revenue_CAGR.toFixed(1)}% CAGR`}
          highlight={m.Revenue_CAGR > 0 ? "green" : m.Revenue_CAGR < 0 ? "red" : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Revenue Trend
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueTrend} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="year" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => fmtRevenue(v as number)}
                width={48}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                cursor={{ fill: "var(--secondary)", opacity: 0.4 }}
                formatter={(value: number) => [fmtRevenueExact(value), "Revenue"]}
              />
              <Bar dataKey="value" radius={[3, 3, 0, 0]} fill="var(--chart-1)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Volume Trend (Standard Units)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={volumeTrend} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="year" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => fmtUnits(v as number)}
                width={48}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                cursor={{ fill: "var(--secondary)", opacity: 0.4 }}
                formatter={(value: number) => [fmtUnits(value), "Standard Units"]}
              />
              <Bar dataKey="value" radius={[3, 3, 0, 0]} fill="var(--chart-2)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SplitBar
          title="Sector Split"
          subtitle="Share of 3-year total revenue · Hospital vs Retail"
          segments={sectorSegments(m.Sector_Split)}
        />
        <SplitBar
          title="Innovation / Branding Mix"
          subtitle="Share of 3-year total revenue"
          segments={innovationSegments(m.Innovation_Mix)}
        />
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Brand / Competitor Breakdown
            </h3>
            {leadBrand && (
              <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
                <span>
                  {m.Competition_Count} brand{m.Competition_Count !== 1 ? "s" : ""} ·{" "}
                  {m.Unique_Manufacturers} manufacturer{m.Unique_Manufacturers !== 1 ? "s" : ""}{" "}
                  competing · {leadBrand.Brand} leads at {(leadBrand.Market_Share * 100).toFixed(1)}%
                </span>
                {m.MFR_CONCENTRATED && (
                  <span
                    title="Some manufacturers hold multiple brands here, so the brand count overstates true competitor count"
                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium border whitespace-nowrap bg-amber-50 text-amber-700 border-amber-200 cursor-help"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    Brand-concentrated ownership
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={() => exportBrandsCsv(m, brands)}
            disabled={!brands.length}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border-strong bg-card px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-secondary hover:border-foreground/40 transition-colors disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
        {brands.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            No brand-level data available for this molecule.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th
                    title="Rank within this molecule's brands by Brand Opportunity Score (revenue + growth + market share, hover a score to see it)"
                    className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground underline decoration-dotted decoration-muted-foreground/50 underline-offset-4 cursor-help"
                  >
                    Rank
                  </th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Trend
                  </th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Brand
                  </th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Manufacturer
                  </th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Corporation
                  </th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Revenue 2023
                  </th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Revenue 2024
                  </th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Revenue 2025
                  </th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Market Share
                  </th>
                  <th
                    title="2023→2025 compound annual growth rate of this brand's revenue (falls back to 2024→2025 growth if 2023 revenue was 0). Shown as — when neither year has revenue to grow from."
                    className="whitespace-nowrap px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground underline decoration-dotted decoration-muted-foreground/50 underline-offset-4 cursor-help"
                  >
                    CAGR
                  </th>
                </tr>
              </thead>
              <tbody>
                {brands.map((b, i) => (
                  <tr
                    key={b.Brand}
                    className={cn(
                      "border-b border-border/60 transition-colors hover:bg-secondary/30",
                      i % 2 === 1 && "bg-secondary/15",
                    )}
                  >
                    <td
                      title={`Brand Opportunity Score: ${b.Brand_Opportunity_Score.toFixed(1)}`}
                      className="px-4 py-2.5 font-semibold tabular-nums text-foreground cursor-help"
                    >
                      #{b.Brand_Rank}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {b.Trend.map((t) => (
                          <span
                            key={t}
                            className={cn(
                              "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border whitespace-nowrap",
                              TREND_STYLES[t],
                            )}
                          >
                            {TREND_LABELS[t]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="max-w-[200px] px-4 py-2.5">
                      <div title={b.Brand} className="truncate font-medium text-foreground">
                        {b.Brand}
                      </div>
                      {b.Also_Owns.length > 0 && (
                        <div
                          title={`${b.Manufacturer} also markets ${b.Also_Owns.join(", ")} under this molecule`}
                          className="mt-0.5 truncate text-[10px] text-amber-700 cursor-help"
                        >
                          also owns: {b.Also_Owns.join(", ")}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{b.Manufacturer}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{b.Corporation}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                      {fmtRevenueExact(b.Revenue_2023)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                      {fmtRevenueExact(b.Revenue_2024)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                      {fmtRevenueExact(b.Revenue_2025)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-foreground">
                      {(b.Market_Share * 100).toFixed(1)}%
                    </td>
                    <td
                      title={
                        b.Brand_CAGR === null
                          ? "No revenue in either base year (2023 or 2024) to compute growth from"
                          : undefined
                      }
                      className={cn(
                        "px-4 py-2.5 text-right tabular-nums font-medium",
                        b.Brand_CAGR === null
                          ? "text-muted-foreground/40"
                          : b.Brand_CAGR > 0
                            ? "text-emerald-600"
                            : "text-red-600",
                      )}
                    >
                      {b.Brand_CAGR === null ? "—" : `${b.Brand_CAGR.toFixed(1)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
