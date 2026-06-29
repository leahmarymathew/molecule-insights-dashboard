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
  Flags: string[];
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
  monopolyMode: "all" | "monopoly_only" | "exclude_monopoly";
}

export type NavSection = "overview" | "molecules" | "reports";
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
