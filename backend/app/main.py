"""Improved main application with better logging and error handling."""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import json
import asyncio
from typing import List
import os
from pathlib import Path
import logging

from app.core.config import settings
from app.core.constants import WEBSOCKET_BROADCAST_INTERVAL, ERROR_RETRY_DELAY
from app.api.v1.api import api_router
from app.api.v1.system import router as system_router
from app.db.init_db import init_db

# Use improved torrent service
from app.services.torrent_service_improved import ImprovedTorrentService
from app.core.websocket_manager import WebSocketManager

# Enhanced logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("logs/atorrent.log"),
        logging.StreamHandler()
    ]
)

# Silence noisy loggers but keep important ones
logging.getLogger("sqlalchemy").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.pool").setLevel(logging.WARNING)
logging.getLogger("uvicorn").setLevel(logging.INFO)

logger = logging.getLogger(__name__)

# Ensure required directories exist
os.makedirs("logs", exist_ok=True)
downloads_path = Path(settings.DOWNLOAD_PATH)
downloads_path.mkdir(exist_ok=True)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Modern torrent client web application with improved architecture",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Enhanced CORS middleware with better security
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=86400,  # Cache preflight requests for 1 day
)

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(
    system_router, prefix=settings.API_V1_STR + "/system", tags=["system"]
)

# Global instances
websocket_manager = WebSocketManager()
torrent_service = None


@app.on_event("startup")
async def startup_event():
    """Enhanced startup with proper error handling and logging."""
    global torrent_service

    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")

    try:
        # Initialize database
        logger.info("Initializing database...")
        init_db()
        logger.info("Database initialized successfully")

        # Initialize improved torrent service
        logger.info("Initializing torrent service...")
        torrent_service = ImprovedTorrentService(downloads_path=settings.DOWNLOAD_PATH)
        await torrent_service.initialize()
        logger.info("Torrent service initialized successfully")

        # Start background task for real-time updates
        logger.info("Starting WebSocket broadcast task...")
        asyncio.create_task(enhanced_broadcast_torrent_updates())

        logger.info(f"{settings.APP_NAME} startup completed successfully")

    except Exception as e:
        logger.error(f"Failed to start application: {e}", exc_info=True)
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Enhanced shutdown with proper cleanup."""
    global torrent_service

    logger.info("Shutting down aTorrent...")

    try:
        if torrent_service:
            logger.info("Cleaning up torrent service...")
            await torrent_service.cleanup()
            logger.info("Torrent service cleaned up")

        # Close WebSocket connections
        if websocket_manager.active_connections:
            logger.info(f"Closing {len(websocket_manager.active_connections)} WebSocket connections...")
            for connection in websocket_manager.active_connections.copy():
                try:
                    await connection.close()
                except Exception as e:
                    logger.warning(f"Error closing WebSocket connection: {e}")

        logger.info("aTorrent shutdown completed")

    except Exception as e:
        logger.error(f"Error during shutdown: {e}", exc_info=True)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Enhanced WebSocket endpoint with better error handling."""
    client_id = f"{websocket.client.host}:{websocket.client.port}" if websocket.client else "unknown"
    logger.info(f"WebSocket connection attempt from {client_id}")

    await websocket_manager.connect(websocket)
    logger.info(f"WebSocket connected: {client_id}")

    try:
        while True:
            try:
                # Receive message with timeout
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                message = json.loads(data)

                # Handle different message types
                await handle_websocket_message(websocket, message)

            except asyncio.TimeoutError:
                # Send ping to keep connection alive
                await websocket.send_text(json.dumps({"type": "ping"}))
                continue
            except json.JSONDecodeError as e:
                logger.warning(f"Invalid JSON from {client_id}: {e}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON format"
                }))
                continue

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {client_id}")
    except Exception as e:
        logger.error(f"WebSocket error for {client_id}: {e}", exc_info=True)
    finally:
        websocket_manager.disconnect(websocket)


