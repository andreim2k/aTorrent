# @Torrent Production Deployment Guide

## 🚀 Production-Ready Features

This codebase is now cleaned and optimized for production deployment:

### ✅ Cleanup Completed
- **Removed all backup files** (.backup, .backup2, .backup3, .backup4, .bak)
- **Removed debug code** (console.log statements, development prints)
- **Cleaned cache files** (Python __pycache__ directories)
- **Production logging** (WARNING level only)
- **No mock data** (all APIs use real data sources)

### 🔧 Production Configuration
- **DEBUG = False** in configuration
- **Logging level: WARNING** (errors and warnings only)
- **Complete requirements** with all dependencies including libtorrent
- **Multi-architecture support** (x86_64 and ARM64)
- **Optimized WebSocket connections**
- **Real-time data only** (TMDB API, libtorrent data)

## 🖥️ Multi-Architecture Support

**✅ Tested and Production-Ready on:**
- Ubuntu/Debian x86_64
- Ubuntu/Debian ARM64
- Raspberry Pi 4+ (ARM64)
- AWS Graviton instances
- Apple Silicon (M1/M2) via containers/VMs
- Oracle Cloud ARM instances

## 🚀 Deployment Instructions

### Prerequisites

#### System Dependencies

**For x86_64 systems:**
```bash
# Update package lists
sudo apt update

# Install libtorrent and build dependencies
sudo apt install -y python3-libtorrent libtorrent-rasterbar2.0
sudo apt install -y python3-dev build-essential python3-venv python3-pip

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

**For ARM64 systems (Raspberry Pi, Apple Silicon, AWS Graviton):**
```bash
# Update package lists
sudo apt update

# Install libtorrent and build dependencies for ARM
sudo apt install -y python3-libtorrent libtorrent-rasterbar2.0
sudo apt install -y python3-dev build-essential python3-venv python3-pip
sudo apt install -y pkg-config libffi-dev

# Additional ARM optimization
sudo apt install -y gcc-aarch64-linux-gnu python3-wheel

# Install Node.js 18+ (ARM64 compatible)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

**For Raspberry Pi (additional optimizations):**
```bash
# Increase swap for compilation (if RAM < 4GB)
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=100/CONF_SWAPSIZE=1024/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

#### Firewall Configuration
```bash
# Allow application ports (if using UFW)
sudo ufw allow 8000  # Backend API
sudo ufw allow 3000  # Frontend
```

### Quick Production Setup

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd aTorrent
   
   # Setup services (automatically detects architecture)
   ./app.sh start
   ```

2. **Initialize application**
   ```bash
   cd backend
   python initialize_app.py
   ```

3. **Verify installation**
   ```bash
   # Check service status
   ../app.sh status
   
   # Test API health
   curl http://localhost:8000/health
   
   # Verify architecture compatibility
   python3 -c "import platform, libtorrent; print(f'Architecture: {platform.machine()}, libtorrent: {libtorrent.version}')"
   ```

### Manual Production Deployment

#### Backend Deployment
```bash
# Navigate to backend directory
cd backend/

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install all production dependencies (works on x86_64 and ARM64)
pip install -r requirements.txt

# Initialize the application (first time only)
python initialize_app.py

# Start production server
gunicorn app.main:app --bind 0.0.0.0:8000 --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

#### Frontend Deployment
```bash
cd frontend/

# Install dependencies (Node.js supports ARM64 natively)
npm install

# Build for production
npm run build

# Start production server
npm start
```

### Service Management

#### Using app.sh (Recommended)
```bash
# Start both services (architecture-agnostic)
./app.sh start all

# Start individual services
./app.sh start backend
./app.sh start frontend

# Check status
./app.sh status

# View logs
./app.sh logs backend
./app.sh logs frontend
./app.sh logs all

# Stop services
./app.sh stop all

# Restart services
./app.sh restart all
```

## 📁 Production File Structure
```
aTorrent/
├── app.sh                         # Service management script (multi-arch)
├── backend/                       # Backend API
│   ├── requirements.txt           # Complete Python dependencies (44+ packages)
│   ├── requirements.prod.txt      # Production subset
│   ├── SYSTEM_DEPENDENCIES.md     # Platform-specific requirements
│   ├── venv/                      # Python virtual environment
│   └── logs/                      # Application logs
├── frontend/                      # Frontend application
├── logs/                          # Service management logs
├── pids/                          # Process ID files
└── downloads/                     # Default torrent download directory
```

## 🔧 Complete Dependencies

### Python Dependencies (44+ packages)
The `backend/requirements.txt` includes all necessary packages with ARM64 compatibility:

**Core Application:**
- fastapi==0.116.1
- uvicorn==0.35.0
- **libtorrent==2.0.11** ⭐ (ARM64 compatible)

**Database & ORM:**
- sqlalchemy==2.0.43
- alembic==1.16.4

**Authentication & Security:**
- python-jose==3.5.0
- passlib==1.7.4
- bcrypt==4.3.0 (compiles on ARM)
- cryptography==45.0.6 (ARM64 wheels available)

**HTTP & Networking:**
- httpx==0.28.1
- requests==2.32.5
- websockets==15.0.1

**Development & Testing:**
- pytest==7.4.3
- black==23.11.0
- mypy==1.7.1

*See `backend/requirements.txt` for complete list - all packages are ARM64 compatible*

### System Dependencies by Platform

**x86_64:**
```bash
sudo apt install -y python3-libtorrent libtorrent-rasterbar2.0
sudo apt install -y python3-dev build-essential python3-venv python3-pip
```

**ARM64 (including Raspberry Pi):**
```bash
sudo apt install -y python3-libtorrent libtorrent-rasterbar2.0
sudo apt install -y python3-dev build-essential python3-venv python3-pip
sudo apt install -y pkg-config libffi-dev gcc-aarch64-linux-gnu
```

## 🔒 Security Considerations
- Single-user authentication system
- JWT token-based security
- CORS configured for production
- No debug information exposed
- Secure password hashing with bcrypt (ARM64 optimized)
- Firewall configuration for restricted access

## 📊 Monitoring & Logs
- **Application logs**: `backend/logs/aTorrent.log`
- **Service logs**: `logs/backend.log` and `logs/frontend.log`
- **Log rotation**: 10MB max, 3 backups
- **Health check**: `http://localhost:8000/health`
- **Architecture info**: Available via `/api/v1/system/info`

