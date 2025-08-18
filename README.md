# aTorrent

A modern, full-featured torrent client web application with Python backend and Next.js frontend.
Created by Andrei (@andreim2k).

## 🚀 Features

- **Full Torrent Management**: Add, remove, pause, resume torrents
- **Real-time Updates**: Live progress tracking and statistics via WebSocket
- **User Authentication**: Secure login/logout with JWT tokens
- **Server Management**: Save and manage multiple torrent servers
- **Responsive Design**: Optimized for mobile (Android/iOS) and desktop
- **Modern UI**: Material-UI components with dark/light theme support
- **Statistics Dashboard**: Comprehensive download/upload statistics
- **Settings Management**: Customizable client settings and preferences
- **File Browser**: Browse and manage downloaded files
- **Magnet Link Support**: Easy torrent addition via magnet links

## 🛠 Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **libtorrent**: Core torrent functionality
- **SQLAlchemy**: Database ORM
- **WebSocket**: Real-time communication
- **JWT**: Secure authentication
- **SQLite/PostgreSQL**: Database storage

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Material-UI (MUI)**: Modern React components
- **WebSocket**: Real-time updates
- **Progressive Web App**: Mobile-optimized experience

## 📱 Platform Support

- **Desktop**: Windows, macOS, Linux
- **Mobile**: Android, iOS (PWA)
- **Responsive**: Adaptive UI for all screen sizes

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
├── frontend/            # Next.js frontend
│   ├── src/
│   │   ├── app/         # App Router pages
│   │   ├── components/  # Reusable components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── services/    # API services
│   │   ├── store/       # State management
│   │   └── types/       # TypeScript types
│   ├── package.json
│   └── next.config.js
├── docker-compose.yml   # Docker setup
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Docker Setup (Recommended)
```bash
docker-compose up -d
```

## 📖 API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🌟 Key Features Comparison

| Feature | aTorrent | uTorrent | Transmission |
|---------|----------|----------|--------------|
| Web Interface | ✅ Modern | ❌ | ✅ Basic |
| Mobile Optimized | ✅ | ❌ | ❌ |
| Real-time Updates | ✅ | ✅ | ✅ |
| User Management | ✅ | ❌ | ❌ |
| Dark/Light Theme | ✅ | ❌ | ❌ |
| Progressive Web App | ✅ | ❌ | ❌ |

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

- libtorrent for the core torrent functionality
- Material-UI for the beautiful component library
- FastAPI for the excellent Python web framework
- Next.js for the powerful React framework
