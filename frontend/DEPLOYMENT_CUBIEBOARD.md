# @Torrent CubieBoard 2 Deployment Guide

## Overview
This is the official deployment guide for @Torrent on the **CubieBoard 2 ARM platform**. This ultra-lightweight version is specifically optimized for the CubieBoard 2's hardware constraints (1GB RAM, ARM Cortex-A7 dual-core processor).

## Target Hardware Specification

**CubieBoard 2 (Cubieboard2)**
- **SoC**: Allwinner A20 (ARM Cortex-A7 dual-core @ 1GHz)
- **Architecture**: ARMv7-A (32-bit ARM)
- **RAM**: 1GB DDR3
- **Storage**: microSD card / 4GB NAND flash
- **Network**: 10/100 Ethernet
- **OS**: Debian GNU/Linux (ARMhf)

## Technology Stack (ARM-Optimized)
- **Alpine.js 3.14** - Ultra-lightweight reactive framework (~15KB gzipped)
- **Tailwind CSS** (via CDN) - Utility-first CSS framework
- **Vanilla JavaScript** - No heavy Node.js dependencies
- **Python 3.10+** - ARM-compatible FastAPI backend
- **libtorrent** - ARM-compiled torrent library
- **Total memory footprint**: ~60-130MB

## Performance Comparison

### Original vs CubieBoard Edition
| Metric | Original (x86/x64) | CubieBoard Edition |
|--------|-------------------|-------------------|
| Frontend Bundle | 2-5MB | 20KB |
| Memory Usage | 200-500MB | 60-130MB |
| Framework | React/Next.js | Alpine.js |
| Build Process | Complex | None required |
| CPU Usage | High | <20% on ARM |

## Deployment Options

### Option 1: Direct File Serving (Recommended for CubieBoard 2)
```bash
# Copy files to your CubieBoard 2
scp -r frontend/src/ cubie@192.168.1.100:/var/www/atorrent/

# SSH into CubieBoard 2
ssh cubie@192.168.1.100

# Serve with Python (no additional dependencies)
cd /var/www/atorrent
python3 -m http.server 3000
```

### Option 2: Using Nginx (Production Setup)
```bash
# Install Nginx on CubieBoard 2
sudo apt update
sudo apt install nginx

# Configure Nginx
sudo vim /etc/nginx/sites-available/atorrent
```

```nginx
server {
    listen 80;
    server_name cubieboard.local;
    
    root /var/www/atorrent;
    index dashboard.html;
    
    location / {
        try_files $uri $uri/ /dashboard.html;
    }
    
    # Proxy API requests to FastAPI backend
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # WebSocket support
    location /ws {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Option 3: Lightweight HTTP Server
```bash
# Install lightweight server (optional)
sudo apt install lighttpd

# Or use Node.js simple server (if available)
npm install -g http-server
http-server frontend/src -p 3000
```

## Configuration for CubieBoard 2

### API Endpoint Configuration
Edit the API_BASE constant in each HTML file:
```javascript
// Replace with your CubieBoard 2 IP address
const API_BASE = 'http://192.168.1.100:8000/api/v1';
```

### Memory Optimization Settings
Create a configuration file for production:
```bash
# Create optimization script
cat > /var/www/atorrent/optimize.sh << 'SCRIPT'
#!/bin/bash
# CubieBoard 2 optimization settings

# Reduce torrent update frequency to save CPU
export TORRENT_UPDATE_INTERVAL=10  # seconds (default: 5)

# Limit concurrent torrents
export MAX_ACTIVE_TORRENTS=5

# Reduce WebSocket update frequency
export WS_UPDATE_INTERVAL=15  # seconds

echo "CubieBoard 2 optimizations applied"
SCRIPT

chmod +x /var/www/atorrent/optimize.sh
```

## Performance Tuning

### CubieBoard 2 Specific Optimizations

1. **Memory Management**
```bash
# Increase swap if needed (use sparingly with SD cards)
sudo fallocate -l 512M /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

