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
        )

        def norm_cagr(v):
            clamped = max(-50.0, min(100.0, v))
            return (clamped + 50) / 150

        def norm_competition(c):
            clamped = max(1, min(20, c))
            return 1 - (clamped - 1) / 19

        opportunity_score = round(
            (norm_cagr(std_cagr) + norm_cagr(price_cagr) + norm_competition(competition_count))
            / 3 * 100,
            1
        )

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
        })

    analytics.sort(
        key=lambda x: x["Opportunity_Score"],
        reverse=True
    )

    return analytics


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