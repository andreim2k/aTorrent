# aTorrent - CubieBoard 2 Edition

A modern, lightweight torrent client web application specifically optimized for the **CubieBoard 2 ARM platform**.
This version from the `cubie-dev` branch is designed to run efficiently on ARM-based single-board computers with limited resources.

Created by Andrei (@andreim2k).

## 🔧 Platform Specification

**Target Platform**: CubieBoard 2 (ARM Cortex-A7 dual-core)
- **Architecture**: ARM (32-bit)
- **RAM**: 1GB DDR3
- **Storage**: SD card/NAND flash
- **OS**: Debian GNU/Linux (ARM)

## 🚀 Features

- **Full Torrent Management**: Add, remove, pause, resume torrents
- **Real-time Updates**: Live progress tracking and statistics via WebSocket
- **User Authentication**: Secure login/logout with JWT tokens
- **Responsive Design**: Optimized for mobile and desktop browsers
- **Ultra-Lightweight Frontend**: Alpine.js + Tailwind CSS (~20KB per page)
- **ARM-Optimized**: Minimal resource usage perfect for single-board computers
- **Statistics Dashboard**: Comprehensive download/upload statistics
- **Settings Management**: Customizable client settings and preferences

## 🛠 Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **libtorrent**: Core torrent functionality (ARM-compatible)
- **SQLAlchemy**: Database ORM
- **WebSocket**: Real-time communication
- **JWT**: Secure authentication
- **SQLite**: Lightweight database storage

### Frontend (Ultra-Lightweight)
- **Alpine.js 3.14**: Lightweight reactive framework (~15KB gzipped)
- **Tailwind CSS**: Utility-first CSS framework (via CDN)
- **Vanilla JavaScript**: No heavy frameworks
- **WebSocket Client**: Real-time updates
- **Total bundle size**: ~20KB per page

## 📱 Platform Support

- **Primary**: CubieBoard 2 (ARM Cortex-A7)
- **Compatible ARM boards**: Similar ARM-based SBCs with 1GB+ RAM
- **Browsers**: Chrome, Firefox, Safari on desktop and mobile
- **Not supported**: x86/x64 architectures (use main branch instead)

## 🏗 Project Structure

```
aTorrent/
├── backend/              # Python FastAPI backend
│   ├── app/
│   │   ├── api/         # API routes
│   │   ├── core/        # Core functionality
│   │   ├── db/          # Database configuration
│   │   ├── models/      # SQLAlchemy models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── services/    # Business logic
│   │   └── utils/       # Utility functions
│   ├── requirements.txt
│   └── main.py
├── frontend/            # Ultra-lightweight frontend
│   ├── src/             # HTML + Alpine.js pages
│   │   ├── dashboard.html
│   │   ├── torrents.html
│   │   ├── statistics.html
│   │   ├── settings.html
│   │   └── login.html
│   ├── js/              # JavaScript utilities
│   ├── DEPLOYMENT_CUBIEBOARD.md
│   └── README.md
└── README.md
```

## 🚀 Quick Start for CubieBoard 2

### Prerequisites
- CubieBoard 2 with Debian GNU/Linux
- Python 3.10+ (ARM build)
- Basic web server (Python's built-in server works)

### Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup (No Build Required!)
```bash
cd frontend/src
python3 -m http.server 3000
```

### Default Login Credentials

The application comes with default authentication credentials:
- **Username**: `admin`
- **Password**: `admin`

⚠️ **Important**: For security reasons, please change the default password immediately after your first login through the Settings page.

### App Management

Use the included app manager for easy control:

```bash
# Start all services
./app.sh start all

# Stop all services
./app.sh stop all

# Restart services
./app.sh restart all

# Check service status
./app.sh status

# View logs
./app.sh logs all

# Clean logs
./app.sh clean-logs
```

You can also manage services individually:
```bash
./app.sh start backend   # Start only backend
./app.sh stop frontend    # Stop only frontend
./app.sh logs backend     # View backend logs
```

## 📖 API Documentation

Once the backend is running, visit:
- Swagger UI: http://your-cubieboard-ip:8000/docs
- ReDoc: http://your-cubieboard-ip:8000/redoc

## 🌟 Performance Comparison

### Resource Usage (CubieBoard 2)
| Component | Memory | CPU | Storage |
|-----------|---------|-----|---------|
| Backend | 50-100MB | 5-15% | 20MB |
| Frontend | 10-30MB | <5% | 2MB |
| **Total** | **60-130MB** | **<20%** | **22MB** |

### vs. Traditional Torrent Clients
| Feature | aTorrent ARM | qBittorrent | Transmission |
|---------|--------------|-------------|---------------|
| Memory Usage | 60-130MB | 150-300MB | 100-200MB |
| Web Interface | ✅ Modern | ✅ Basic | ✅ Basic |
| ARM Optimized | ✅ | ❌ | ⚠️ Partial |
| Mobile UI | ✅ | ❌ | ❌ |
| Real-time Updates | ✅ | ⚠️ Limited | ⚠️ Limited |

## 🔒 Security Features

- JWT token-based authentication
- Secure password hashing (bcrypt)
- CORS protection
- Rate limiting
- Input validation and sanitization

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Andrei** (@andreim2k)
- GitHub: [@andreim2k](https://github.com/andreim2k)

## 🙏 Acknowledgments

- libtorrent for ARM-compatible torrent functionality
- Alpine.js for the ultra-lightweight framework
- Tailwind CSS for the utility-first styling
- FastAPI for the excellent Python web framework
- CubieBoard community for ARM development insights

## 📚 Additional Documentation

- [CubieBoard Deployment Guide](frontend/DEPLOYMENT_CUBIEBOARD.md)
- [Production Notes](frontend/PRODUCTION_NOTES.md)
- [Backend API Documentation](backend/README.md)
- [Frontend Documentation](frontend/README.md)
