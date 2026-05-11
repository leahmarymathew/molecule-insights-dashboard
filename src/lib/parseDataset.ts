import * as XLSX from "xlsx";

export const EXPECTED_COLUMNS = [
  "Molecule List",
  "International Product",
  "MAT Q2 2023_LCD MNF",
  "MAT Q2 2024_LCD MNF",
  "MAT Q2 2025_LCD MNF",
  "MAT Q2 2023_Standard Units",
  "MAT Q2 2024_Standard Units",
  "MAT Q2 2025_Standard Units",
] as const;

const NUMERIC_COLUMNS = EXPECTED_COLUMNS.filter((c) => c.startsWith("MAT"));

export type DatasetRow = Record<(typeof EXPECTED_COLUMNS)[number], string | number | null>;

const toNumber = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const cleaned = String(v).replace(/[, ]/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

const toText = (v: unknown): string => (v === null || v === undefined ? "" : String(v).trim());

export async function parseDatasetFile(file: File): Promise<DatasetRow[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });

  const rows: DatasetRow[] = [];
  for (const r of raw) {
    // Trim column names
    const trimmed: Record<string, unknown> = {};
    for (const k of Object.keys(r)) trimmed[k.trim()] = r[k];

    const molecule = toText(trimmed["Molecule List"]);
    const product = toText(trimmed["International Product"]);
    if (!molecule && !product) continue; // skip empty/invalid rows

    const row = {
      "Molecule List": molecule || null,
      "International Product": product || null,
    } as DatasetRow;

    for (const col of NUMERIC_COLUMNS) row[col] = toNumber(trimmed[col]);
    rows.push(row);
  }
  return rows;
}

export interface DatasetSummary {
  totalRows: number;
  totalMolecules: number;
  totalProducts: number;
}

export function summarize(rows: DatasetRow[]): DatasetSummary {
  const molecules = new Set<string>();
  const products = new Set<string>();
  for (const r of rows) {
    const m = r["Molecule List"];
    const p = r["International Product"];
    if (typeof m === "string" && m) molecules.add(m);
    if (typeof p === "string" && p) products.add(p);
  }
  return { totalRows: rows.length, totalMolecules: molecules.size, totalProducts: products.size };
}
