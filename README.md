# @Torrent - Modern BitTorrent Client

<div align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-blue.svg" alt="Python">
  <img src="https://img.shields.io/badge/Next.js-14+-black.svg" alt="Next.js">
  <img src="https://img.shields.io/badge/FastAPI-Latest-green.svg" alt="FastAPI">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
</div>

## 🚀 Overview

@Torrent is a modern, production-ready BitTorrent client built with Python (FastAPI) backend and Next.js frontend. It provides a clean, responsive web interface for managing torrents with advanced features like automatic filename sanitization and real-time progress tracking.

## ✨ Key Features

### 🎯 Core Functionality
- **Modern Web Interface**: Responsive Next.js frontend with real-time updates
- **REST API**: Comprehensive FastAPI backend with full torrent management
- **WebSocket Support**: Live torrent status updates and progress tracking
- **Authentication**: JWT-based secure authentication system

### 🛡️ File Management
- **Automatic Filename Sanitization**: Removes commas and replaces spaces with dots in torrent names
- **Clean Directory Structure**: Organized file/folder creation without problematic characters
- **Safe Downloads**: Prevents file naming conflicts and improves compatibility

### ⚡ Performance & Production
- **Production Ready**: Optimized logging, CORS configuration, and security settings  
- **Low Resource Usage**: Efficient memory and CPU utilization
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
- libtorrent system packages

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd aTorrent
   ```

2. **Setup and start services**
   ```bash
   ./app.sh start
   ```

3. **Initialize the application**
   ```bash
   cd backend
   python initialize_app.py
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/api/v1/docs

### Default Credentials
- **Password**: Set during initialization via `initialize_app.py`
- **Username**: Single-user application (no username required)

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
