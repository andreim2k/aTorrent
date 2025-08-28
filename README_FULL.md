# @Torrent - Modern BitTorrent Client

<div align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-blue.svg" alt="Python">
  <img src="https://img.shields.io/badge/Next.js-14+-black.svg" alt="Next.js">
  <img src="https://img.shields.io/badge/Docker-Compatible-blue.svg" alt="Docker">
  <img src="https://img.shields.io/badge/ARM-Compatible-green.svg" alt="ARM Compatible">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
</div>

## 🚀 Overview
@Torrent is a modern, web-based BitTorrent client built with Python (FastAPI) and ultra-lightweight Alpine.js frontend. This version is specifically optimized for the CubieBoard 2 ARM platform and similar ARM-based single-board computers with limited resources.
@Torrent is a modern, web-based BitTorrent client built with Python (FastAPI) and Next.js. It provides a clean, responsive interface for managing torrents with support for both x86 and ARM architectures, making it perfect for deployment on everything from cloud servers to Raspberry Pi devices.

### ✨ Features
- **Ultra-Lightweight**: Alpine.js frontend (~20KB per page) optimized for ARM
- **ARM-Native**: Designed specifically for CubieBoard 2 and similar ARM SBCs
- **Low Resource Usage**: <130MB memory footprint, <20% CPU on ARM
- **Real-time Updates**: WebSocket-based live torrent status updates
- **Ultra-Lightweight**: Alpine.js frontend (~20KB per page) optimized for ARM
- **ARM-Native**: Designed specifically for CubieBoard 2 and similar ARM SBCs
- **Low Resource Usage**: <130MB memory footprint, <20% CPU on ARM
- **Real-time Updates**: WebSocket-based live torrent status updates
- **Ultra-Lightweight**: Alpine.js frontend (~20KB per page) optimized for ARM
- **ARM-Native**: Designed specifically for CubieBoard 2 and similar ARM SBCs
- **Low Resource Usage**: <130MB memory footprint, <20% CPU on ARM
- **Real-time Updates**: WebSocket-based live torrent status updates
- **Ultra-Lightweight**: Alpine.js frontend (~20KB per page) optimized for ARM
- **ARM-Native**: Designed specifically for CubieBoard 2 and similar ARM SBCs
- **Low Resource Usage**: <130MB memory footprint, <20% CPU on ARM
- **Real-time Updates**: WebSocket-based live torrent status updates
- **Real-time Updates**: Live torrent status updates
- **Torrent Preview**: Preview torrent contents before downloading
- **File Management**: Selective file downloading
- **Speed Limits**: Configure download/upload speed limits
- **Authentication**: Secure login system
- **Docker Ready**: Easy deployment with Docker Compose
- **Multi-Architecture**: Pre-built images for AMD64 and ARM64

## 📋 Requirements

### For Docker Deployment (Recommended)
- Docker 20.10+
- Docker Compose 2.0+
- 512MB RAM minimum
- 1GB free disk space (plus space for downloads)

### For Manual Installation
- Python 3.11+
- Node.js 20+
- libtorrent library

## 🔧 Installation

### Quick Start with Docker (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/aTorrent.git
   cd aTorrent
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   nano .env
   ```

3. **Deploy using the script:**
   ```bash
   ./scripts/deploy.sh
   ```

   Or manually with docker-compose:
   ```bash
   docker-compose -f docker-compose.production.yml up -d
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/docs

### ARM Devices (Raspberry Pi, etc.)

The application fully supports ARM architectures. Simply follow the same installation steps - the Docker images will automatically use the correct architecture.

For Raspberry Pi:
```bash
# Ensure Docker is installed
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Deploy @Torrent
./scripts/deploy.sh
```

### Manual Installation

<details>
<summary>Click to expand manual installation steps</summary>

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run build
npm start
```

</details>

## 🔐 Configuration

### Environment Variables

Key configuration options in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | JWT secret key (change in production!) | - |
| `DOWNLOADS_PATH` | Path for torrent downloads | `./downloads` |
| `BACKEND_PORT` | Backend API port | `8000` |
| `FRONTEND_PORT` | Frontend UI port | `3000` |
| `DEFAULT_USERNAME` | Default admin username | `admin` |
| `DEFAULT_PASSWORD` | Default admin password | `changeme` |

### Default Credentials

- Username: `admin`
- Password: `changeme`

**⚠️ Important:** Change these credentials after first login!

## 🚀 Usage

### Adding Torrents

1. Click "Add Torrent" button
2. Drag & drop .torrent files or click to browse
3. Preview torrent contents (click on torrent chip)
4. Configure options (auto-start, etc.)
5. Click "Add Torrent(s)"

### Managing Torrents

- **Pause/Resume**: Click the play/pause button
- **Delete**: Click the delete button (option to keep/delete files)
- **Bulk Actions**: Select multiple torrents for bulk operations
- **Filter**: Use status filters to view specific torrent states

### Settings

Access Settings page to configure:
- Download/upload speed limits
- Default download path
- Connection settings
- UI preferences

## 🐳 Docker Commands

### Build multi-architecture images:
```bash
./scripts/build.sh all
```

### View logs:
```bash
docker-compose -f docker-compose.production.yml logs -f
```

### Stop services:
```bash
docker-compose -f docker-compose.production.yml down
```

### Update to latest version:
```bash
./scripts/deploy.sh update
```

## 🔧 Development

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker (for containerized development)

### Setup Development Environment

1. **Backend Development:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

2. **Frontend Development:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Project Structure
```
aTorrent/
├── backend/           # FastAPI backend
│   ├── app/          # Application code
│   ├── tests/        # Backend tests
│   └── Dockerfile    # Backend container
├── frontend/         # Next.js frontend
│   ├── src/          # React components
│   ├── public/       # Static assets
│   └── Dockerfile    # Frontend container
├── scripts/          # Deployment scripts
├── docker-compose.yml
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 API Documentation

The backend provides a RESTful API with automatic documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Key Endpoints

- `POST /api/v1/auth/login` - User authentication
- `GET /api/v1/torrents` - List all torrents
- `POST /api/v1/torrents` - Add new torrent
- `DELETE /api/v1/torrents/{id}` - Remove torrent
- `GET /api/v1/settings` - Get application settings

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Change ports in .env file
BACKEND_PORT=8001
FRONTEND_PORT=3001
```

**Permission denied on Linux/ARM:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Logout and login again
```

**Cannot connect to backend:**
- Check if backend is running: `docker ps`
- Check logs: `docker-compose logs backend`
- Verify CORS settings in .env

## 📦 Building for Production

### Multi-architecture Build
```bash
# Build and push to registry
PUSH=true DOCKER_NAMESPACE=yourusername ./scripts/build.sh all
```

### Deploy to Production Server
```bash
# On production server
git clone https://github.com/yourusername/aTorrent.git
cd aTorrent
./scripts/deploy.sh deploy
```

## 🔒 Security Considerations

- Always change default credentials
- Use strong SECRET_KEY in production
- Enable HTTPS with reverse proxy (nginx/traefik)
- Keep Docker images updated
- Regular security updates

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [libtorrent](https://www.libtorrent.org/) - BitTorrent library
- [FastAPI](https://fastapi.tiangolo.com/) - Backend framework
- [Next.js](https://nextjs.org/) - Frontend framework
- [Material-UI](https://mui.com/) - UI components

## 💬 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for solutions
- Read the documentation carefully

---

<div align="center">
  Made with ❤️ for the torrenting community
</div>
