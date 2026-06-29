import { useState, useMemo } from "react";
import { FlaskConical, Target, ShieldAlert, TrendingUp } from "lucide-react";
import * as XLSX from "xlsx";
import type {
  MoleculeAnalytics,
  FilterParams,
  UploadResponse,
  NavSection,
  Analysis,
} from "@/types";
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
  monopolyMode: "all",
};

function fmtRevenue(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function exportExcel(
  fileName: string,
  data: MoleculeAnalytics[],
  mode: "growth" | "revenue",
) {
  if (!data.length) return;

  const rows = data.map((m) =>
    mode === "growth"
      ? {
          Molecule: m.Molecule,
          Competition_Count: m.Competition_Count,
          Dominance_Ratio: m.Dominance_Ratio,
          Monopoly_Flag: m.Monopoly_Flag,
          Revenue_2023: m.Revenue_2023,
          Revenue_2024: m.Revenue_2024,
          Revenue_2025: m.Revenue_2025,
          STD_2023: m.STD_2023,
          STD_2024: m.STD_2024,
          STD_2025: m.STD_2025,
          STD_CAGR: m.STD_CAGR,
        }
      : {
          Molecule: m.Molecule,
          Opportunity_Score: m.Opportunity_Score,
          Competition_Count: m.Competition_Count,
          Dominance_Ratio: m.Dominance_Ratio,
          Monopoly_Flag: m.Monopoly_Flag,
          Revenue_2023: m.Revenue_2023,
          Revenue_2024: m.Revenue_2024,
          Revenue_2025: m.Revenue_2025,
          STD_2023: m.STD_2023,
          STD_2024: m.STD_2024,
          STD_2025: m.STD_2025,
          STD_CAGR: m.STD_CAGR,
          Revenue_CAGR: m.Revenue_CAGR,
        },
  );

  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Molecules");
  XLSX.writeFile(workbook, fileName);
}

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<NavSection>("overview");
  const [analytics, setAnalytics] = useState<MoleculeAnalytics[]>([]);
  const [analysis1Growth, setAnalysis1Growth] = useState<Analysis | null>(null);
  const [analysis2Revenue, setAnalysis2Revenue] = useState<Analysis | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<"growth" | "revenue">("growth");
  const [filters, setFilters] = useState<FilterParams>(DEFAULT_FILTERS);
  const [reportMinRevenueCagr, setReportMinRevenueCagr] = useState<number>(-Infinity);
  const [reportMinRevenue2025, setReportMinRevenue2025] = useState<number>(0);
  const [summary, setSummary] = useState<{
    totalRows: number;
    uniqueMolecules: number;
    uniqueProducts: number;
  } | null>(null);

  function handleUploadComplete(res: UploadResponse) {
    // Handle both old and new response formats
    const allAnalytics =
      res.analysis_1_growth?.results || res.analysis_2_revenue?.results || res.analytics || [];
    const analysis1 = res.analysis_1_growth || null;
    const analysis2 = res.analysis_2_revenue || null;

    // Use analysis_1_growth results if available, otherwise fallback to analytics
    const resultsToUse = analysis1?.results || allAnalytics;

    setAnalytics(resultsToUse);
    setAnalysis1Growth(analysis1);
    setAnalysis2Revenue(analysis2);
    setActiveAnalysis("growth");
    setSummary({
      totalRows: res.total_rows,
      uniqueMolecules: res.unique_molecules,
      uniqueProducts: res.unique_products,
    });
    setFilters(DEFAULT_FILTERS);
    setActiveSection("overview");
  }

  // Get current analysis data
  const currentAnalysisData =
    activeAnalysis === "growth"
      ? analysis1Growth?.results || analytics
      : analysis2Revenue?.results || analytics;

  const filtered = useMemo(
    () =>
      currentAnalysisData.filter((m) => {
        if (m.STD_CAGR < filters.minStdCagr) return false;
        if (m.Competition_Count > filters.maxCompetitionCount) return false;
        if (m.Revenue_2023 < filters.minRevenue2023) return false;
        if (m.Revenue_2024 < filters.minRevenue2024) return false;
        if (m.Revenue_2025 < filters.minRevenue2025) return false;
        if (m.Revenue_CAGR < filters.minRevenueCagr) return false;
        if (filters.monopolyMode === "monopoly_only" && !m.Monopoly_Flag) return false;
        if (filters.monopolyMode === "exclude_monopoly" && m.Monopoly_Flag) return false;
        return true;
      }),
    [currentAnalysisData, filters],
  );

  const kpis = useMemo(() => {
    if (!filtered.length) return null;
    const highGrowth = filtered.filter((m) => m.STD_CAGR > 0).length;
    const monopolies = filtered.filter((m) => m.Monopoly_Flag).length;
    const avgCagr = filtered.reduce((s, m) => s + m.STD_CAGR, 0) / filtered.length;
    const totalRev = filtered.reduce((s, m) => s + m.Revenue_2025, 0);
    return { highGrowth, monopolies, avgCagr, totalRev };
  }, [filtered]);

  const preMonopolyExport = useMemo(
    () => [...(analysis1Growth?.results || analytics)].sort((a, b) => b.STD_CAGR - a.STD_CAGR),
    [analysis1Growth, analytics],
  );

  const postMonopolyExport = useMemo(
    () =>
      (analysis2Revenue?.results || analytics.filter((m) => !m.Monopoly_Flag))
        .filter((m) => !m.Monopoly_Flag)
        .filter((m) => m.Revenue_CAGR >= reportMinRevenueCagr)
        .filter((m) => m.Revenue_2025 >= reportMinRevenue2025)
        .sort((a, b) => b.Opportunity_Score - a.Opportunity_Score),
    [analysis2Revenue, analytics, reportMinRevenueCagr, reportMinRevenue2025],
  );

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
              <UploadSection onUploadComplete={handleUploadComplete} currentSummary={summary} />

              {analytics.length > 0 && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                      label="Total Molecules"
                      value={filtered.length.toString()}
                      icon={FlaskConical}
                      hint={`${summary?.uniqueProducts ?? 0} unique brands`}
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
                  <OverviewCharts analytics={filtered} />
                </>
              )}
            </div>
          )}

          {/* MOLECULES */}
          {activeSection === "molecules" && (
            <div className="p-6 space-y-4">
              {/* Analysis Toggle */}
              {(analysis1Growth || analysis2Revenue) && (
                <div className="flex gap-2 border-b border-border">
                  <button
                    onClick={() => setActiveAnalysis("growth")}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeAnalysis === "growth"
                        ? "border-b-2 border-primary text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Growth Focus {analysis1Growth && `(${analysis1Growth.count})`}
                  </button>
                  <button
                    onClick={() => setActiveAnalysis("revenue")}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeAnalysis === "revenue"
                        ? "border-b-2 border-primary text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Revenue Focus {analysis2Revenue && `(${analysis2Revenue.count})`}
                  </button>
                </div>
              )}

              {/* Analysis Description */}
              {activeAnalysis === "growth" && analysis1Growth && (
                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
                  <p>
                    <strong>{analysis1Growth.description}</strong>
                  </p>
                  <p>Filter: {analysis1Growth.filter}</p>
                  <p>Sort: {analysis1Growth.sort_by}</p>
                </div>
              )}
              {activeAnalysis === "revenue" && analysis2Revenue && (
                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
                  <p>
                    <strong>{analysis2Revenue.description}</strong>
                  </p>
                  <p>Filter: {analysis2Revenue.filter}</p>
                  <p>Sort: {analysis2Revenue.sort_by}</p>
                </div>
              )}

              <FilterPanel
                filters={filters}
                onChange={setFilters}
                onReset={() => setFilters(DEFAULT_FILTERS)}
                totalCount={currentAnalysisData.length}
                filteredCount={filtered.length}
              />
              <ResultsTable data={filtered} analysisMode={activeAnalysis} />
            </div>
          )}

          {/* REPORTS */}
          {activeSection === "reports" && (
            <div className="p-6 flex flex-col items-center justify-center min-h-80 text-center">
              <TrendingUp className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
              <h2 className="text-lg font-semibold">Reports</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                Export two Excel files: one before monopoly removal sorted by STD CAGR, and one
                after monopoly removal sorted by Opportunity Score with thresholds.
                {analytics.length === 0 && " Upload a dataset first."}
              </p>
              {analytics.length > 0 && (
                <div className="mt-6 w-full max-w-lg space-y-4 text-left">
                  <div className="rounded-lg border border-border/60 bg-card p-4 space-y-3">
                    <p className="text-sm font-medium text-foreground">
                      Before Monopoly Removal (sorted by STD CAGR)
                    </p>
                    <button
                      onClick={() => exportExcel("before_monopoly_removal_std_cagr.xlsx", preMonopolyExport, "growth")}
                      className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      Export {preMonopolyExport.length} molecules to Excel
                    </button>
                  </div>

                  <div className="rounded-lg border border-border/60 bg-card p-4 space-y-3">
                    <p className="text-sm font-medium text-foreground">
                      After Monopoly Removal (sorted by Opportunity Score)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                        Min Revenue CAGR %
                        <input
                          type="number"
                          value={isFinite(reportMinRevenueCagr) ? reportMinRevenueCagr : ""}
                          placeholder="No minimum"
                          onChange={(e) =>
                            setReportMinRevenueCagr(
                              e.target.value === "" ? -Infinity : Number(e.target.value),
                            )
                          }
                          className="h-9 w-full rounded-md border border-border/60 bg-secondary/30 px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                        Min Revenue 2025
                        <input
                          type="number"
                          value={reportMinRevenue2025}
                          onChange={(e) => setReportMinRevenue2025(Number(e.target.value) || 0)}
                          className="h-9 w-full rounded-md border border-border/60 bg-secondary/30 px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </label>
                    </div>
                    <button
                      onClick={() =>
                        exportExcel("after_monopoly_removal_opportunity_score.xlsx", postMonopolyExport, "revenue")
                      }
                      className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      Export {postMonopolyExport.length} molecules to Excel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
