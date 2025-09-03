# @Torrent - Modern BitTorrent Client

<div align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-blue.svg" alt="Python">
  <img src="https://img.shields.io/badge/Next.js-14+-black.svg" alt="Next.js">
  <img src="https://img.shields.io/badge/FastAPI-Latest-green.svg" alt="FastAPI">
  <img src="https://img.shields.io/badge/ARM-Compatible-brightgreen.svg" alt="ARM Compatible">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
</div>

## 🚀 Overview

@Torrent is a modern, production-ready BitTorrent client built with Python (FastAPI) backend and Next.js frontend. It provides a clean, responsive web interface for managing torrents with advanced features like automatic filename sanitization and real-time progress tracking.

**✅ Multi-Architecture Support**: Works on both x86_64 and ARM64 platforms (including Raspberry Pi, Apple Silicon, AWS Graviton, etc.)

## ✨ Key Features

### 🎯 Core Functionality
- **Modern Web Interface**: Responsive Next.js frontend with real-time updates
- **REST API**: Comprehensive FastAPI backend with full torrent management
- **WebSocket Support**: Live torrent status updates and progress tracking
- **Authentication**: JWT-based secure authentication system
- **Cross-Platform**: Runs on x86_64 and ARM64 architectures

### 🛡️ File Management
- **Automatic Filename Sanitization**: Removes commas and replaces spaces with dots in torrent names
- **Clean Directory Structure**: Organized file/folder creation without problematic characters
- **Safe Downloads**: Prevents file naming conflicts and improves compatibility

### ⚡ Performance & Production
- **Production Ready**: Optimized logging, CORS configuration, and security settings  
- **Low Resource Usage**: Efficient memory and CPU utilization (ideal for ARM devices)
- **Flexible CORS**: Supports requests from any origin for maximum compatibility
- **Robust Error Handling**: Comprehensive error management and recovery

## 🏗️ Architecture

### Backend (FastAPI + Python)
- **FastAPI** - Modern, fast web framework with automatic API documentation
- **SQLAlchemy** - Database ORM with SQLite for data persistence
- **libtorrent** - High-performance BitTorrent library for torrent handling
- **JWT Authentication** - Secure token-based authentication
- **WebSocket Support** - Real-time communication with frontend

### Frontend (Next.js)
- **Next.js 14+** - React framework with server-side rendering
- **TypeScript** - Type-safe development experience
- **Real-time UI** - WebSocket integration for live updates
- **Responsive Design** - Mobile-friendly interface

## 🚦 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Ubuntu/Debian system (x86_64 or ARM64)

### Platform Support
**Tested and verified on:**
- ✅ Ubuntu/Debian x86_64
- ✅ Ubuntu/Debian ARM64 
- ✅ Raspberry Pi OS (ARM64)
- ✅ Apple Silicon (M1/M2) via Ubuntu ARM64
- ✅ AWS Graviton instances
- ✅ Other ARM64 Linux distributions

### Quick Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd aTorrent
   ```

2. **Install system dependencies**
   
   **For x86_64 systems:**
   ```bash
   # Update package lists
   sudo apt update
   
   # Install libtorrent and build dependencies
   sudo apt install -y python3-libtorrent libtorrent-rasterbar2.0
   sudo apt install -y python3-dev build-essential python3-venv python3-pip
   ```
   
   **For ARM64 systems (Raspberry Pi, Apple Silicon, etc.):**
   ```bash
   # Update package lists
   sudo apt update
   
   # Install libtorrent and build dependencies for ARM
   sudo apt install -y python3-libtorrent libtorrent-rasterbar2.0
   sudo apt install -y python3-dev build-essential python3-venv python3-pip
   sudo apt install -y pkg-config libffi-dev
   ```

3. **Setup and start services**
   ```bash
   ./app.sh start
   ```

4. **Initialize the application**
   ```bash
   cd backend
   python initialize_app.py
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/api/v1/docs

### Manual Installation

If you prefer manual setup:

#### Backend Setup
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install all Python dependencies (includes libtorrent==2.0.11)
# Works on both x86_64 and ARM64 platforms
pip install -r requirements.txt

# Initialize database and create admin user
python initialize_app.py

# Start backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
cd frontend

# Install Node.js dependencies (supports ARM64)
npm install

