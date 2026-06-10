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
  Price_Per_Unit_CAGR: number;
}

export interface UploadResponse {
  success: boolean;
  rows: DatasetRow[];
  analytics: MoleculeAnalytics[];
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
  monopolyMode: "all" | "monopoly_only" | "exclude_monopoly";
}

export type NavSection = "overview" | "molecules" | "upload" | "reports";
export type SortField = keyof MoleculeAnalytics;
export type SortDirection = "asc" | "desc";
