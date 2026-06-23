from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from openpyxl import load_workbook
import io
import os
from typing import Dict, List, Any
from collections import defaultdict

app = FastAPI(
    title="MolecuLab Analytics Backend",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def to_number(value):
    if value is None:
        return 0.0

    try:
        return float(value)
    except (ValueError, TypeError):
        return 0.0


def compute_analytics(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not rows:
        return []

    molecules = defaultdict(list)

    for row in rows:
        mol = row.get("Molecule List")

        if mol:
            molecules[str(mol)].append(row)

    analytics = []

    for molecule, mol_rows in molecules.items():
        revenues_2023 = [
            to_number(r.get("MAT Q2 2023_LCD MNF"))
            for r in mol_rows
        ]

        revenues_2024 = [
            to_number(r.get("MAT Q2 2024_LCD MNF"))
            for r in mol_rows
        ]

        revenues_2025 = [
            to_number(r.get("MAT Q2 2025_LCD MNF"))
            for r in mol_rows
        ]

        stds_2023 = [
            to_number(r.get("MAT Q2 2023_Standard Units"))
            for r in mol_rows
        ]

        stds_2024 = [
            to_number(r.get("MAT Q2 2024_Standard Units"))
            for r in mol_rows
        ]

        stds_2025 = [
            to_number(r.get("MAT Q2 2025_Standard Units"))
            for r in mol_rows
        ]

        rev_2023 = sum(revenues_2023)
        rev_2024 = sum(revenues_2024)
        rev_2025 = sum(revenues_2025)

        std_2023 = sum(stds_2023)
        std_2024 = sum(stds_2024)
        std_2025 = sum(stds_2025)

        std_cagr = 0.0

        if std_2023 > 0 and std_2025 > 0:
            std_cagr = (
                ((std_2025 / std_2023) ** (1 / 2) - 1)
                * 100
            )

        elif std_2024 > 0 and std_2025 > 0:
            std_cagr = (
                (std_2025 / std_2024 - 1)
                * 100
            )

        rev_cagr = 0.0

        if rev_2023 > 0 and rev_2025 > 0:
            rev_cagr = (
                ((rev_2025 / rev_2023) ** (1 / 2) - 1)
                * 100
            )

        elif rev_2024 > 0 and rev_2025 > 0:
            rev_cagr = (
                (rev_2025 / rev_2024 - 1)
                * 100
            )

        price_2023 = rev_2023 / std_2023 if std_2023 > 0 else 0.0
        price_2024 = rev_2024 / std_2024 if std_2024 > 0 else 0.0
        price_2025 = rev_2025 / std_2025 if std_2025 > 0 else 0.0

        price_cagr = 0.0

        if price_2023 > 0 and price_2025 > 0:
            price_cagr = (
                ((price_2025 / price_2023) ** (1 / 2) - 1)
                * 100
            )

        elif price_2024 > 0 and price_2025 > 0:
            price_cagr = (
                (price_2025 / price_2024 - 1)
                * 100
            )

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

        competition_count = len(brand_revenue)

        top_brand_rev = max(
            brand_revenue.values(),
            default=0.0
        )

        total_rev_3y = (
            rev_2023 +
            rev_2024 +
            rev_2025
        )

        dominance_ratio = (
            top_brand_rev / total_rev_3y
            if total_rev_3y > 0
            else 0.0
        )

        MONOPOLY_THRESHOLD = 0.80

        monopoly_flag = (
            dominance_ratio >= MONOPOLY_THRESHOLD
            and competition_count > 1
        )

        # Edge case detection
        has_2023_data = rev_2023 > 0
        has_2024_data = rev_2024 > 0
        has_2025_data = rev_2025 > 0
        is_new_entrant = (not has_2023_data) and (not has_2024_data) and has_2025_data
        is_exiting = has_2023_data and (not has_2025_data)
        is_zero_revenue = total_rev_3y == 0
        is_low_revenue = total_rev_3y > 0 and total_rev_3y < 100000  # < $100K total 3-year
        
        # Robust normalization functions with edge case handling
        def norm_revenue(rev_2025_val):
            """
            Log-scale normalization for revenue.
            Handles: zero, very small, and extreme values.
            Maps to [0, 1] where higher = better
            """
            if rev_2025_val <= 0:
                return 0.1  # Minimum baseline for zero/negative
            
            # Log scale: log10(rev) clamped to reasonable range
            # Assumes revenues between $1K and $1B
            import math
            log_rev = math.log10(max(rev_2025_val, 1000))
            log_min = 3.0  # log10(1000) = $1K
            log_max = 9.0  # log10(1B) = $1B
            
            normalized = (log_rev - log_min) / (log_max - log_min)
            return max(0.0, min(1.0, normalized))
        
        def norm_cagr(v):
            """
            Normalize growth rate.
            Handles: negative growth, zero, extreme growth.
            Range: [-50%, 100%] → [0, 1]
            """
            clamped = max(-50.0, min(100.0, v))
            return (clamped + 50) / 150
        
        def norm_competition(c):
            """
            Normalize competition count.
            Handles: single vendor, monopoly, fragmented.
            Range: [1, 20] brands → [0, 1] (more competition = better)
            """
            if c < 1:
                return 0.0  # No competitors = worst scenario
            clamped = max(1, min(20, c))
            return 1 - (clamped - 1) / 19

        # Calculate weighted opportunity score
        # Weights: 35% revenue, 30% STD growth, 20% price growth, 15% competition
        revenue_score = norm_revenue(rev_2025) * 0.35
        growth_score = norm_cagr(std_cagr) * 0.30
        price_score = norm_cagr(price_cagr) * 0.20
        competition_score = norm_competition(competition_count) * 0.15
        
        # Base score before adjustments
        base_score = (revenue_score + growth_score + price_score + competition_score) * 100
        
        # Apply edge case penalties/adjustments
        opportunity_score = base_score
        
        # Penalize if zero revenue (markets to skip)
        if is_zero_revenue:
            opportunity_score *= 0.2  # Severe penalty
        
        # Penalize very small revenues (niche products, not worth attention)
        elif is_low_revenue:
            opportunity_score *= 0.6  # Moderate penalty
        
        # Penalize exiting products (declining markets)
        if is_exiting:
            opportunity_score *= 0.7
        
        # Boost new entrants if they show strong 2025 metrics
        if is_new_entrant and rev_2025 > 500000:
            opportunity_score *= 1.15
        
        # Penalize if monopoly (risk factor)
        if monopoly_flag:
            opportunity_score *= 0.85
        
        opportunity_score = round(max(0.0, opportunity_score), 1)

        analytics.append({
            "Molecule": molecule,
            "Opportunity_Score": opportunity_score,
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
            "Price_Per_Unit_CAGR": round(price_cagr, 2),
            "Data_Quality_Flags": {
                "is_new_entrant": is_new_entrant,
                "is_exiting": is_exiting,
                "is_zero_revenue": is_zero_revenue,
                "is_low_revenue": is_low_revenue,
                "has_2023_data": has_2023_data,
                "has_2024_data": has_2024_data,
                "has_2025_data": has_2025_data,
            }
        })

    # Create two separate analyses
    
    # ANALYSIS 1: Growth & Competition Focus
    # Remove ONLY monopolies (80%+ dominance), keep single vendors
    # Sort by STD_CAGR (volume growth)
    analysis_1_growth = [m for m in analytics if not m["Monopoly_Flag"]]
    analysis_1_growth.sort(key=lambda x: x["STD_CAGR"], reverse=True)
    
    # ANALYSIS 2: Revenue & Size Focus
    # Include all products
    # Score by Revenue_2025 (60%) + Revenue_CAGR (40%)
    def norm_revenue_2025(rev):
        if rev <= 0:
            return 0.1
        import math
        log_rev = math.log10(max(rev, 1000))
        log_min = 3.0   # $1K
        log_max = 9.0   # $1B
        normalized = (log_rev - log_min) / (log_max - log_min)
        return max(0.0, min(1.0, normalized))
    
    def norm_cagr_v2(v):
        clamped = max(-50.0, min(100.0, v))
        return (clamped + 50) / 150
    
    # Calculate revenue-based score for each molecule
    for mol in analytics:
        rev_2025_score = norm_revenue_2025(mol["Revenue_2025"]) * 0.60
        rev_cagr_score = norm_cagr_v2(mol["Revenue_CAGR"]) * 0.40
        mol["Revenue_Based_Score"] = round((rev_2025_score + rev_cagr_score) * 100, 1)
    
    analysis_2_revenue = sorted(analytics, key=lambda x: x["Revenue_Based_Score"], reverse=True)

    return {
        "success": True,
        "analysis_1_growth": {
            "description": "High-Growth & Competitive Markets (monopolies excluded)",
            "sort_by": "STD_CAGR (Volume Growth)",
            "filter": "Excluded: monopolies (80%+ dominance)",
            "results": analysis_1_growth,
            "count": len(analysis_1_growth)
        },
        "analysis_2_revenue": {
            "description": "High-Revenue & Market Size Focus (all products)",
            "sort_by": "Revenue_Based_Score (60% Revenue_2025 + 40% Revenue_CAGR)",
            "filter": "None (all products included)",
            "results": analysis_2_revenue,
            "count": len(analysis_2_revenue)
        },
        "total_rows": len(rows),
        "unique_molecules": len(molecules),
        "unique_products": len(products),
    }


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...)
):
    try:
        contents = await file.read()

        wb = load_workbook(
            io.BytesIO(contents)
        )

        ws = wb.active

        if not ws:
            raise ValueError(
                "No sheet found in workbook"
            )

        headers = []

        for cell in ws[1]:
            headers.append(cell.value)

        rows = []
        molecules = set()
        products = set()

        for row in ws.iter_rows(
            min_row=2,
            values_only=True
        ):
            if not any(row):
                continue

            row_dict = {}

            for col_idx, header in enumerate(headers):
                if (
                    header and
                    col_idx < len(row)
                ):
                    row_dict[header] = row[col_idx]

            rows.append(row_dict)

            if (
                "Molecule List" in row_dict and
                row_dict["Molecule List"]
            ):
                molecules.add(
                    str(row_dict["Molecule List"])
                )

            if (
                "International Product" in row_dict and
                row_dict["International Product"]
            ):
                products.add(
                    str(
                        row_dict[
                            "International Product"
                        ]
                    )
                )

        analytics = compute_analytics(rows)

        return {
            "success": True,
            "analytics": analytics,
            "total_rows": len(rows),
            "unique_molecules": len(molecules),
            "unique_products": len(products),
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "analytics": [],
        }


if __name__ == "__main__":
    import uvicorn

    port = int(
        os.getenv("PORT", "8000")
    )

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port
    )