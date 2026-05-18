# Molecule Insights Dashboard

A full-stack dashboard for pharmaceutical molecule analytics.

Users upload an Excel file, the FastAPI backend computes molecule-level metrics, and the React frontend displays KPI cards, charts, and a filterable results table.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts
- **Backend:** FastAPI, Uvicorn, openpyxl

## Repository Structure

```text
.
├── src/                    # Frontend (React + Vite)
├── backend/                # FastAPI backend
├── ARCHITECTURE.md         # Frontend architecture notes
├── DEPLOYMENT.md           # Deployment-focused guidance
└── README.md               # This file
```

## Prerequisites

- Node.js and npm
- Python 3.10+

## Environment Variables

Create a `.env` file in the repository root:

```bash
VITE_API_BASE=http://127.0.0.1:8000
```

You can copy from `.env.example`.

## Local Development

### 1) Start backend

```bash
cd backend
python -m venv venv
# macOS/Linux
source venv/bin/activate
# Windows PowerShell
# .\venv\Scripts\Activate.ps1
# Windows Command Prompt
# .\venv\Scripts\activate.bat
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend health check: `http://127.0.0.1:8000/health`

### 2) Start frontend

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Data Flow

```text
Excel upload -> POST /upload -> backend analytics computation -> JSON response -> dashboard visualizations
```

## Expected Input Columns

The uploaded Excel file should include fields used by analytics, including:

- `Molecule List`
- `International Product`
- `MAT Q2 2023_LCD MNF`, `MAT Q2 2024_LCD MNF`, `MAT Q2 2025_LCD MNF`
- `MAT Q2 2023_Standard Units`, `MAT Q2 2024_Standard Units`, `MAT Q2 2025_Standard Units`

## Frontend Commands

Run from repository root:

```bash
npm run dev
npm run build
npm run build:dev
npm run preview
npm run lint
npm run format
```

## Backend API

- `GET /health` — service health
- `POST /upload` — accepts multipart file upload and returns analytics payload

## Additional Documentation

- `ARCHITECTURE.md`
- `DEPLOYMENT.md`
