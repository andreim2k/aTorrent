#!/bin/bash

# Start the backend with reduced logging
cd /Users/andrei/aTorrent/backend

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Start uvicorn with reduced logging
# --log-level warning: Only show warnings and errors
# Remove --reload for production
nohup uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --log-level warning \
    > logs/backend.log 2>&1 &

echo "Backend started with PID: $!"
echo "Logs: /Users/andrei/aTorrent/backend/logs/backend.log"
