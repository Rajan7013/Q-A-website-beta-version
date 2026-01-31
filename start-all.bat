@echo off
echo ========================================
echo   Antigravity Q&A System Launcher
echo ========================================
echo.
echo Starting all services...
echo.

REM Start Backend
start "Backend Server" cmd /k "cd backend-unified && npm run dev"
timeout /t 2 /nobreak >nul

REM Start Frontend
start "Frontend Server" cmd /k "cd frontend && npm run dev"
timeout /t 2 /nobreak >nul

REM Start Embedding Service
start "Embedding Service" cmd /k "cd embedding-service && python app.py"

echo.
echo ========================================
echo All services started!
echo ========================================
echo.
echo Backend:   http://localhost:5000
echo Frontend:  http://localhost:5173
echo Embedding: http://localhost:8001
echo.
echo Press any key to exit this launcher...
pause >nul
