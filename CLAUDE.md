# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Frontend (Vite dev server)
npm run dev          # Start dev server
npm run build        # Production build
npm run build:dev    # Dev-mode build
npm run preview      # Preview production build
npm run lint         # ESLint
npm run format       # Prettier
```

```powershell
# Backend (FastAPI) — run from backend/ directory
.\run.ps1            # Start uvicorn on http://127.0.0.1:8000
# Or manually:
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend must be running for file upload and analytics to work. Both run independently; no monorepo tooling ties them together.

## Architecture

This is a pharmaceutical molecule market analytics dashboard. Users upload an Excel file containing product revenue and unit sales data; the backend processes it and returns per-molecule analytics; the frontend displays KPI cards, charts, and a filterable results table.

### Data flow

```
XLSX upload → POST /upload (FastAPI) → openpyxl parsing →
compute_analytics() aggregation → JSON response →
Dashboard.tsx state → FilterPanel (client-side) →
KpiCard / ResultsTable / ChartPanel rendering
```

### Frontend (`src/`)

- **Entry point**: `src/client.tsx` renders into `#root`
- **Routing**: TanStack Router; `src/routes/index.tsx` is the root route (note: components there are partially commented out during an ongoing debug — the active UI lives in `src/pages/Dashboard.tsx`)
- **State**: Local React state only — no Redux/Context. `Dashboard.tsx` owns `rows`, `analytics`, and `filters`; passes them down as props
- **UI library**: shadcn/ui components (Radix-based) in `src/components/ui/`; chart components use Recharts
- **Styling**: Tailwind CSS v4 (Vite plugin, no `tailwind.config.js` needed for v4), dark theme by default with oklch design tokens in `src/styles.css`

Key source directories:
| Path | Purpose |
|------|---------|
| `src/types/index.ts` | All TypeScript interfaces (`DatasetRow`, `MoleculeAnalytics`, `FilterParams`, `UploadResponse`) |
| `src/services/api.ts` | `uploadFile()` — the only backend call |
| `src/pages/Dashboard.tsx` | Main page: owns all state, wires UploadSection → filters → display |
| `src/components/` | Feature components (UploadSection, FilterPanel, ResultsTable, ChartPanel, KpiCard) |
| `src/components/dashboard/` | Older shadcn-style versions of the same components (partially superseded) |

### Backend (`backend/`)

Single-file FastAPI app: `backend/main.py`

- `POST /upload` — receives `UploadFile`, reads with openpyxl, calls `compute_analytics()`, returns `UploadResponse`
- `compute_analytics(rows)` — groups `DatasetRow[]` by `Molecule List`, aggregates revenue and standard units across 2023/2024/2025, computes derived metrics, sorts by `Opportunity_Score` descending

### Key data types

**`DatasetRow`** — one row from the Excel file. Required columns: `Molecule List`, `International Product`, `MAT Q2 {2023|2024|2025}_LCD MNF` (revenue), `MAT Q2 {2023|2024|2025}_Standard Units`.

**`MoleculeAnalytics`** — computed per molecule:

- `Competition_Count` — unique brand count
- `Dominance_Ratio` — top brand's share of 2025 revenue (0–1)
- `Monopoly_Flag` — true when `Dominance_Ratio >= 0.80`
- `STD_CAGR` — 2-year CAGR of standard units: `(std_2025 / std_2023)^0.5 - 1`
- `Opportunity_Score` — weighted composite (0–100+): 30% revenue + 30% growth + 20% low competition + 20% low dominance, minus 30 if monopoly

**`FilterParams`** — client-side filter state applied in Dashboard before passing to display components: `minStdCagr`, `maxCompetitionCount`, `minRevenue2025`, `maxDominanceRatio`, `minOpportunityScore`, `monopolyMode`.

## Tech stack

| Layer              | Technology                                 |
| ------------------ | ------------------------------------------ |
| Frontend framework | React 19 + TypeScript 5.8                  |
| Build              | Vite 7                                     |
| Routing            | TanStack Router 1.x                        |
| Data fetching      | TanStack Query 5                           |
| Styling            | Tailwind CSS 4, shadcn/ui, Radix UI        |
| Charts             | Recharts 3                                 |
| Forms              | React Hook Form + Zod                      |
| Backend            | FastAPI + uvicorn                          |
| Excel parsing      | openpyxl (backend), xlsx (frontend export) |
