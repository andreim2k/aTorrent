#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$APP_DIR/data/atorrent.pid"
LOG_FILE="$APP_DIR/data/atorrent.log"
DEV_BE_PID="$APP_DIR/data/dev-be.pid"
DEV_FE_PID="$APP_DIR/data/dev-fe.pid"
SERVICE_NAME="atorrent.service"

# Check if systemd service is installed
use_systemd() {
  [ -f "/etc/systemd/system/$SERVICE_NAME" ] && command -v systemctl &>/dev/null
}

is_running() {
  [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null
}

do_start() {
  if use_systemd; then
    echo "Starting via systemd..."
    sudo systemctl start "$SERVICE_NAME"
    sudo systemctl status "$SERVICE_NAME" --no-pager
    return
  fi

  if is_running; then
    echo "aTorrent is already running (PID $(cat "$PID_FILE"))"
    return
  fi

  echo "Starting aTorrent..."
  mkdir -p "$APP_DIR/data"
  cd "$APP_DIR"

  # Source .env if present
  if [ -f "$APP_DIR/.env" ]; then
    set -a
    source "$APP_DIR/.env"
    set +a
  fi

  nohup node dist/server/index.js >> "$LOG_FILE" 2>&1 &
  echo $! > "$PID_FILE"
  echo "aTorrent started (PID $!)"
  echo "Logs: $LOG_FILE"
}

do_stop() {
  if use_systemd; then
    echo "Stopping via systemd..."
    sudo systemctl stop "$SERVICE_NAME"
    return
  fi

  if ! is_running; then
    echo "aTorrent is not running"
    rm -f "$PID_FILE"
    return
  fi

  local pid
  pid=$(cat "$PID_FILE")
  echo "Stopping aTorrent (PID $pid)..."
  kill "$pid"
  # Wait for process to exit
  for i in $(seq 1 10); do
    if ! kill -0 "$pid" 2>/dev/null; then
      break
    fi
    sleep 1
  done
  # Force kill if still running
  if kill -0 "$pid" 2>/dev/null; then
    echo "Force killing..."
    kill -9 "$pid" 2>/dev/null || true
  fi
  rm -f "$PID_FILE"
  echo "aTorrent stopped"
}

do_status() {
  if use_systemd; then
    sudo systemctl status "$SERVICE_NAME" --no-pager
    return
  fi

  if is_running; then
    echo "aTorrent is running (PID $(cat "$PID_FILE"))"
  else
    echo "aTorrent is not running"
    rm -f "$PID_FILE"
  fi
}

do_logs() {
  if use_systemd; then
    sudo journalctl -u "$SERVICE_NAME" -f
    return
  fi

  if [ -f "$LOG_FILE" ]; then
    tail -f "$LOG_FILE"
  else
    echo "No log file found at $LOG_FILE"
  fi
}

do_build() {
  echo "Building aTorrent..."
  cd "$APP_DIR"
  npm run build
  echo "Build complete"
}

do_dev() {
  if [ -f "$DEV_BE_PID" ] && kill -0 "$(cat "$DEV_BE_PID")" 2>/dev/null; then
    echo "Dev servers are already running"
    return
  fi

  echo "Starting dev servers..."
  mkdir -p "$APP_DIR/data"
  cd "$APP_DIR"

  if [ -f "$APP_DIR/.env" ]; then
    set -a
    source "$APP_DIR/.env"
    set +a
  fi

  # Backend (tsx watch)
  nohup npx tsx watch src/server/index.ts >> "$APP_DIR/data/dev-be.log" 2>&1 &
  echo $! > "$DEV_BE_PID"
  echo "Backend dev server started (PID $!)"

  # Frontend (vite)
  nohup npx vite >> "$APP_DIR/data/dev-fe.log" 2>&1 &
  echo $! > "$DEV_FE_PID"
  echo "Frontend dev server started (PID $!)"

  echo "Backend logs: data/dev-be.log"
  echo "Frontend logs: data/dev-fe.log"
}

do_dev_stop() {
  local stopped=0
  for pidfile in "$DEV_BE_PID" "$DEV_FE_PID"; do
    if [ -f "$pidfile" ] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
      kill "$(cat "$pidfile")" 2>/dev/null || true
      rm -f "$pidfile"
      stopped=1
    fi
  done
  if [ "$stopped" -eq 1 ]; then
    echo "Dev servers stopped"
  else
    echo "Dev servers are not running"
  fi
}

case "${1:-}" in
  start)   do_start ;;
  stop)    do_stop ;;
  restart) do_stop; sleep 1; do_start ;;
  status)  do_status ;;
  logs)    do_logs ;;
  build)   do_build ;;
  dev)     do_dev ;;
  dev:stop) do_dev_stop ;;
  *)
    echo "Usage: $0 {start|stop|restart|status|logs|build|dev|dev:stop}"
    exit 1
    ;;
esac
