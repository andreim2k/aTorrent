from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import json
import asyncio
from typing import List
import os
from pathlib import Path
import logging

from app.core.config import settings
from app.api.v1.api import api_router
from app.db.init_db import init_db
# Use real libtorrent service
from app.services.torrent_service import TorrentService
from app.core.websocket_manager import WebSocketManager

# Setup basic logging
logging.basicConfig(
    level=logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
# Silence SQLAlchemy logging
logging.getLogger('sqlalchemy').setLevel(logging.WARNING)
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
logging.getLogger('sqlalchemy.pool').setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

# Ensure downloads directory exists
downloads_path = Path(settings.DOWNLOAD_PATH)
downloads_path.mkdir(exist_ok=True)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Modern torrent client web application",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

# Global instances
websocket_manager = WebSocketManager()
torrent_service = None

@app.on_event("startup")
async def startup_event():
    """Initialize database and torrent service on startup"""
    global torrent_service
    
    # Initialize database
    init_db()
    
    # Initialize torrent service
    torrent_service = TorrentService(downloads_path=settings.DOWNLOAD_PATH)
    await torrent_service.initialize()
    
    # Start background task for real-time updates
    asyncio.create_task(broadcast_torrent_updates())

@app.on_event("shutdown")
async def shutdown_event():
    """Clean shutdown"""
    global torrent_service
    if torrent_service:
        await torrent_service.cleanup()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await websocket_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
            elif message.get("type") == "subscribe":
                # Handle subscription to specific torrent updates
                await websocket.send_text(json.dumps({
                    "type": "subscribed",
                    "data": {"status": "subscribed"}
                }))
                
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)
    except Exception as e:
        websocket_manager.disconnect(websocket)

async def broadcast_torrent_updates():
    """Background task to broadcast torrent updates to all connected clients"""
    global torrent_service
    import logging
    logger = logging.getLogger(__name__)
    
    while True:
        try:
            if torrent_service and websocket_manager.active_connections:
                # Get current torrent status
                torrents_status = await torrent_service.get_all_torrents_status()
                
                # Broadcast to all connected clients
                await websocket_manager.broadcast({
                    "type": "torrent_update",
                    "data": torrents_status
                })
                
            await asyncio.sleep(0.2)  # Update every 200ms
        except Exception as e:
            logger.error(f"Error in broadcast_torrent_updates: {e}")
            await asyncio.sleep(5)  # Wait longer if there's an error

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "version": settings.APP_VERSION,
        "docs": f"{settings.API_V1_STR}/docs"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION
    }

# Make torrent_service available globally
def get_torrent_service() -> TorrentService:
    return torrent_service

def get_websocket_manager() -> WebSocketManager:
    return websocket_manager
