import { useState, useMemo } from "react";
import { FlaskConical, Target, ShieldAlert, TrendingUp } from "lucide-react";
import type { MoleculeAnalytics, FilterParams, UploadResponse, NavSection } from "@/types";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { KpiCard } from "@/components/KpiCard";
import { UploadSection } from "@/components/UploadSection";
import { FilterPanel } from "@/components/FilterPanel";
import { ResultsTable } from "@/components/ResultsTable";
import { OverviewCharts } from "@/components/OverviewCharts";

const DEFAULT_FILTERS: FilterParams = {
  minStdCagr: -Infinity,
  maxCompetitionCount: 100,
  minRevenue2023: 0,
  minRevenue2024: 0,
  minRevenue2025: 0,
  minRevenueCagr: -Infinity,
  maxHHI: 1,
  monopolyMode: "all",
};

function fmtRevenue(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function exportCsv(data: MoleculeAnalytics[]) {
  if (!data.length) return;
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((r) => Object.values(r).join(",")).join("\n");
  const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "molecule_analytics.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<NavSection>("overview");
  const [analytics, setAnalytics] = useState<MoleculeAnalytics[]>([]);
  const [filters, setFilters] = useState<FilterParams>(DEFAULT_FILTERS);
  const [summary, setSummary] = useState<{
    totalRows: number;
    uniqueMolecules: number;
    uniqueProducts: number;
  } | null>(null);

  function handleUploadComplete(res: UploadResponse) {
    setAnalytics(res.analytics);
    setSummary({
      totalRows: res.total_rows,
      uniqueMolecules: res.unique_molecules,
      uniqueProducts: res.unique_products,
    });
    setFilters(DEFAULT_FILTERS);
    setActiveSection("overview");
  }

  const filtered = useMemo(
    () =>
      analytics.filter((m) => {
        if (m.STD_CAGR < filters.minStdCagr) return false;
        if (m.Competition_Count > filters.maxCompetitionCount) return false;
        if (m.Revenue_2023 < filters.minRevenue2023) return false;
        if (m.Revenue_2024 < filters.minRevenue2024) return false;
        if (m.Revenue_2025 < filters.minRevenue2025) return false;
        if (m.Revenue_CAGR < filters.minRevenueCagr) return false;
        if (m.HHI > filters.maxHHI) return false;
        if (filters.monopolyMode === "monopoly_only" && !m.Monopoly_Flag) return false;
        if (filters.monopolyMode === "exclude_monopoly" && m.Monopoly_Flag) return false;
        return true;
      }),
    [analytics, filters],
  );

  const kpis = useMemo(() => {
    if (!filtered.length) return null;
    const highGrowth = filtered.filter((m) => m.STD_CAGR > 0).length;
    const monopolies = filtered.filter((m) => m.Monopoly_Flag).length;
    const avgCagr = filtered.reduce((s, m) => s + m.STD_CAGR, 0) / filtered.length;
    const totalRev = filtered.reduce((s, m) => s + m.Revenue_2025, 0);
    return { highGrowth, monopolies, avgCagr, totalRev };
  }, [filtered]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        hasData={analytics.length > 0}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header activeSection={activeSection} />

        <main className="flex-1 overflow-auto">
          {/* OVERVIEW */}
          {activeSection === "overview" && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  label="Total Molecules"
                  value={filtered.length.toString()}
                  icon={FlaskConical}
                  hint={
                    summary
                      ? `${summary.uniqueProducts} unique brands`
                      : "Upload a dataset to begin"
                  }
                />
                <KpiCard
                  label="Growing Molecules"
                  value={kpis ? kpis.highGrowth.toString() : "—"}
                  icon={Target}
                  hint="Positive STD CAGR"
                  highlight={kpis && kpis.highGrowth > 0 ? "green" : undefined}
                />
                <KpiCard
                  label="Monopoly Molecules"
                  value={kpis ? kpis.monopolies.toString() : "—"}
                  icon={ShieldAlert}
                  hint="Dominance Ratio ≥ 80%"
                  highlight={kpis && kpis.monopolies > 0 ? "red" : undefined}
                />
                <KpiCard
                  label="Avg STD CAGR"
                  value={kpis ? `${kpis.avgCagr.toFixed(1)}%` : "—"}
                  icon={TrendingUp}
                  hint={kpis ? `Total revenue: ${fmtRevenue(kpis.totalRev)}` : "2-year unit growth"}
                />
              </div>

              {analytics.length > 0 ? (
                <OverviewCharts analytics={filtered} />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-dashed border-border/60">
                  <FlaskConical className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
                  <p className="text-sm text-muted-foreground">No data loaded yet</p>
                  <button
                    onClick={() => setActiveSection("upload")}
                    className="mt-3 text-sm text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
                  >
                    Upload a dataset to get started
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MOLECULES */}
          {activeSection === "molecules" && (
            <div className="p-6 space-y-4">
              <FilterPanel
                filters={filters}
                onChange={setFilters}
                onReset={() => setFilters(DEFAULT_FILTERS)}
                totalCount={analytics.length}
                filteredCount={filtered.length}
              />
              <ResultsTable data={filtered} />
            </div>
          )}

          {/* UPLOAD */}
          {activeSection === "upload" && (
            <div className="p-6 max-w-xl">
              <UploadSection onUploadComplete={handleUploadComplete} currentSummary={summary} />
            </div>
          )}

          {/* REPORTS */}
          {activeSection === "reports" && (
            <div className="p-6 flex flex-col items-center justify-center min-h-80 text-center">
              <TrendingUp className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
              <h2 className="text-lg font-semibold">Reports</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                Export filtered molecule analytics as CSV.
                {analytics.length === 0 && " Upload a dataset first."}
              </p>
              {analytics.length > 0 && (
                <button
                  onClick={() => exportCsv(filtered)}
                  className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Export {filtered.length} molecule
                  {filtered.length !== 1 ? "s" : ""} as CSV
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
