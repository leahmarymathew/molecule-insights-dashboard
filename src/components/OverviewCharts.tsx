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
} from "recharts";
import type { MoleculeAnalytics } from "@/types";

interface Props {
  /** Monopoly-excluded, sorted desc by Opportunity_Score (backend order). */
  opportunities: MoleculeAnalytics[];
  /** Full dataset including monopolies — used for competitive-landscape context. */
  landscape: MoleculeAnalytics[];
}

function shortName(s: string, max = 14) {
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

export function OverviewCharts({ opportunities, landscape }: Props) {
  const topOpportunities = useMemo(() => opportunities.slice(0, 10), [opportunities]);

  const scatterData = useMemo(
    () =>
      landscape.map((m) => ({
        competition: m.Competition_Count,
        cagr: m.STD_CAGR,
        size: Math.max(30, Math.min(600, m.Revenue_2025 / 5000)),
        name: m.Molecule,
        monopoly: m.Monopoly_Flag,
      })),
    [landscape],
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {/* Top 10 Opportunities — horizontal bar, ranked by Opportunity Score */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
          Top 10 Opportunities
        </h3>
        <p className="text-xs text-muted-foreground/80 mb-3">
          Ranked by Opportunity Score &nbsp;·&nbsp; monopolies excluded
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={topOpportunities}
            layout="vertical"
            margin={{ left: 0, right: 24, top: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
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
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as MoleculeAnalytics;
                return (
                  <div style={TOOLTIP_STYLE}>
                    <p style={{ fontWeight: 600, marginBottom: 2 }}>{d.Molecule}</p>
                    <p>Opportunity Score: {d.Opportunity_Score.toFixed(1)}</p>
                    <p>Revenue 2025: {fmtRevenue(d.Revenue_2025)}</p>
                    <p>Competitors: {d.Competition_Count}</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="Opportunity_Score" radius={[0, 3, 3, 0]} fill="var(--chart-1)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Growth vs Competition — full landscape, monopolies flagged */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
          Growth vs Competition
        </h3>
        <p className="text-xs text-muted-foreground/80 mb-2">
          Bubble size = Revenue 2025 &nbsp;·&nbsp; dashed line = 0% growth
        </p>
        <div className="flex flex-wrap items-center gap-3 mb-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: "var(--chart-1)" }}
            />
            Growing
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: "var(--chart-2)" }}
            />
            Declining
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: "var(--chart-4)" }}
            />
            Monopoly (excluded)
          </span>
        </div>
        <ResponsiveContainer width="100%" height={252}>
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
    </div>
  );
}
