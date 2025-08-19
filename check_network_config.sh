#!/bin/bash

echo "==================================="
echo "aTorrent Network Configuration Check"
echo "==================================="
echo

echo "📋 Port Configuration:"
echo "  Frontend: 3000"
echo "  Backend: 8000"
echo

echo "🌐 Network Binding:"
grep -n "python3 -m http.server.*--bind" app.sh | head -1
grep -n "uvicorn.*--host" app.sh | head -1
echo

echo "📦 Package.json Scripts:"
grep -A 3 '"scripts"' frontend/package.json
echo

echo "🔧 Backend .env CORS Settings:"
grep "ALLOWED_ORIGINS" backend/.env
echo

echo "🖥️  Server IPs:"
echo -n "  Local IP: "
hostname -I | awk '{print $1}'
echo

echo "✅ Access URLs:"
IP=$(hostname -I | awk '{print $1}')
echo "  Frontend: http://$IP:3000"
echo "  Backend API: http://$IP:8000"
echo "  API Docs: http://$IP:8000/docs"
echo
