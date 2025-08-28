# @Torrent Backend - ARM / CubieBoard 2 Edition

# @Torrent Backend API

A modern, full-featured torrent management system built with FastAPI and libtorrent.

## Features

- 🚀 **Modern FastAPI Backend** - High-performance async API
- 🔐 **JWT Authentication** - Secure user authentication with refresh tokens
- 🌊 **Real-time Updates** - WebSocket support for live torrent status
- 💾 **SQLAlchemy Database** - Robust data persistence
- 🔄 **Libtorrent Integration** - Real torrent downloading capabilities
- 📊 **Statistics & Analytics** - Comprehensive torrent statistics
- 🖥️ **Multi-server Support** - Manage remote torrent servers
- ⚙️ **Configurable Settings** - User-specific preferences
- 📡 **CORS Support** - Ready for frontend integration

## Quick Start

### Prerequisites

- Python 3.8+
- pip
- (Optional) libtorrent for real torrent functionality

### Installation

1. **Clone and setup**:
   ```bash
   cd backend
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Manual setup**:
   ```bash
   # Create virtual environment
   python3 -m venv venv
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Configure environment
   cp .env.example .env
   # Edit .env with your settings
   
   # Initialize database
   python -c "from app.db.init_db import init_db; init_db()"
   ```

3. **Start the server**:
   ```bash
   source venv/bin/activate
   python main.py
   ```

The API will be available at `http://localhost:8000`

## API Documentation

Once running, visit:
- **Interactive Docs**: http://localhost:8000/api/v1/docs
- **ReDoc**: http://localhost:8000/api/v1/redoc
- **OpenAPI JSON**: http://localhost:8000/api/v1/openapi.json

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user profile

### Torrents
- `GET /api/v1/torrents/` - List all torrents
- `POST /api/v1/torrents/` - Add new torrent
- `GET /api/v1/torrents/{torrent_id}` - Get torrent details
- `PUT /api/v1/torrents/{torrent_id}` - Update torrent
- `DELETE /api/v1/torrents/{torrent_id}` - Delete torrent
- `POST /api/v1/torrents/{torrent_id}/pause` - Pause torrent
- `POST /api/v1/torrents/{torrent_id}/resume` - Resume torrent
- `GET /api/v1/torrents/stats/overview` - Get torrent statistics

### User Management
- `GET /api/v1/users/` - List users (admin only)
- `POST /api/v1/users/` - Create user (admin only)
- `GET /api/v1/users/me` - Get current user
- `PUT /api/v1/users/me` - Update current user
- `GET /api/v1/admin/users/stats` - Get user statistics (admin only)


### Settings
- `GET /api/v1/settings/` - Get user settings
- `PUT /api/v1/settings/` - Update user settings
- `POST /api/v1/settings/reset` - Reset settings to defaults

### File Upload
- `POST /api/v1/upload/torrent` - Upload torrent file
- `GET /api/v1/upload/status/{upload_id}` - Check upload status

## WebSocket

Connect to `/ws` for real-time torrent updates:

```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'torrent_update') {
        // Handle torrent status updates
        console.log('Torrents updated:', data.data);
    }
};

// Send ping to keep connection alive
ws.send(JSON.stringify({ type: 'ping' }));
```

## Configuration

### Environment Variables

Key configuration options in `.env`:

```bash
# Security
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database
DATABASE_URL=sqlite:///./aTorrent.db

# Torrent Settings
DOWNLOAD_PATH=./downloads
MAX_DOWNLOAD_SPEED=0  # 0 = unlimited
MAX_UPLOAD_SPEED=0    # 0 = unlimited
MAX_CONNECTIONS=200

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Database

The application uses SQLAlchemy with SQLite by default. Models include:
- **User** - User accounts and authentication
- **Torrent** - Torrent information and status
- **UserSettings** - User-specific preferences

## Development

### Running Tests

```bash
source venv/bin/activate
pytest
```

### Code Formatting

```bash
black app/
flake8 app/
mypy app/
```

### Database Migrations

```bash
# Create migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head
```

## Production Deployment

### Using Gunicorn

```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Containerization (Optional)

If you prefer to use containers, you can create your own Dockerfile:

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "main.py"]
```

**Note**: This project does not include Docker configuration by default. The above is just an example if you want to containerize the backend.

### Security Considerations

- Change `SECRET_KEY` in production
- Use HTTPS in production
- Configure proper CORS origins
- Set up proper database (PostgreSQL recommended)
- Enable rate limiting
- Set up logging and monitoring

## Troubleshooting

### Common Issues

1. **libtorrent not found**: The app will fall back to mock mode if libtorrent isn't installed
2. **Permission errors**: Ensure download directory is writable
3. **Port in use**: Change `PORT` in `.env` if 8000 is occupied
4. **CORS errors**: Add your frontend URL to `ALLOWED_ORIGINS`

### Logs

Check logs in the console or configure file logging:

```python
import logging
logging.basicConfig(level=logging.INFO)
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

---

**Made with ❤️ by Andrei (@andreim2k)**

## System Statistics

The @Torrent backend now includes comprehensive system monitoring capabilities using psutil.

### New Dependencies

- `psutil==5.9.8` - System and process monitoring

### System Statistics Features

The system statistics provide real-time monitoring of:

1. **CPU Usage**
   - Overall CPU utilization percentage
   - Per-core CPU usage
   - CPU frequency information
   - System load averages (1min, 5min, 15min)

2. **Memory Usage**
   - RAM usage (used, available, total, percentage)
   - Swap usage
   - Cache and buffer information

3. **Disk Usage**
   - Per-partition disk usage
   - Disk I/O statistics
   - Read/write operations and bytes

4. **Network Activity**
   - Real-time upload/download rates
   - Total bytes transferred
   - Per-interface statistics
   - Network interface status

### API Endpoints

- `GET /api/v1/system/stats` - Get current system statistics snapshot
- `WebSocket /api/v1/system/ws` - Real-time system statistics (updates every 200ms)

### Running in Production

For long-running servers, use the recommended background execution pattern:

```bash
# Start both services in background
./app.sh start all

# Or manually with nohup (user preference)
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > logs/backend.log 2>&1 &
bg
```

The system statistics WebSocket updates every 200ms to provide smooth real-time monitoring without excessive CPU usage.

