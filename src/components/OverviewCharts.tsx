import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
  ReferenceLine,
  Legend,
} from "recharts";
import type { MoleculeAnalytics } from "@/types";

interface Props {
  analytics: MoleculeAnalytics[];
}

function shortName(s: string, max = 13) {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function fmtRevenue(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
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

export function OverviewCharts({ analytics }: Props) {
  const top10Rev = useMemo(
    () => [...analytics].sort((a, b) => b.Revenue_2025 - a.Revenue_2025).slice(0, 10),
    [analytics],
  );

  const top8Rev = useMemo(() => top10Rev.slice(0, 8), [top10Rev]);

  const scatterData = useMemo(
    () =>
      analytics.map((m) => ({
        competition: m.Competition_Count,
        cagr: m.STD_CAGR,
        size: Math.max(30, Math.min(600, m.Revenue_2025 / 5000)),
        name: m.Molecule,
        monopoly: m.Monopoly_Flag,
      })),
    [analytics],
  );

  const revTrendData = top8Rev.map((m) => ({
    name: shortName(m.Molecule),
    "2023": m.Revenue_2023,
    "2024": m.Revenue_2024,
    "2025": m.Revenue_2025,
  }));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {/* Top 10 by Revenue 2025 — horizontal bar */}
      <div className="rounded-lg border border-border/60 bg-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
          Top 10 — Revenue 2025
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={top10Rev}
            layout="vertical"
            margin={{ left: 0, right: 24, top: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis
              type="number"
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              tickFormatter={fmtRevenue}
            />
            <YAxis
              type="category"
              dataKey="Molecule"
              tick={AXIS_TICK}
              width={106}
              tickFormatter={(v) => shortName(v, 12)}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: "var(--secondary)", opacity: 0.4 }}
              formatter={(v: number) => [fmtRevenue(v), "Revenue 2025"]}
            />
            <Bar dataKey="Revenue_2025" radius={[0, 3, 3, 0]} fill="var(--chart-1)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Competition vs STD CAGR — scatter */}
      <div className="rounded-lg border border-border/60 bg-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
          Competition vs STD CAGR
        </h3>
        <p className="text-xs text-muted-foreground/60 mb-3">
          Bubble size = Revenue 2025 &nbsp;·&nbsp; dashed line = 0% growth
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart margin={{ left: 0, right: 16, top: 8, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              type="number"
              dataKey="competition"
              name="Competitors"
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Competition Count",
                position: "insideBottom",
                offset: -10,
                fontSize: 10,
                fill: "var(--muted-foreground)",
              }}
            />
            <YAxis
              type="number"
              dataKey="cagr"
              name="STD CAGR"
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v.toFixed(0)}%`}
              label={{
                value: "STD CAGR %",
                angle: -90,
                position: "insideLeft",
                fontSize: 10,
                fill: "var(--muted-foreground)",
              }}
            />
            <ZAxis type="number" dataKey="size" range={[30, 500]} />
            <ReferenceLine
              y={0}
              stroke="var(--chart-1)"
              strokeDasharray="4 2"
              strokeOpacity={0.5}
            />
            <Tooltip
              wrapperStyle={{ outline: "none" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={TOOLTIP_STYLE}>
                    <p style={{ fontWeight: 600, marginBottom: 2 }}>{d.name}</p>
                    <p>STD CAGR: {d.cagr.toFixed(1)}%</p>
                    <p>Competitors: {d.competition}</p>
                    {d.monopoly && (
                      <p style={{ color: "var(--chart-4)", marginTop: 2 }}>⚠ Monopoly</p>
                    )}
                  </div>
                );
              }}
            />
            <Scatter data={scatterData}>
              {scatterData.map((d, i) => (
                <Cell
                  key={i}
                  fill={
                    d.monopoly ? "var(--chart-4)" : d.cagr > 0 ? "var(--chart-1)" : "var(--chart-2)"
                  }
                  fillOpacity={0.75}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue Trend — top 8, full width */}
      <div className="rounded-lg border border-border/60 bg-card p-4 xl:col-span-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
          Revenue Trend — Top 8 Molecules (2023–2025)
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={revTrendData} margin={{ left: 8, right: 8, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_TICK} tickFormatter={fmtRevenue} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: "var(--secondary)", opacity: 0.4 }}
              formatter={(v: number, name: string) => [fmtRevenue(v), name]}
            />
            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
            <Bar dataKey="2023" fill="var(--chart-3)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="2024" fill="var(--chart-2)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="2025" fill="var(--chart-1)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
