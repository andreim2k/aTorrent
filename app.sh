#!/bin/bash

# @Torrent App Management Script
# Manages both frontend and backend services
# Created by Andrei (@andreim2k)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base directories
BASEDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$BASEDIR/backend"
FRONTEND_DIR="$BASEDIR/frontend"
LOG_DIR="$BASEDIR/logs"
PID_DIR="$BASEDIR/pids"

# Service ports
BACKEND_PORT=8000
FRONTEND_PORT=3000

# PID files
BACKEND_PID="$PID_DIR/backend.pid"
FRONTEND_PID="$PID_DIR/frontend.pid"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create necessary directories
init_dirs() {
    mkdir -p "$LOG_DIR"
    mkdir -p "$PID_DIR"
    mkdir -p "$BACKEND_DIR/logs"
    mkdir -p "$FRONTEND_DIR/logs"
}

# Check if a process is running
is_running() {
    local pid_file=$1
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$pid_file"
        fi
    fi
    return 1
}

# Kill process on port
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        echo "$pids" | xargs kill -9 2>/dev/null
        return 0
    fi
    return 1
}

# Start backend service
start_backend() {
    if is_running "$BACKEND_PID"; then
        print_warning "Backend is already running (PID: $(cat $BACKEND_PID))"
        return 1
    fi
    
    print_status "Starting backend service..."
    
    # Kill any existing process on the port
    kill_port $BACKEND_PORT
    
    cd "$BACKEND_DIR"
    
    # Activate virtual environment if it exists
    if [ -d "venv" ]; then
        source venv/bin/activate
    fi
    
    # Start uvicorn with reduced logging
    nohup uvicorn app.main:app \
        --host 0.0.0.0 \
        --port $BACKEND_PORT \
        --log-level warning \
        > "$LOG_DIR/backend.log" 2>&1 &
    
    local pid=$!
    echo $pid > "$BACKEND_PID"
    
    sleep 2
    
    if is_running "$BACKEND_PID"; then
        print_success "Backend started successfully (PID: $pid)"
        print_status "Backend URL: http://localhost:$BACKEND_PORT"
        print_status "API Docs: http://localhost:$BACKEND_PORT/docs"
        print_status "Logs: $LOG_DIR/backend.log"
        return 0
    else
        print_error "Failed to start backend"
        return 1
    fi
}

# Start frontend service
start_frontend() {
    if is_running "$FRONTEND_PID"; then
        print_warning "Frontend is already running (PID: $(cat $FRONTEND_PID))"
        return 1
    fi
    
    print_status "Starting frontend service..."
    
    # Kill any existing process on the port
    kill_port $FRONTEND_PORT
    
    cd "$FRONTEND_DIR/src"
    
    # Start Python HTTP server with minimal output
    nohup python3 -m http.server $FRONTEND_PORT --bind 0.0.0.0 \
        > /dev/null 2> "$LOG_DIR/frontend-error.log" &
    
    local pid=$!
    echo $pid > "$FRONTEND_PID"
    
    sleep 1
    
    if is_running "$FRONTEND_PID"; then
        print_success "Frontend started successfully (PID: $pid)"
        print_status "Frontend URL: http://localhost:$FRONTEND_PORT"
        print_status "Error logs: $LOG_DIR/frontend-error.log"
        return 0
    else
        print_error "Failed to start frontend"
        return 1
    fi
}

# Stop backend service
stop_backend() {
    if ! is_running "$BACKEND_PID"; then
        print_warning "Backend is not running"
        # Try to kill by port anyway
        if kill_port $BACKEND_PORT; then
            print_success "Killed orphaned backend process on port $BACKEND_PORT"
        fi
        return 0
    fi
    
    print_status "Stopping backend service..."
    
    local pid=$(cat "$BACKEND_PID")
    kill $pid 2>/dev/null
    
    # Wait for graceful shutdown
    local count=0
    while is_running "$BACKEND_PID" && [ $count -lt 10 ]; do
        sleep 1
        count=$((count + 1))
    done
    
    # Force kill if still running
    if is_running "$BACKEND_PID"; then
        kill -9 $pid 2>/dev/null
        sleep 1
    fi
    
    rm -f "$BACKEND_PID"
    print_success "Backend stopped"
}

# Stop frontend service
stop_frontend() {
    if ! is_running "$FRONTEND_PID"; then
        print_warning "Frontend is not running"
        # Try to kill by port anyway
        if kill_port $FRONTEND_PORT; then
            print_success "Killed orphaned frontend process on port $FRONTEND_PORT"
        fi
        return 0
    fi
    
    print_status "Stopping frontend service..."
    
    local pid=$(cat "$FRONTEND_PID")
    kill $pid 2>/dev/null
    
    # Wait for shutdown
    local count=0
    while is_running "$FRONTEND_PID" && [ $count -lt 5 ]; do
        sleep 1
        count=$((count + 1))
    done
    
    # Force kill if still running
    if is_running "$FRONTEND_PID"; then
        kill -9 $pid 2>/dev/null
        sleep 1
    fi
    
    rm -f "$FRONTEND_PID"
    print_success "Frontend stopped"
}

