#!/bin/bash

# Start FastAPI backend (system monitor on a dedicated port)
cd ./src/admin/components/system/sysmon/services || exit 1
uvicorn main:app --host 0.0.0.0 --port 8001 &
cd - > /dev/null

# Start Vite frontend
npm run dev
