#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
NODE_MAJOR=22

echo "=== aTorrent Installation ==="
echo "App directory: $APP_DIR"
echo ""

# --- Check for root (needed for apt and systemd) ---
if [ "$EUID" -ne 0 ]; then
  echo "Warning: Not running as root. System dependencies and systemd setup will be skipped."
  echo "Re-run with sudo for full installation."
  SKIP_SYSTEM=1
else
  SKIP_SYSTEM=0
fi

# --- System dependencies ---
if [ "$SKIP_SYSTEM" -eq 0 ]; then
  echo ">> Installing system dependencies..."
  apt-get update -qq
  apt-get install -y -qq build-essential python3 curl ca-certificates gnupg >/dev/null

  # Node.js via NodeSource
  if ! command -v node &>/dev/null || [ "$(node -e 'console.log(process.versions.node.split(".")[0])')" -lt "$NODE_MAJOR" ]; then
    echo ">> Installing Node.js $NODE_MAJOR..."
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg 2>/dev/null
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" > /etc/apt/sources.list.d/nodesource.list
    apt-get update -qq
    apt-get install -y -qq nodejs >/dev/null
    echo "   Node.js $(node --version) installed"
  else
    echo "   Node.js $(node --version) already installed"
  fi
else
  # Verify node exists in non-root mode
  if ! command -v node &>/dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js $NODE_MAJOR+ or re-run with sudo."
    exit 1
  fi
fi

# --- npm install ---
echo ">> Installing npm dependencies..."
cd "$APP_DIR"
npm install --production=false 2>&1 | tail -1

# --- Build ---
echo ">> Building application..."
npm run build 2>&1 | tail -3

# --- Data directories ---
echo ">> Creating data directories..."
mkdir -p "$APP_DIR/data/downloads"

# --- .env ---
if [ ! -f "$APP_DIR/.env" ]; then
  echo ">> Generating .env from .env.example..."
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  JWT_SECRET=$(openssl rand -hex 64)
  sed -i "s/^JWT_SECRET=$/JWT_SECRET=$JWT_SECRET/" "$APP_DIR/.env"
  echo "   JWT_SECRET generated"
else
  echo "   .env already exists, skipping"
fi

# --- systemd ---
if [ "$SKIP_SYSTEM" -eq 0 ]; then
  echo ">> Setting up systemd service..."
  RUN_USER="${SUDO_USER:-$USER}"
  sed -e "s|__WORKING_DIR__|$APP_DIR|g" -e "s|__USER__|$RUN_USER|g" \
    "$APP_DIR/atorrent.service" > /etc/systemd/system/atorrent.service
  systemctl daemon-reload
  systemctl enable atorrent.service
  echo "   Service installed and enabled (use 'systemctl start atorrent' or './atorrent.sh start')"
fi

# --- Make management script executable ---
chmod +x "$APP_DIR/atorrent.sh" 2>/dev/null || true

# --- Summary ---
echo ""
echo "=== Installation Complete ==="
echo "  App directory:  $APP_DIR"
echo "  Config:         $APP_DIR/.env"
echo "  Downloads:      $APP_DIR/data/downloads"
echo "  Database:       $APP_DIR/data/atorrent.db"
if [ "$SKIP_SYSTEM" -eq 0 ]; then
  echo "  Service:        atorrent.service (systemd)"
fi
echo ""
echo "Next steps:"
echo "  1. Edit .env if needed (TMDB_API_KEY, CORS_ORIGIN, etc.)"
echo "  2. Start: ./atorrent.sh start"
echo "     Or:    sudo systemctl start atorrent"
echo ""
echo "Configuration notes:"
echo "  - CORS_ORIGIN: Set if accessing from different hosts (comma-separated URLs)"
echo "  - DOWNLOADS_DIR: Path where torrents will be saved"
echo "  - TMDB_API_KEY: Optional API key for media metadata"
