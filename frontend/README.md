# aTorrent Frontend - Ultra-Lightweight ARM Edition

Specifically optimized for CubieBoard 2 and ARM-based single-board computers.

# aTorrent Frontend - Ultra-Lightweight Edition

A minimalist, high-performance torrent client web interface built with Alpine.js and Tailwind CSS.

## Features

- **Ultra-lightweight**: < 50KB total page size
- **Zero build process**: Pure HTML/JS/CSS
- **Real-time updates**: WebSocket-based live data
- **ARM optimized**: Perfect for CubieBoard2 and similar devices
- **Dark theme**: Modern, easy-on-the-eyes interface

## Structure

```
frontend/
├── src/                  # Production-ready HTML files
│   ├── dashboard.html    # Main dashboard view
│   ├── torrents.html     # Torrent management
│   ├── statistics.html   # Statistics & monitoring
│   ├── settings.html     # Client settings
│   ├── login.html        # Authentication
│   └── js/
│       └── websocket-client.js  # WebSocket handler
└── package.json          # Simple HTTP server config
```

## Deployment

### Quick Start

1. Serve the `src` directory with any static web server:
   ```bash
   cd src
   python3 -m http.server 3001
   ```

2. Or use the included simple server:
   ```bash
   npm install
   npm start
   ```

3. Access at `http://localhost:3001/login.html`

### Production Deployment

For production, serve the `src` directory with:
- **Nginx** (recommended for ARM devices)
- **Apache**
- **Caddy**
- Any static file server

Example Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/aTorrent/frontend/src;
    index login.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
}
```

## Requirements

- Modern web browser with JavaScript enabled
- Backend API running on port 8000
- No Node.js or build tools required for deployment

## Performance

- **Initial load**: < 50KB
- **Memory usage**: < 10MB
- **CPU usage**: < 1% idle, < 5% active
- **Perfect for ARM/embedded devices**

## License

MIT
