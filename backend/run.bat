@echo off
REM Run FastAPI backend
echo Starting FastAPI backend...
call venv\Scripts\activate.bat
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