async def handle_websocket_message(websocket: WebSocket, message: dict):
    """Handle incoming WebSocket messages."""
    try:
        message_type = message.get("type", "")

        if message_type == "ping":
            await websocket.send_text(json.dumps({"type": "pong"}))
        elif message_type == "subscribe":
            await websocket.send_text(json.dumps({
                "type": "subscribed",
                "data": {"status": "subscribed"}
            }))
        elif message_type == "get_status":
            # Send current status immediately
            if torrent_service:
                torrents_status = await torrent_service.get_all_torrents_status()
                await websocket.send_text(json.dumps({
                    "type": "torrent_update",
                    "data": torrents_status
                }))
        else:
            logger.warning(f"Unknown WebSocket message type: {message_type}")
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": f"Unknown message type: {message_type}"
            }))

    except Exception as e:
        logger.error(f"Error handling WebSocket message: {e}")


async def enhanced_broadcast_torrent_updates():
    """Enhanced background task to broadcast torrent updates."""
    global torrent_service

    logger.info("Starting enhanced torrent update broadcast loop")

    while True:
        try:
            if torrent_service and websocket_manager.active_connections:
                # Get current torrent status
                torrents_status = await torrent_service.get_all_torrents_status()

                # Only broadcast if there are active connections
                if websocket_manager.active_connections:
                    message = {
                        "type": "torrent_update",
                        "data": torrents_status,
                        "timestamp": asyncio.get_event_loop().time()
                    }

                    await websocket_manager.broadcast(message)

                    # Log status periodically (every 50 updates)
                    if hasattr(enhanced_broadcast_torrent_updates, '_counter'):
                        enhanced_broadcast_torrent_updates._counter += 1
                    else:
                        enhanced_broadcast_torrent_updates._counter = 1

                    if enhanced_broadcast_torrent_updates._counter % 50 == 0:
                        active_torrents = len([t for t in torrents_status if t.get('status') not in ['paused', 'completed']])
                        logger.info(f"Broadcasting status: {active_torrents} active torrents, "
                                  f"{len(websocket_manager.active_connections)} WebSocket clients")

            await asyncio.sleep(WEBSOCKET_BROADCAST_INTERVAL)

        except Exception as e:
            logger.error(f"Error in broadcast_torrent_updates: {e}", exc_info=True)
            await asyncio.sleep(ERROR_RETRY_DELAY)


@app.get("/")
async def root():
    """Enhanced root endpoint with more information."""
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "version": settings.APP_VERSION,
        "docs": f"{settings.API_V1_STR}/docs",
        "redoc": f"{settings.API_V1_STR}/redoc",
        "status": "operational",
        "torrent_service": "active" if torrent_service else "inactive"
    }


@app.get("/health")
async def health_check():
    """Enhanced health check with detailed status."""
    try:
        # Check torrent service
        torrent_status = "healthy" if torrent_service and torrent_service.running else "unhealthy"

        # Check WebSocket connections
        websocket_count = len(websocket_manager.active_connections)

        # Get basic stats
        stats = {}
        if torrent_service:
            try:
                stats = torrent_service.get_session_stats()
            except Exception as e:
                logger.warning(f"Error getting session stats: {e}")

        return {
            "status": "healthy" if torrent_status == "healthy" else "degraded",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "components": {
                "torrent_service": torrent_status,
                "websocket_connections": websocket_count,
                "database": "healthy"  # Could add actual DB check
            },
            "stats": stats
        }

    except Exception as e:
        logger.error(f"Health check error: {e}")
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


# Enhanced service accessors with validation
def get_torrent_service() -> ImprovedTorrentService:
    """Get torrent service with validation."""
    if not torrent_service:
        raise HTTPException(status_code=503, detail="Torrent service not initialized")
    return torrent_service


def get_websocket_manager() -> WebSocketManager:
    """Get WebSocket manager."""
    return websocket_manager


# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for better error reporting."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return {
        "error": "Internal server error",
        "message": "An unexpected error occurred",
        "detail": str(exc) if settings.DEBUG else "Please check the logs"
    }
