import { useState, useMemo, useEffect } from "react";
import { Trophy, Target, ShieldAlert, TrendingUp, Download } from "lucide-react";
import * as XLSX from "xlsx";
import type { MoleculeAnalytics, FilterParams, UploadResponse, NavSection, Analysis } from "@/types";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { KpiCard } from "@/components/KpiCard";
import { UploadSection } from "@/components/UploadSection";
import { FilterPanel } from "@/components/FilterPanel";
import { ResultsTable } from "@/components/ResultsTable";
import { OverviewCharts } from "@/components/OverviewCharts";

const SIDEBAR_COLLAPSED_KEY = "moleculab.sidebarCollapsed";
const MOBILE_BREAKPOINT = 768;

const DEFAULT_FILTERS: FilterParams = {
  minStdCagr: -Infinity,
  maxCompetitionCount: 100,
  minRevenue2023: 0,
  minRevenue2024: 0,
  minRevenue2025: 0,
  minRevenueCagr: -Infinity,
  minOpportunityScore: -Infinity,
  maxDominanceRatio: 1,
  monopolyMode: "all",
};

function fmtRevenue(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function toExportRows(data: MoleculeAnalytics[], mode: "growth" | "revenue") {
  return data.map((m) =>
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
}

function exportCsv(fileName: string, data: MoleculeAnalytics[], mode: "growth" | "revenue") {
  if (!data.length) return;
  const sheet = XLSX.utils.json_to_sheet(toExportRows(data, mode));
  const csv = XLSX.utils.sheet_to_csv(sheet);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<NavSection>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    if (window.innerWidth < MOBILE_BREAKPOINT) return true;
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  });
  const [analytics, setAnalytics] = useState<MoleculeAnalytics[]>([]);
  const [analysis1Growth, setAnalysis1Growth] = useState<Analysis | null>(null);
  const [analysis2Revenue, setAnalysis2Revenue] = useState<Analysis | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<"growth" | "revenue">("growth");
  const [filters, setFilters] = useState<FilterParams>(DEFAULT_FILTERS);
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState<{
    totalRows: number;
    uniqueMolecules: number;
    uniqueProducts: number;
  } | null>(null);

  function toggleSidebarCollapsed() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < MOBILE_BREAKPOINT) {
        setSidebarCollapsed(true);
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
        if (m.Opportunity_Score < filters.minOpportunityScore) return false;
        if (m.Dominance_Ratio > filters.maxDominanceRatio) return false;
        if (filters.monopolyMode === "monopoly_only" && !m.Monopoly_Flag) return false;
        if (filters.monopolyMode === "exclude_monopoly" && m.Monopoly_Flag) return false;
        return true;
      }),
    [currentAnalysisData, filters],
  );

  // Overview is a stable "where should I invest" snapshot — it intentionally
  // ignores the Molecules tab's filters/mode and always sources from the
  // opportunity-ranked, monopoly-excluded dataset (already sorted desc by
  // Opportunity_Score by the backend).
  const opportunityData = useMemo(
    () => analysis2Revenue?.results || analytics,
    [analysis2Revenue, analytics],
  );

  const overviewKpis = useMemo(() => {
    if (!opportunityData.length) return null;
    const topOpportunity = opportunityData[0];
    const highOpportunityCount = opportunityData.filter((m) => m.Opportunity_Score >= 60).length;
    const monopolies = analytics.filter((m) => m.Monopoly_Flag).length;
    const avgOpportunityScore =
      opportunityData.reduce((s, m) => s + m.Opportunity_Score, 0) / opportunityData.length;
    return { topOpportunity, highOpportunityCount, monopolies, avgOpportunityScore };
  }, [opportunityData, analytics]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        hasData={analytics.length > 0}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={toggleSidebarCollapsed}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header activeSection={activeSection} />

        <main className="flex-1 overflow-auto">
          {/* OVERVIEW */}
          {activeSection === "overview" && (
            <div className="p-6 space-y-6">
              <UploadSection
                onUploadComplete={handleUploadComplete}
                onLoadingChange={setUploading}
                currentSummary={summary}
              />

              {uploading && analytics.length === 0 && (
                <div className="space-y-4 animate-pulse" aria-hidden="true">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="rounded-lg border border-border bg-card p-4 h-24">
                        <div className="h-3 w-20 rounded bg-secondary mb-3" />
                        <div className="h-6 w-12 rounded bg-secondary" />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-border bg-card p-4 h-64 bg-secondary/20" />
                    <div className="rounded-lg border border-border bg-card p-4 h-64 bg-secondary/20" />
                  </div>
                </div>
              )}

              {analytics.length > 0 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                      label="Top Opportunity"
                      value={overviewKpis?.topOpportunity.Molecule ?? "—"}
                      icon={Trophy}
                      hint={
                        overviewKpis
                          ? `Score ${overviewKpis.topOpportunity.Opportunity_Score.toFixed(1)} · ${fmtRevenue(overviewKpis.topOpportunity.Revenue_2025)} revenue`
                          : "Best-ranked molecule"
                      }
                      highlight="green"
                    />
                    <KpiCard
                      label="High-Opportunity"
                      value={overviewKpis ? overviewKpis.highOpportunityCount.toString() : "—"}
                      icon={Target}
                      hint="Opportunity Score ≥ 60"
                      highlight={overviewKpis && overviewKpis.highOpportunityCount > 0 ? "green" : undefined}
                    />
                    <KpiCard
                      label="Monopoly Molecules"
                      value={overviewKpis ? overviewKpis.monopolies.toString() : "—"}
                      icon={ShieldAlert}
                      hint="Excluded from opportunities"
                      highlight={overviewKpis && overviewKpis.monopolies > 0 ? "red" : undefined}
                    />
                    <KpiCard
                      label="Avg Opportunity Score"
                      value={overviewKpis ? overviewKpis.avgOpportunityScore.toFixed(1) : "—"}
                      icon={TrendingUp}
                      hint={overviewKpis ? `Across ${opportunityData.length} molecules` : "0–100 scale"}
                      highlight={
                        overviewKpis
                          ? overviewKpis.avgOpportunityScore >= 60
                            ? "green"
                            : overviewKpis.avgOpportunityScore >= 40
                              ? "amber"
                              : undefined
                          : undefined
                      }
                    />
                  </div>
                  <OverviewCharts opportunities={opportunityData} landscape={analytics} />
                </>
              )}
            </div>
          )}

          {/* MOLECULES */}
          {activeSection === "molecules" && (
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border">
                {/* Analysis Toggle */}
                {(analysis1Growth || analysis2Revenue) && (
                  <div className="flex gap-2">
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

                {/* Export toolbar */}
                <div className="flex items-center gap-2 pb-2">
                  <button
                    onClick={() =>
                      exportCsv(`molecules_${activeAnalysis}.csv`, filtered, activeAnalysis)
                    }
                    disabled={!filtered.length}
                    title={!filtered.length ? "No molecules match the current filters" : undefined}
                    className="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border-strong bg-card px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-secondary hover:border-foreground/40 transition-colors disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export ({filtered.length})
                  </button>
                </div>
              </div>

              {/* Analysis description */}
              {(analysis1Growth || analysis2Revenue) && (
                <p className="text-xs text-muted-foreground">
                  {activeAnalysis === "growth"
                    ? `${analysis1Growth?.description} · sorted by ${analysis1Growth?.sort_by}`
                    : `${analysis2Revenue?.description} · sorted by ${analysis2Revenue?.sort_by}`}
                </p>
              )}

              <FilterPanel
                filters={filters}
                onChange={setFilters}
                onReset={() => setFilters(DEFAULT_FILTERS)}
                totalCount={currentAnalysisData.length}
                filteredCount={filtered.length}
                mode={activeAnalysis}
              />
              <ResultsTable
                data={filtered}
                analysisMode={activeAnalysis}
                onResetFilters={() => setFilters(DEFAULT_FILTERS)}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
