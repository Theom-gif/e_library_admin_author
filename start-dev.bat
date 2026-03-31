@echo off
REM Start FastAPI backend (system monitor on a dedicated port)
cd src\admin\components\system\sysmon\services
start "FastAPI" uvicorn main:app --host 0.0.0.0 --port 8001
cd ..\..\..\..\..\..
REM Start Vite frontend
npm run dev
