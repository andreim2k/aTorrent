# System Dependencies

This application requires the following system packages to be installed before installing Python dependencies.

## Platform Support

**✅ Supported Architectures:**
- x86_64 (Intel/AMD)
- ARM64 (Apple Silicon, Raspberry Pi, AWS Graviton, etc.)

## Ubuntu/Debian (x86_64)

```bash
# Update package lists
sudo apt update

# Install libtorrent system dependencies
sudo apt install -y python3-libtorrent libtorrent-rasterbar2.0

# Install build dependencies
sudo apt install -y python3-dev build-essential python3-venv python3-pip
```

## Ubuntu/Debian ARM64 (Raspberry Pi, Apple Silicon, etc.)

```bash
# Update package lists
sudo apt update

# Install libtorrent system dependencies for ARM
sudo apt install -y python3-libtorrent libtorrent-rasterbar2.0

# Install build dependencies (ARM requires additional packages)
sudo apt install -y python3-dev build-essential python3-venv python3-pip
sudo apt install -y pkg-config libffi-dev

# Optional: Additional ARM optimization packages
sudo apt install -y gcc-aarch64-linux-gnu
```

## Raspberry Pi Specific

```bash
# Ensure system is updated
sudo apt update && sudo apt upgrade -y

# Install required packages for Raspberry Pi
sudo apt install -y python3-libtorrent libtorrent-rasterbar2.0
sudo apt install -y python3-dev build-essential python3-venv python3-pip
sudo apt install -y pkg-config libffi-dev

# For better performance on Raspberry Pi
sudo apt install -y python3-wheel

# Recommended: Increase swap for compilation (if RAM < 4GB)
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=100/CONF_SWAPSIZE=1024/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

## AWS Graviton / Cloud ARM Instances

```bash
# Standard ARM64 setup works for most cloud providers
sudo apt update
sudo apt install -y python3-libtorrent libtorrent-rasterbar2.0
sudo apt install -y python3-dev build-essential python3-venv python3-pip
sudo apt install -y pkg-config libffi-dev

# For AWS Graviton specifically
sudo apt install -y gcc-aarch64-linux-gnu
```

## Node.js Installation (All Platforms)

```bash
# Install Node.js 18+ (supports both x86_64 and ARM64)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

## Architecture Detection

```bash
# Check your system architecture
uname -m
# x86_64 = Intel/AMD 64-bit
# aarch64 = ARM 64-bit

# Check if packages are available for your architecture
apt search python3-libtorrent
```

## Performance Notes

### ARM64 Platforms
- **Raspberry Pi 4+**: Recommended 4GB+ RAM for optimal performance
- **Apple Silicon**: Excellent performance via Ubuntu ARM64 containers/VMs
- **AWS Graviton**: High performance, cost-effective cloud deployment
- **Compilation time**: ARM builds may take longer than x86_64, especially on Raspberry Pi

### Optimization Tips
- Use `python3-wheel` package to prefer binary wheels when available
- Consider increasing swap space on low-RAM ARM devices during initial setup
- Modern ARM processors (Apple Silicon, Graviton) perform excellently

## Troubleshooting

### Common ARM Issues

1. **Compilation errors on ARM**:
   ```bash
   # Ensure all build dependencies are installed
   sudo apt install -y python3-dev build-essential pkg-config libffi-dev
   
   # Clear pip cache and retry
   pip cache purge
   pip install -r requirements.txt
   ```

2. **libtorrent import issues**:
   ```bash
   # Verify system libtorrent installation
   dpkg -l | grep libtorrent
   
   # Check Python can import libtorrent
   python3 -c "import libtorrent; print(libtorrent.version)"
   ```

3. **Memory issues on Raspberry Pi**:
   ```bash
   # Increase swap temporarily
   sudo swapon --show
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

## Verification

```bash
# Verify all dependencies are available
python3 -c "import libtorrent, fastapi, uvicorn; print('All dependencies OK')"

# Check architecture
python3 -c "import platform; print(f'Architecture: {platform.machine()}')"

# Verify libtorrent version
python3 -c "import libtorrent; print(f'libtorrent version: {libtorrent.version}')"
```

## Notes

- The libtorrent package in requirements.txt (libtorrent==2.0.11) works on both x86_64 and ARM64
- System packages provide the underlying libtorrent libraries that Python bindings use
- All dependencies have been tested on both architectures
- ARM64 installations may require additional build tools compared to x86_64
- Performance on modern ARM processors (Apple Silicon, Graviton) is comparable to x86_64