# Build and start frontend
npm run build
npm start
```

### Default Credentials
- **Password**: Set during initialization via `initialize_app.py`
- **Username**: Single-user application (no username required)

## 🔧 Dependencies

### Python Dependencies (Backend)
All dependencies are specified with exact versions in `backend/requirements.txt`:

**Core Framework:**
- fastapi==0.116.1
- uvicorn==0.35.0
- starlette==0.47.2

**Torrent Handling:**
- libtorrent==2.0.11 (ARM64 compatible)

**Database & ORM:**
- sqlalchemy==2.0.43
- alembic==1.16.4

**Authentication:**
- python-jose==3.5.0
- passlib==1.7.4
- bcrypt==4.3.0

**Development Tools:**
- pytest==7.4.3
- black==23.11.0
- mypy==1.7.1

*Complete list: See `backend/requirements.txt` for all 44+ dependencies*

### System Dependencies

**For x86_64 systems:**
```bash
sudo apt install -y python3-libtorrent libtorrent-rasterbar2.0
sudo apt install -y python3-dev build-essential python3-venv python3-pip
```

**For ARM64 systems (including Raspberry Pi):**
```bash
sudo apt install -y python3-libtorrent libtorrent-rasterbar2.0
sudo apt install -y python3-dev build-essential python3-venv python3-pip
sudo apt install -y pkg-config libffi-dev
```

See `backend/SYSTEM_DEPENDENCIES.md` for detailed platform-specific requirements.

## 🔧 Configuration

### Environment Variables
- `SECRET_KEY`: JWT secret key (auto-generated if not provided)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:3000)
- `DOWNLOAD_PATH`: Default download directory (configurable via web interface)

### Service Management
```bash
# Start services
./app.sh start

# Stop services  
./app.sh stop

# Restart services
./app.sh restart

# Check status
./app.sh status
```

## 📁 File Organization

The application automatically sanitizes torrent filenames and directory names:

### Sanitization Rules
- **Commas (`,`) are removed** from all names
- **Spaces (` `) are replaced with dots (`.`)**
- **File extensions are preserved**
- **Directory structure is maintained**

### Examples
- `Movie Title, Part 1 (2023).mkv` → `Movie.Title.Part.1.(2023).mkv`
- `Season 1, Episode 01/` → `Season.1.Episode.01/`
- `Subtitle File, English.srt` → `Subtitle.File.English.srt`

## 🛠️ Development

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Development  
```bash
cd frontend
npm install
npm run dev
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **CORS Protection**: Configurable cross-origin resource sharing
- **Input Validation**: Comprehensive request validation
- **Production Logging**: Warning-level logging for production environments
- **Secure Headers**: Appropriate security headers for web requests

## 📊 API Documentation

The API provides comprehensive endpoints for torrent management:

- **Authentication**: `/api/v1/auth/*` - Login, logout, token refresh
- **Torrents**: `/api/v1/torrents/*` - CRUD operations, status, control
- **System**: `/api/v1/system/*` - System information and statistics

Full API documentation is available at `/api/v1/docs` when the server is running.

## 🖥️ Platform Compatibility

### Supported Architectures
- **x86_64** - Traditional Intel/AMD systems
- **ARM64** - Apple Silicon (M1/M2), Raspberry Pi 4+, AWS Graviton, etc.

### ARM-Specific Notes
- All Python dependencies compile successfully on ARM64
- libtorrent has native ARM support through system packages
- Performance is excellent on modern ARM processors (Apple Silicon, Graviton)
- Raspberry Pi 4+ with 4GB+ RAM recommended for optimal performance

### Tested Platforms
- Ubuntu 20.04+ (x86_64 and ARM64)
- Raspberry Pi OS (ARM64)
- macOS with ARM (via Ubuntu ARM64 containers/VMs)
- AWS EC2 Graviton instances
- Oracle Cloud ARM instances

## 🚀 Production Deployment

For production deployment, see [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) for detailed instructions including ARM-specific considerations.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/) and [Next.js](https://nextjs.org/)
- Powered by [libtorrent](https://libtorrent.org/) for BitTorrent functionality
- Designed for production use with emphasis on reliability and performance
- Optimized for both x86_64 and ARM64 architectures
