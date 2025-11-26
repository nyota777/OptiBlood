#!/bin/bash

echo "========================================"
echo "OptiBlood Backend - Linux/Mac Installation"
echo "========================================"
echo ""

echo "[1/3] Installing Node.js dependencies..."
npm install

echo ""
echo "[2/3] Checking Python installation..."
if command -v python3 &> /dev/null; then
    echo "✅ Python 3 found: $(python3 --version)"
else
    echo "⚠️  WARNING: Python 3 not found!"
    echo "Please install Python 3 for ML predictions."
fi

echo ""
echo "[3/3] Setup complete!"
echo ""
echo "========================================"
echo "Next Steps:"
echo "========================================"
echo "1. Make sure PostgreSQL is installed and running"
echo "2. Create database by running: psql -U postgres -f setup.sql"
echo "3. Update .env file with your credentials"
echo "4. Start server: npm run dev"
echo "========================================"
echo ""
echo "To seed with sample data: node seed.js"
echo ""