## 🎯 API Endpoints
- **Backend**: http://localhost:8000
- **Frontend**: http://localhost:3000
- **API Documentation**: http://localhost:8000/api/v1/docs
- **Health Check**: http://localhost:8000/health

## ⚡ Performance Optimizations

### General Performance
- Real-time WebSocket updates for torrent progress
- Efficient libtorrent integration with exact version pinning
- Gradient-based modern UI design
- Optimized database queries
- Minimal console logging in production
- Complete dependency specification prevents version conflicts

### ARM-Specific Optimizations
- Uses binary wheels when available for faster installation
- Optimized for low-power ARM devices (Raspberry Pi)
- Efficient memory usage suitable for ARM systems
- Native ARM64 compilation for maximum performance

### Platform Performance Notes
- **Raspberry Pi 4+**: Excellent performance with 4GB+ RAM
- **Apple Silicon**: Near-native performance via containers
- **AWS Graviton**: High performance, cost-effective
- **Traditional x86_64**: Full performance as expected

## 🐛 Troubleshooting

### Common Issues (All Platforms)
1. **Service startup issues**:
   ```bash
   # Check service status
   ./app.sh status
   
   # View detailed logs
   ./app.sh logs all
   
   # Restart services
   ./app.sh restart all
   ```

2. **Port conflicts**:
   ```bash
   # Check what's using the ports
   netstat -tlnp | grep -E "(8000|3000)"
   
   # Kill conflicting processes if needed
   sudo pkill -f "python.*8000"
   sudo pkill -f "node.*3000"
   ```

### ARM-Specific Troubleshooting

3. **libtorrent compilation/import errors on ARM**:
   ```bash
   # Ensure ARM build dependencies are installed
   sudo apt install -y python3-dev build-essential pkg-config libffi-dev
   
   # Rebuild virtual environment
   rm -rf venv
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

4. **Memory issues on Raspberry Pi**:
   ```bash
   # Check available memory
   free -h
   
   # Increase swap temporarily for installation
   sudo fallocate -l 2G /tmp/swapfile
   sudo chmod 600 /tmp/swapfile
   sudo mkswap /tmp/swapfile
   sudo swapon /tmp/swapfile
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Remove temporary swap
   sudo swapoff /tmp/swapfile
   sudo rm /tmp/swapfile
   ```

5. **ARM architecture verification**:
   ```bash
   # Check system architecture
   uname -m
   
   # Verify Python architecture
   python3 -c "import platform; print(f'Python arch: {platform.machine()}')"
   
   # Test libtorrent on ARM
   python3 -c "import libtorrent; print(f'libtorrent {libtorrent.version} on {platform.machine()}')"
   ```

### Health Checks
```bash
# Backend health (all architectures)
curl http://localhost:8000/health

# Frontend availability
curl http://localhost:3000

# Check service processes
./app.sh status

# Architecture-specific system info
python3 -c "import platform, psutil; print(f'Platform: {platform.machine()}, CPU count: {psutil.cpu_count()}, Memory: {psutil.virtual_memory().total // (1024**3)}GB')"
```

## 🌟 ARM Deployment Examples

### Raspberry Pi 4 (4GB RAM)
```bash
# Optimized setup for Raspberry Pi
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-libtorrent libtorrent-rasterbar2.0
sudo apt install -y python3-dev build-essential python3-venv python3-pip python3-wheel
sudo apt install -y pkg-config libffi-dev

# Clone and setup
git clone <repository-url>
cd aTorrent
./app.sh start

# Initialize
cd backend && python initialize_app.py
```

### AWS Graviton Instance
```bash
# High-performance ARM cloud deployment
sudo apt update
sudo apt install -y python3-libtorrent libtorrent-rasterbar2.0
sudo apt install -y python3-dev build-essential python3-venv python3-pip
sudo apt install -y pkg-config libffi-dev gcc-aarch64-linux-gnu

# Quick setup
git clone <repository-url>
cd aTorrent
./app.sh start
cd backend && python initialize_app.py
```

This deployment is production-ready with complete multi-architecture support for both x86_64 and ARM64 platforms.
