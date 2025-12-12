@echo off
echo =========================================
echo 🚀 Q&A System - Ultimate Upgrade
echo 90-95%% Accuracy Implementation
echo =========================================
echo.

echo Step 1: Installing Backend Dependencies...
cd backend-unified
call npm install
if errorlevel 1 (
    echo ❌ Backend dependencies installation failed!
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed!
echo.

echo Step 2: Installing Embedding Service Dependencies...
cd ..\embedding-service
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Embedding service dependencies installation failed!
    pause
    exit /b 1
)
echo ✅ Embedding service dependencies installed!
echo.

echo =========================================
echo ✅ ALL DEPENDENCIES INSTALLED!
echo =========================================
echo.
echo Next Steps:
echo 1. Run MASTER_DATABASE_SETUP.sql in Supabase
echo 2. Update .env file with:
echo    - EMBEDDING_SERVICE_URL=http://localhost:8001
echo 3. Run START_SERVICES.bat to start everything
echo.
pause
