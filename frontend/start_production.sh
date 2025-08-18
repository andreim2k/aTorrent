#!/bin/bash

# Start the frontend server with minimal logging
cd /Users/andrei/aTorrent/frontend/src

# Kill any existing Python HTTP server on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Start the server with minimal output
# Redirect stdout to /dev/null to suppress access logs
# Keep stderr for actual errors only
nohup python3 -m http.server 3000 > /dev/null 2> ../logs/frontend-error.log &

echo "Frontend started with PID: $!"
echo "Error logs: /Users/andrei/aTorrent/frontend/logs/frontend-error.log"
echo "Access at: http://localhost:3000/"
