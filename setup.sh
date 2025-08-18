#!/bin/bash

# aTorrent Setup Script
# Created by Andrei (@andreim2k)

set -e

echo "🚀 Setting up aTorrent - Modern Torrent Client"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if Node.js is installed (for local development)
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed. You'll need it for local frontend development."
        return 1
    fi
    
    NODE_VERSION=$(node --version | sed 's/v//')
    if [ "$(printf '%s\n' "18.0.0" "$NODE_VERSION" | sort -V | head -n1)" != "18.0.0" ]; then
        print_warning "Node.js version is $NODE_VERSION. Recommended version is 18.0.0 or higher."
        return 1
    fi
    
    print_success "Node.js $(node --version) is installed"
    return 0
}

# Check if Python is installed (for local development)
check_python() {
    if ! command -v python3 &> /dev/null; then
        print_warning "Python 3 is not installed. You'll need it for local backend development."
        return 1
    fi
    
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    if [ "$(printf '%s\n' "3.10.0" "$PYTHON_VERSION" | sort -V | head -n1)" != "3.10.0" ]; then
        print_warning "Python version is $PYTHON_VERSION. Recommended version is 3.10.0 or higher."
        return 1
    fi
    
    print_success "Python $(python3 --version) is installed"
    return 0
}

# Setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Copy environment file
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success "Created .env file from .env.example"
    fi
    
    # Create virtual environment if running locally
    if check_python; then
        if [ ! -d "venv" ]; then
            python3 -m venv venv
            print_success "Created Python virtual environment"
        fi
        
        print_status "Installing Python dependencies..."
        source venv/bin/activate
        pip install -r requirements.txt
        print_success "Python dependencies installed"
    fi
    
    cd ..
}

# Setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd frontend
    
    if check_nodejs; then
        print_status "Installing Node.js dependencies..."
        npm install
        print_success "Node.js dependencies installed"
    fi
    
    cd ..
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p downloads
    mkdir -p backend/data
    mkdir -p logs
    
    print_success "Directories created"
}

# Generate secret key
generate_secret_key() {
    print_status "Generating secret key..."
    
    SECRET_KEY=$(openssl rand -hex 32)
    
    # Update backend .env file
    if [ -f backend/.env ]; then
        if grep -q "SECRET_KEY=your-secret-key" backend/.env; then
            sed -i.bak "s/SECRET_KEY=your-secret-key.*/SECRET_KEY=$SECRET_KEY/" backend/.env
            print_success "Updated secret key in backend/.env"
        fi
    fi
}

# Setup Git repository
setup_git() {
    print_status "Setting up Git repository..."
    
    if [ ! -d ".git" ]; then
        git init
        print_success "Initialized Git repository"
    fi
    
    # Create .gitignore if it doesn't exist
    if [ ! -f .gitignore ]; then
        cat > .gitignore << 'EOF'
# Environment files
.env
*.env.local

# Dependencies
node_modules/
venv/
__pycache__/
*.pyc

# Build outputs
.next/
dist/
build/

# Database
*.db
*.sqlite

# Logs
logs/
*.log

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Downloads
downloads/

# Docker
docker-data/
EOF
        print_success "Created .gitignore file"
    fi
}

# Main setup function
main() {
    echo
    print_status "Starting aTorrent setup..."
    echo
    
    check_docker
    create_directories
    setup_backend
    setup_frontend
    generate_secret_key
    setup_git
    
    echo
    print_success "🎉 aTorrent setup completed successfully!"
    echo
    echo "Next steps:"
    echo "1. Start with Docker: docker-compose up -d"
    echo "2. Or run locally:"
    echo "   - Backend: cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
    echo "   - Frontend: cd frontend && npm run dev"
    echo
    echo "Access the application:"
    echo "- Frontend: http://localhost:3000"
    echo "- Backend API: http://localhost:8000"
    echo "- API Documentation: http://localhost:8000/api/v1/docs"
    echo
    echo "Default login credentials:"
    echo "- Email: admin@atorrent.local"
    echo "- Password: admin123"
    echo
    echo "📖 For more information, check the README.md file"
    echo
}

# Run main function
main "$@"