# Service status
status_service() {
    local service=$1
    local pid_file=$2
    local port=$3
    
    echo -n "  $service: "
    
    if is_running "$pid_file"; then
        local pid=$(cat "$pid_file")
        echo -e "${GREEN}Running${NC} (PID: $pid, Port: $port)"
        
        # Check if actually listening on port
        if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "    ${YELLOW}Warning: Process running but not listening on port $port${NC}"
        fi
    else
        echo -e "${RED}Stopped${NC}"
        
        # Check if port is occupied by another process
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "    ${YELLOW}Warning: Port $port is in use by another process${NC}"
        fi
    fi
}

# Show status
show_status() {
    echo -e "${BLUE}=== @Torrent Service Status ===${NC}"
    echo
    status_service "Backend" "$BACKEND_PID" $BACKEND_PORT
    status_service "Frontend" "$FRONTEND_PID" $FRONTEND_PORT
    echo
}

# View logs
view_logs() {
    local service=$1
    
    case $service in
        backend)
            if [ -f "$LOG_DIR/backend.log" ]; then
                tail -f "$LOG_DIR/backend.log"
            else
                print_error "Backend log file not found"
            fi
            ;;
        frontend)
            if [ -f "$LOG_DIR/frontend-error.log" ]; then
                tail -f "$LOG_DIR/frontend-error.log"
            else
                print_error "Frontend log file not found"
            fi
            ;;
        all)
            print_status "Following all logs (Ctrl+C to stop)..."
            tail -f "$LOG_DIR"/*.log 2>/dev/null
            ;;
        *)
            print_error "Invalid service. Use: backend, frontend, or all"
            ;;
    esac
}

# Clean logs
clean_logs() {
    print_status "Cleaning log files..."
    
    # Backup current logs with timestamp
    local timestamp=$(date +%Y%m%d_%H%M%S)
    if [ -f "$LOG_DIR/backend.log" ]; then
        mv "$LOG_DIR/backend.log" "$LOG_DIR/backend_${timestamp}.log"
        print_success "Backed up backend.log"
    fi
    if [ -f "$LOG_DIR/frontend-error.log" ]; then
        mv "$LOG_DIR/frontend-error.log" "$LOG_DIR/frontend-error_${timestamp}.log"
        print_success "Backed up frontend-error.log"
    fi
    
    # Remove old backups (keep last 5)
    ls -t "$LOG_DIR"/backend_*.log 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null
    ls -t "$LOG_DIR"/frontend-error_*.log 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null
    
    print_success "Log files cleaned"
}

# Main menu
show_help() {
    echo "@Torrent App Manager"
    echo "===================="
    echo
    echo "Usage: $0 [command] [options]"
    echo
    echo "Commands:"
    echo "  start [all|backend|frontend]   Start service(s)"
    echo "  stop [all|backend|frontend]    Stop service(s)"
    echo "  restart [all|backend|frontend] Restart service(s)"
    echo "  status                          Show service status"
    echo "  logs [backend|frontend|all]    View service logs"
    echo "  clean-logs                      Clean and backup log files"
    echo "  help                            Show this help message"
    echo
    echo "Examples:"
    echo "  $0 start all        # Start both services"
    echo "  $0 stop backend     # Stop only backend"
    echo "  $0 restart all      # Restart both services"
    echo "  $0 status           # Check service status"
    echo "  $0 logs backend     # View backend logs"
    echo
}

# Main script
main() {
    init_dirs
    
    case "${1:-help}" in
        start)
            case "${2:-all}" in
                all)
                    start_backend
                    start_frontend
                    echo
                    show_status
                    ;;
                backend)
                    start_backend
                    ;;
                frontend)
                    start_frontend
                    ;;
                *)
                    print_error "Invalid service. Use: all, backend, or frontend"
                    exit 1
                    ;;
            esac
            ;;
        stop)
            case "${2:-all}" in
                all)
                    stop_frontend
                    stop_backend
                    echo
                    show_status
                    ;;
                backend)
                    stop_backend
                    ;;
                frontend)
                    stop_frontend
                    ;;
                *)
                    print_error "Invalid service. Use: all, backend, or frontend"
                    exit 1
                    ;;
            esac
            ;;
        restart)
            case "${2:-all}" in
                all)
                    stop_frontend
                    stop_backend
                    sleep 2
                    start_backend
                    start_frontend
                    echo
                    show_status
                    ;;
                backend)
                    stop_backend
                    sleep 2
                    start_backend
                    ;;
                frontend)
                    stop_frontend
                    sleep 1
                    start_frontend
                    ;;
                *)
                    print_error "Invalid service. Use: all, backend, or frontend"
                    exit 1
                    ;;
            esac
            ;;
        status)
            show_status
            ;;
        logs)
            view_logs "${2:-all}"
            ;;
        clean-logs)
            clean_logs
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            echo
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
