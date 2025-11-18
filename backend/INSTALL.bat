@echo off
echo ========================================
echo OptiBlood Backend - Windows Installation
echo ========================================
echo.

echo [1/3] Installing Node.js dependencies...
call npm install

echo.
echo [2/3] Checking Python installation...
python --version
if %errorlevel% neq 0 (
    echo WARNING: Python not found! Please install Python 3 for ML predictions.
    echo Download from: https://www.python.org/downloads/
)

echo.
echo [3/3] Setup complete!
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Make sure PostgreSQL is installed and running
echo 2. Create database by running: psql -U postgres -f setup.sql
echo 3. Update .env file with your credentials
echo 4. Start server: npm run dev
echo ========================================
echo.
echo To seed with sample data: node seed.js
echo.
pause

