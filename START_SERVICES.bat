@echo off
echo =========================================
echo 🚀 Starting Q&A System - Ultimate Edition
echo =========================================
echo.

echo Starting Embedding Service (Python)...
start "Embedding Service" cmd /k "cd embedding-service && python server.py"
timeout /t 5 /nobreak >nul
echo ✅ Embedding service starting at http://localhost:8001
echo.

echo Starting Backend (Node.js)...
start "Backend Server" cmd /k "cd backend-unified && npm run dev"
timeout /t 3 /nobreak >nul
echo ✅ Backend starting at http://localhost:5000
echo.

echo Starting Frontend (React)...
start "Frontend" cmd /k "cd frontend && npm run dev"
echo ✅ Frontend starting at http://localhost:5173
echo.

echo =========================================
echo ✅ ALL SERVICES STARTED!
echo =========================================
echo.
echo 📡 Services running:
echo   - Embedding: http://localhost:8001/health
echo   - Backend:   http://localhost:5000/health
echo   - Frontend:  http://localhost:5173
echo.
echo Press Ctrl+C in each window to stop services
echo.
pause
