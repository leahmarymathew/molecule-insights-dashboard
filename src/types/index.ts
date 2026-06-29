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
  Data_Quality_Flags?: {
    is_new_entrant: boolean;
    is_exiting: boolean;
    is_zero_revenue: boolean;
    is_low_revenue: boolean;
    has_2023_data: boolean;
    has_2024_data: boolean;
    has_2025_data: boolean;
  };
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
export type SortField = keyof MoleculeAnalytics;
export type SortDirection = "asc" | "desc";
