import type { DatasetRow } from "./parseDataset";

export interface MoleculeAnalytics {
  Molecule: string;
  Competition_Count: number;
  Top_Brand: string;
  Dominance_Ratio: number;
  Monopoly_Flag: boolean;
  Revenue_2023: number;
  Revenue_2024: number;
  Revenue_2025: number;
  STD_2023: number;
  STD_2024: number;
  STD_2025: number;
  STD_CAGR: number;
  Revenue_per_STD_2025: number;
  Revenue_per_STD_CAGR: number;
  Investment_Efficiency: number;
  Opportunity_Score: number;
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const safeDiv = (a: number, b: number) => (b > 0 ? a / b : 0);
const cagr2y = (end: number, start: number) =>
  start > 0 && end > 0 ? (Math.pow(end / start, 1 / 2) - 1) * 100 : 0;

export function analyzeMolecules(rows: DatasetRow[]): MoleculeAnalytics[] {
  const groups = new Map<string, DatasetRow[]>();
  for (const r of rows) {
    const m = r["Molecule List"];
    if (typeof m !== "string" || !m) continue;
    if (!groups.has(m)) groups.set(m, []);
    groups.get(m)!.push(r);
  }

  const results: MoleculeAnalytics[] = [];
  for (const [molecule, list] of groups) {
    let r23 = 0, r24 = 0, r25 = 0, s23 = 0, s24 = 0, s25 = 0;
    const brandRevenue = new Map<string, number>();
    const brands = new Set<string>();

    for (const row of list) {
      const a23 = num(row["MAT Q2 2023_LCD MNF"]);
      const a24 = num(row["MAT Q2 2024_LCD MNF"]);
      const a25 = num(row["MAT Q2 2025_LCD MNF"]);
      r23 += a23; r24 += a24; r25 += a25;
      s23 += num(row["MAT Q2 2023_Standard Units"]);
      s24 += num(row["MAT Q2 2024_Standard Units"]);
      s25 += num(row["MAT Q2 2025_Standard Units"]);

      const brand = row["International Product"];
      if (typeof brand === "string" && brand) {
        brands.add(brand);
        brandRevenue.set(brand, (brandRevenue.get(brand) || 0) + a25);
      }
    }

    let topBrand = "";
    let topRev = 0;
    for (const [b, rev] of brandRevenue) {
      if (rev > topRev) { topRev = rev; topBrand = b; }
    }
    const dominance = safeDiv(topRev, r25);
    const monopoly = dominance >= 0.8;

    const stdCagr = cagr2y(s25, s23);
    const revPerStd25 = safeDiv(r25, s25);
    const revPerStd23 = safeDiv(r23, s23);
    const revPerStdCagr = cagr2y(revPerStd25, revPerStd23);
    const competition = brands.size;
    const investEff = safeDiv(r25, s25 * competition);
    const opportunity = stdCagr * 0.4 + revPerStdCagr * 0.3 + investEff * 0.3;

    results.push({
      Molecule: molecule,
      Competition_Count: competition,
      Top_Brand: topBrand || "—",
      Dominance_Ratio: dominance,
      Monopoly_Flag: monopoly,
      Revenue_2023: r23,
      Revenue_2024: r24,
      Revenue_2025: r25,
      STD_2023: s23,
      STD_2024: s24,
      STD_2025: s25,
      STD_CAGR: stdCagr,
      Revenue_per_STD_2025: revPerStd25,
      Revenue_per_STD_CAGR: revPerStdCagr,
      Investment_Efficiency: investEff,
      Opportunity_Score: opportunity,
    });
  }

  results.sort((a, b) => b.Opportunity_Score - a.Opportunity_Score);
  return results;
}
