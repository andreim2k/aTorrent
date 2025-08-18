# aTorrent Ultra-Lightweight Frontend Deployment Guide

## Overview
This is an ultra-lightweight version of the aTorrent frontend, specifically optimized for ARM devices like the CubieBoard2 with limited RAM (1GB).

## Technology Stack
- **Alpine.js 3.13** - Lightweight reactive framework (~15KB gzipped)
- **Tailwind CSS** (via CDN) - Utility-first CSS framework
- **Vanilla JavaScript** - No heavy frameworks
- **Total page size**: ~15-20KB per page (excluding CDN resources)

## Features Comparison

### Original (Next.js + Material-UI)
- **Bundle Size**: ~2-5MB
- **Memory Usage**: 200-500MB
- **Framework**: React/Next.js
- **UI Library**: Material-UI
- **Build Process**: Complex (webpack, babel, etc.)

### Lightweight Version (Alpine.js + Tailwind)
- **Bundle Size**: ~20KB (HTML + inline JS)
- **Memory Usage**: 10-50MB
- **Framework**: Alpine.js (CDN)
- **UI Library**: Tailwind CSS (CDN)
- **Build Process**: None required!

## Deployment Options

### Option 1: Direct File Serving (Recommended for CubieBoard2)
```bash
# Copy the src folder to your CubieBoard2
scp -r src/ user@cubieboard:/var/www/atorrent/

# Serve with any static server (Python, Nginx, etc.)
cd /var/www/atorrent
python3 -m http.server 3000
```

### Option 2: Using Nginx (Production)
```nginx
server {
    listen 80;
    server_name atorrent.local;
    
    root /var/www/atorrent;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API Proxy (adjust backend URL as needed)
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Option 3: Using Node.js (Simple HTTP Server)
```bash
# Install a lightweight server
npm install -g http-server

# Serve the files
cd src
http-server -p 3000
```

## Configuration

### API Endpoint
Edit the API_BASE constant in dashboard.html and login.html:
```javascript
const API_BASE = 'http://your-cubieboard-ip:8000/api/v1';
```

### For Production Deployment

1. **Optimize Tailwind CSS**: Instead of using CDN, build a custom CSS file:
```bash
# Install Tailwind CLI
npm install -D tailwindcss

# Build optimized CSS
npx tailwindcss -i input.css -o output.css --minify
```

2. **Cache Alpine.js locally**: Download Alpine.js and serve it locally:
```bash
wget https://cdn.jsdelivr.net/npm/alpinejs@3.13.3/dist/cdn.min.js -O alpine.min.js
```

3. **Enable gzip compression** in your web server for even smaller transfer sizes.

## Performance Metrics

### Memory Usage (Estimated)
- **Browser tab**: ~20-50MB
- **JavaScript heap**: ~5-10MB
- **DOM nodes**: <500

### Network Transfer
- **Initial load**: ~100KB (with CDN resources)
- **Subsequent loads**: ~20KB (CDN cached)

### CPU Usage
- **Idle**: <1%
- **During updates**: 5-10%

## Features Included
✅ Login/Authentication
✅ Dashboard with stats
✅ Torrent list with real-time updates
✅ Pause/Resume torrents
✅ Add torrents (magnet links)
✅ Auto-refresh (5 second intervals)
✅ Responsive design
✅ Dark theme (Material-UI style)

## Browser Compatibility
- Chrome/Edge 80+
- Firefox 75+
- Safari 13+
- Mobile browsers supported

## Troubleshooting

### High Memory Usage
- Increase refresh interval (currently 5 seconds)
- Limit torrent list to fewer items
- Disable animations

### Slow Performance
- Check network latency to API
- Reduce API call frequency
- Enable browser caching

### Connection Issues
- Verify API endpoint URL
- Check CORS settings on backend
- Ensure authentication tokens are valid

## Future Optimizations
- [ ] Service Worker for offline support
- [ ] WebSocket for real-time updates (reduce polling)
- [ ] Lazy loading for torrent details
- [ ] Virtual scrolling for large torrent lists
- [ ] Progressive Web App (PWA) support

## Summary
This lightweight version maintains the same look and feel as the original Material-UI design while reducing resource usage by ~95%. Perfect for running on ARM devices with limited resources like the CubieBoard2!
