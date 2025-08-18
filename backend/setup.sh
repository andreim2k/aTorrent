#!/bin/bash
# aTorrent Backend Setup Script

set -e

echo "🚀 Setting up aTorrent Backend..."

# Check Python version
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "✅ Found Python $PYTHON_VERSION"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "📈 Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️ Creating .env file..."
    cp .env.example .env
    echo "📝 Please edit .env file to configure your settings"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p downloads
mkdir -p uploads
mkdir -p logs

# Initialize database
echo "🗄️ Initializing database..."
python -c "
from app.db.init_db import init_db
init_db()
print('Database initialized successfully')
"

echo "✅ Setup completed successfully!"
echo ""
echo "To start the server:"
echo "1. Activate virtual environment: source venv/bin/activate"
echo "2. Start server: python main.py"
echo "   or: uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
echo ""
echo "🌐 API will be available at: http://localhost:8000"
echo "📚 API documentation: http://localhost:8000/api/v1/docs"
