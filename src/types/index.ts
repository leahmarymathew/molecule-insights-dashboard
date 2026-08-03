export interface DatasetRow {
  "Molecule List": string | null;
  "International Product": string | null;
  "MAT Q2 2023_LCD MNF": number | null;
  "MAT Q2 2024_LCD MNF": number | null;
  "MAT Q2 2025_LCD MNF": number | null;
  "MAT Q2 2023_Standard Units": number | null;
  "MAT Q2 2024_Standard Units": number | null;
  "MAT Q2 2025_Standard Units": number | null;
}

export type BrandTrend = "LEADING" | "NEW_ENTRANT" | "RISING" | "DECLINING" | "STABLE";

export interface BrandDetail {
  Brand: string;
  Manufacturer: string;
  Corporation: string;
  Revenue_2023: number;
  Revenue_2024: number;
  Revenue_2025: number;
  /** Share (0–1) of the molecule's 3-year total revenue held by this brand. */
  Market_Share: number;
  /**
   * 2023->2025 two-year CAGR (%), falling back to 2024->2025 growth if 2023
   * revenue is 0. Null when neither base year has revenue to grow from
   * (undefined, not zero growth) — e.g. a brand with no 2023 or 2024 revenue.
   */
  Brand_CAGR: number | null;
  /** LEADING is independent and may co-occur with exactly one of the other tags. */
  Trend: BrandTrend[];
  /**
   * Composite score (0–100+) reusing the molecule-level Opportunity_Score
   * shape: 40% revenue + 40% revenue-weighted growth + 20% revenue-weighted
   * market share. Brands are ranked within their molecule by this score.
   */
  Brand_Opportunity_Score: number;
  /** 1-indexed rank within this molecule's brands, 1 = highest Brand_Opportunity_Score. */
  Brand_Rank: number;
}

export interface SectorSplit {
  HOSPITAL: number;
  RETAIL: number;
  UNKNOWN: number;
}

export interface InnovationMix {
  INNOVATIVE_BRANDED_PRODUCTS: number;
  NON_ORIGINAL_BRANDED_PRODUCTS: number;
  UNBRANDED_PRODUCTS: number;
  UNKNOWN: number;
}

export interface MoleculeAnalytics {
  Molecule: string;
  Opportunity_Score: number;
  Competition_Count: number;
  Dominance_Ratio: number;
  Monopoly_Flag: boolean;
  Revenue_2023: number;
  Revenue_2024: number;
  Revenue_2025: number;
  STD_2023: number;
  STD_2024: number;
  STD_2025: number;
  STD_CAGR: number;
  Revenue_CAGR: number;
  Flags: string[];
  Brands: BrandDetail[];
  Sector_Split: SectorSplit;
  Innovation_Mix: InnovationMix;
}

export interface Analysis {
  description: string;
  sort_by: string;
  filter: string;
  results: MoleculeAnalytics[];
  count: number;
}

export interface UploadResponse {
  success: boolean;
  analytics?: MoleculeAnalytics[];
  analysis_1_growth?: Analysis;
  analysis_2_revenue?: Analysis;
  total_rows: number;
  unique_molecules: number;
  unique_products: number;
  error?: string;
}

export interface FilterParams {
  minStdCagr: number;
  maxCompetitionCount: number;
  minRevenue2023: number;
  minRevenue2024: number;
  minRevenue2025: number;
  minRevenueCagr: number;
  minOpportunityScore: number;
  maxDominanceRatio: number;
  monopolyMode: "all" | "monopoly_only" | "exclude_monopoly";
}

export type NavSection = "overview" | "molecules";
export type SortField =
  | "Molecule"
  | "Opportunity_Score"
  | "Competition_Count"
  | "Dominance_Ratio"
  | "Monopoly_Flag"
  | "Revenue_2023"
  | "Revenue_2024"
  | "Revenue_2025"
  | "STD_2023"
  | "STD_2024"
  | "STD_2025"
  | "STD_CAGR"
  | "Revenue_CAGR";
export type SortDirection = "asc" | "desc";