2. **CPU Governor Settings**
```bash
# Set performance governor for consistent performance
echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

3. **Storage Optimization**
```bash
# Mount tmpfs for logs to reduce SD card writes
sudo mount -t tmpfs -o size=100M tmpfs /var/log/atorrent
```

### Network Configuration
```bash
# Optimize network settings for torrent traffic
echo 'net.core.rmem_max = 16777216' | sudo tee -a /etc/sysctl.conf
echo 'net.core.wmem_max = 16777216' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## Resource Monitoring

### Performance Metrics (Expected on CubieBoard 2)
- **Memory Usage**: 60-130MB total
- **CPU Usage**: 15-25% during active downloads
- **Network**: Up to 10/100 Ethernet limit
- **Storage I/O**: Minimal (optimized for SD cards)

### Monitoring Commands
```bash
# Monitor memory usage
free -h

# Monitor CPU usage
htop

# Monitor network
iftop

# Monitor storage I/O
iostat -x 1
```

## Features Optimized for ARM

✅ **Working on CubieBoard 2**:
- Login/Authentication
- Dashboard with real-time stats
- Torrent management (add/remove/pause/resume)
- File uploads (torrent files)
- Statistics tracking
- Settings management
- WebSocket real-time updates
- Responsive mobile interface

⚠️ **Limitations on ARM**:
- Large torrent lists (>100 items) may impact performance
- Simultaneous downloads limited by hardware
- Web UI refresh rate adjusted for performance

## Troubleshooting CubieBoard 2 Issues

### High Memory Usage
```bash
# Check memory consumption
ps aux --sort=-%mem | head

# Restart services if needed
sudo systemctl restart atorrent-backend
```

### Slow Performance
```bash
# Check CPU temperature
cat /sys/class/thermal/thermal_zone0/temp

# Check if CPU is being throttled
dmesg | grep -i thermal
```

### Storage Issues
```bash
# Check SD card health
sudo badblocks -v /dev/mmcblk0

# Check filesystem usage
df -h
```

### Network Connectivity
```bash
# Test API connectivity
curl http://localhost:8000/api/v1/health

# Check port availability
netstat -tlnp | grep :8000
```

## Production Deployment Checklist

### Pre-deployment
- [ ] CubieBoard 2 running Debian GNU/Linux
- [ ] Python 3.10+ installed
- [ ] Adequate storage space (>1GB free)
- [ ] Network connectivity configured
- [ ] SSH access configured

### Deployment Steps
- [ ] Deploy backend FastAPI application
- [ ] Deploy frontend HTML files
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up automatic startup (systemd)
- [ ] Configure monitoring and logging
- [ ] Test functionality end-to-end

### Post-deployment
- [ ] Monitor memory usage < 200MB
- [ ] Verify CPU usage < 30%
- [ ] Test torrent operations
- [ ] Verify WebSocket connectivity
- [ ] Configure automatic updates

## Security Considerations

### CubieBoard 2 Security
- Change default SSH passwords
- Configure firewall (ufw)
- Use SSL/TLS with reverse proxy
- Regular security updates
- Monitor access logs

## Support and Troubleshooting

For CubieBoard 2 specific issues:
1. Check hardware specifications match requirements
2. Verify ARM compatibility of all dependencies
3. Monitor system resources during operation
4. Report ARM-specific bugs with hardware details

## Future Enhancements

Planned optimizations for CubieBoard 2:
- [ ] Service Worker for offline support
- [ ] WebSocket optimization for ARM
- [ ] Database query optimization
- [ ] Progressive Web App (PWA) support
- [ ] ARM-specific performance tuning
- [ ] Hardware watchdog integration

## Summary

This deployment guide ensures optimal performance of @Torrent on CubieBoard 2 hardware. The ultra-lightweight frontend combined with ARM-optimized backend provides a full-featured torrent client experience within the hardware constraints of single-board computers.

**Expected Performance**: Smooth operation with 5-10 active torrents, real-time web interface, and <130MB memory usage on CubieBoard 2.
