from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from openpyxl import load_workbook
import io
import os
from typing import Dict, List, Any
from collections import defaultdict

app = FastAPI(title="MolecuLab Analytics Backend", version="1.0.0")

_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def to_number(value):
    """Convert value to float, return 0 if invalid"""
    if value is None:
        return 0.0
    try:
        return float(value)
    except (ValueError, TypeError):
        return 0.0


def compute_analytics(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Compute analytics from raw data rows
    Groups by molecule and computes aggregate metrics
    """
    if not rows:
        return []

    # Group rows by molecule
    molecules = defaultdict(list)
    for row in rows:
        mol = row.get("Molecule List")
        if mol:
            molecules[str(mol)].append(row)

    analytics = []

    for molecule, mol_rows in molecules.items():
        # Extract revenue and STD values
        revenues_2023 = [to_number(r.get("MAT Q2 2023_LCD MNF")) for r in mol_rows]
        revenues_2024 = [to_number(r.get("MAT Q2 2024_LCD MNF")) for r in mol_rows]
        revenues_2025 = [to_number(r.get("MAT Q2 2025_LCD MNF")) for r in mol_rows]

        stds_2023 = [to_number(r.get("MAT Q2 2023_Standard Units")) for r in mol_rows]
        stds_2024 = [to_number(r.get("MAT Q2 2024_Standard Units")) for r in mol_rows]
        stds_2025 = [to_number(r.get("MAT Q2 2025_Standard Units")) for r in mol_rows]

        # Sum aggregates
        rev_2023 = sum(revenues_2023)
        rev_2024 = sum(revenues_2024)
        rev_2025 = sum(revenues_2025)

        std_2023 = sum(stds_2023)
        std_2024 = sum(stds_2024)
        std_2025 = sum(stds_2025)

        # STD CAGR — prefer 2-year; fall back to 1-year if 2023 missing
        std_cagr = 0.0
        if std_2023 > 0 and std_2025 > 0:
            std_cagr = ((std_2025 / std_2023) ** (1 / 2) - 1) * 100
        elif std_2024 > 0 and std_2025 > 0:
            std_cagr = (std_2025 / std_2024 - 1) * 100

        # Revenue CAGR — same fallback logic
        rev_cagr = 0.0
        if rev_2023 > 0 and rev_2025 > 0:
            rev_cagr = ((rev_2025 / rev_2023) ** (1 / 2) - 1) * 100
        elif rev_2024 > 0 and rev_2025 > 0:
            rev_cagr = (rev_2025 / rev_2024 - 1) * 100


        # Aggregate revenue by brand across all 3 years — skip blank entries
        brand_revenue = defaultdict(float)
        for row in mol_rows:
            brand = row.get("International Product")
            if not brand:
                continue
            brand = str(brand).strip()
            if not brand:
                continue
            rev = (
                to_number(row.get("MAT Q2 2023_LCD MNF"))
                + to_number(row.get("MAT Q2 2024_LCD MNF"))
                + to_number(row.get("MAT Q2 2025_LCD MNF"))
            )
            brand_revenue[brand] += rev

        # Competition count (unique brands)
        competition_count = len(brand_revenue)

        # Find top brand revenue (for dominance ratio)
        top_brand_rev = max(brand_revenue.values(), default=0.0)

        # Dominance ratio: top brand's 3-year share of molecule's 3-year total
        total_rev_3y = rev_2023 + rev_2024 + rev_2025
        dominance_ratio = top_brand_rev / total_rev_3y if total_rev_3y > 0 else 0.0

        # Monopoly flag (dominance >= threshold)
        MONOPOLY_THRESHOLD = 0.80
        monopoly_flag = dominance_ratio >= MONOPOLY_THRESHOLD

        # HHI — sum of squared brand revenue shares (3-year)
        hhi = 0.0
        if total_rev_3y > 0:
            for rev in brand_revenue.values():
                share = rev / total_rev_3y
                hhi += share ** 2

        analytics.append({
            "Molecule": molecule,
            "Competition_Count": competition_count,
            "Dominance_Ratio": round(dominance_ratio, 4),
            "Monopoly_Flag": monopoly_flag,
            "Revenue_2023": round(rev_2023, 2),
            "Revenue_2024": round(rev_2024, 2),
            "Revenue_2025": round(rev_2025, 2),
            "STD_2023": round(std_2023, 2),
            "STD_2024": round(std_2024, 2),
            "STD_2025": round(std_2025, 2),
            "STD_CAGR": round(std_cagr, 2),
            "Revenue_CAGR": round(rev_cagr, 2),
            "HHI": round(hhi, 4),
        })

    # Sort by opportunity score descending
    analytics.sort(key=lambda x: x["Revenue_2025"], reverse=True)
    return analytics


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}


@app.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """
    Upload and parse Excel file, compute analytics
    
    Returns:
    - success: boolean
    - rows: array of raw parsed data rows
    - analytics: array of computed molecule analytics
    - total_rows: number of data rows
    - unique_molecules: count of unique molecules
    - unique_products: count of unique international products
    """
    try:
        # Read file into memory
        contents = await file.read()
        wb = load_workbook(io.BytesIO(contents))
        ws = wb.active
        
        if not ws:
            raise ValueError("No sheet found in workbook")
        
        # Get headers from first row
        headers = []
        for cell in ws[1]:
            headers.append(cell.value)
        
        # Parse data rows
        rows = []
        molecules = set()
        products = set()
        
        for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
            if not any(row):  # Skip empty rows
                continue
            
            row_dict = {}
            for col_idx, header in enumerate(headers):
                if header and col_idx < len(row):
                    row_dict[header] = row[col_idx]
            
            rows.append(row_dict)
            
            # Track unique molecules and products
            if "Molecule List" in row_dict and row_dict["Molecule List"]:
                molecules.add(str(row_dict["Molecule List"]))
            if "International Product" in row_dict and row_dict["International Product"]:
                products.add(str(row_dict["International Product"]))
        
        # Compute analytics from raw rows
        analytics = compute_analytics(rows)
        
        return {
            "success": True,
            "rows": rows,
            "analytics": analytics,
            "total_rows": len(rows),
            "unique_molecules": len(molecules),
            "unique_products": len(products),
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "rows": [],
            "analytics": [],
            "total_rows": 0,
            "unique_molecules": 0,
            "unique_products": 0,
        }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
