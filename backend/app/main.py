"""Improved main application with better logging and error handling."""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import json
import asyncio
from typing import List
import os
from pathlib import Path
import logging
import time
from datetime import datetime, timezone

from app.core.config import settings
from app.core.constants import WEBSOCKET_BROADCAST_INTERVAL, ERROR_RETRY_DELAY
from app.api.v1.api import api_router
from app.api.v1.system import router as system_router
from app.db.init_db import init_db

# Use consolidated torrent service
from app.services.torrent_service import TorrentService
from app.core.websocket_manager import WebSocketManager

# Enhanced logging configuration with rotation
from logging.handlers import RotatingFileHandler

# Create logs directory if it doesn't exist
os.makedirs("logs", exist_ok=True)

# Set up rotating file handler
file_handler = RotatingFileHandler(
    "logs/atorrent.log",
    maxBytes=10485760,  # 10MB
    backupCount=5
)
file_handler.setFormatter(
    logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        file_handler,
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
    description="Modern torrent client web application with Google OAuth and rate limiting",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Enhanced CORS middleware with better security
logger.info(f"Configuring CORS with allowed origins: {settings.ALLOWED_ORIGINS}")
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

@app.on_event("startup")
async def startup_event():
    """Enhanced startup with proper error handling and logging."""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    
    # Initialize services using app.state (better than globals)
    app.state.websocket_manager = WebSocketManager()
    app.state.torrent_service = None
    app.state.startup_time = time.time()

    try:
        # Initialize database
        logger.info("Initializing database...")
        init_db()
        logger.info("Database initialized successfully")

        # Initialize consolidated torrent service
        logger.info("Initializing torrent service...")
        app.state.torrent_service = TorrentService(downloads_path=settings.DOWNLOAD_PATH)
        await app.state.torrent_service.initialize()
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
    """Enhanced shutdown with proper cleanup and graceful connection termination."""
    logger.info("Shutting down aTorrent...")
    shutdown_timeout = 30  # seconds

    try:
        # Stop accepting new requests
        torrent_service = getattr(app.state, 'torrent_service', None)
        websocket_manager = getattr(app.state, 'websocket_manager', None)
        
        if torrent_service:
            # Wait for active operations with timeout
            start_time = time.time()
            logger.info("Cleaning up torrent service...")
            await torrent_service.cleanup()
            logger.info("Torrent service cleaned up")

        # Close WebSocket connections gracefully
        if websocket_manager and websocket_manager.active_connections:
            logger.info(f"Closing {len(websocket_manager.active_connections)} WebSocket connections...")
            
            # Notify clients of shutdown
            disconnect_message = {
                "type": "server_shutdown",
                "message": "Server is shutting down"
            }
            await websocket_manager.broadcast(disconnect_message)
            await asyncio.sleep(1)  # Give clients time to receive message
            
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
    websocket_manager = app.state.websocket_manager
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
        torrent_service = getattr(app.state, 'torrent_service', None)
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
    """Enhanced background task with circuit breaker and better error recovery."""
    logger.info("Starting enhanced torrent update broadcast loop")
    consecutive_errors = 0
    max_consecutive_errors = 10

    while True:
        try:
            torrent_service = getattr(app.state, 'torrent_service', None)
            websocket_manager = getattr(app.state, 'websocket_manager', None)
            
            if not torrent_service:
                logger.warning("Torrent service not available, waiting...")
                await asyncio.sleep(5)
                continue
                
            if torrent_service and websocket_manager and websocket_manager.active_connections:
                # Get current torrent status
                torrents_status = await torrent_service.get_all_torrents_status()

                # Only broadcast if there are active connections
                if websocket_manager.active_connections:
                    message = {
                        "type": "torrent_update",
                        "data": torrents_status,
                        "timestamp": time.time()
                    }

                    await websocket_manager.broadcast(message)

                    # Log status periodically (every 50 updates)
                    if hasattr(enhanced_broadcast_torrent_updates, '_counter'):
                        enhanced_broadcast_torrent_updates._counter += 1
                    else:
                        enhanced_broadcast_torrent_updates._counter = 1

                    if enhanced_broadcast_torrent_updates._counter % 50 == 0:
                        active_torrents = len([t for t in torrents_status if t.get('status') not in ['paused', 'completed']])
                        if websocket_manager:
                            logger.info(f"Broadcasting status: {active_torrents} active torrents, "
                                      f"{len(websocket_manager.active_connections)} WebSocket clients")

            consecutive_errors = 0  # Reset on success
            await asyncio.sleep(WEBSOCKET_BROADCAST_INTERVAL)

        except Exception as e:
            consecutive_errors += 1
            logger.error(f"Error in broadcast_torrent_updates (attempt {consecutive_errors}): {e}", exc_info=True)
            
            # Circuit breaker: stop after too many failures
            if consecutive_errors >= max_consecutive_errors:
                logger.critical("Too many consecutive errors in broadcast loop, stopping...")
                break
                
            await asyncio.sleep(ERROR_RETRY_DELAY * min(consecutive_errors, 5))  # Exponential backoff


@app.get("/")
async def root():
    """Enhanced root endpoint with more information."""
    torrent_service = getattr(app.state, 'torrent_service', None)
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "version": settings.APP_VERSION,
        "docs": f"{settings.API_V1_STR}/docs",
        "redoc": f"{settings.API_V1_STR}/redoc",
        "status": "operational",
        "torrent_service": "active" if torrent_service else "inactive",
        "authentication": "Google OAuth + Password"
    }


@app.get("/health")
async def health_check():
    """Comprehensive health check with actual component verification."""
    from app.db.utils import get_db_context
    from app.models.settings import AppSettings
    
    checks = {
        "torrent_service": "unknown",
        "database": "unknown",
        "websocket": "unknown"
    }
    
    try:
        # Check database
        try:
            with get_db_context() as db:
                db.query(AppSettings).first()
            checks["database"] = "healthy"
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            checks["database"] = "unhealthy"
        
        # Check torrent service
        torrent_service = getattr(app.state, 'torrent_service', None)
        checks["torrent_service"] = "healthy" if (
            torrent_service and torrent_service.running
        ) else "unhealthy"
        
        # Check WebSocket
        websocket_manager = getattr(app.state, 'websocket_manager', None)
        checks["websocket"] = "healthy" if websocket_manager else "unhealthy"
        
        all_healthy = all(status == "healthy" for status in checks.values())
        
        # Get stats if available
        stats = {}
        if torrent_service:
            try:
                stats = torrent_service.get_session_stats()
            except Exception as e:
                logger.warning(f"Error getting session stats: {e}")
        
        response_data = {
            "status": "healthy" if all_healthy else "degraded",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "uptime": int(time.time() - getattr(app.state, 'startup_time', time.time())),
            "checks": checks,
            "stats": stats
        }
        
        status_code = 200 if all_healthy else 503
        return Response(
            content=json.dumps(response_data),
            status_code=status_code,
            media_type="application/json"
        )

    except Exception as e:
        logger.error(f"Health check error: {e}", exc_info=True)
        return Response(
            content=json.dumps({
                "status": "unhealthy",
                "error": str(e)
            }),
            status_code=503,
            media_type="application/json"
        )


# Enhanced service accessors with validation using app.state
def get_torrent_service() -> TorrentService:
    """Get torrent service with validation."""
    torrent_service = getattr(app.state, 'torrent_service', None)
    if not torrent_service:
        raise HTTPException(status_code=503, detail="Torrent service not initialized")
    return torrent_service


def get_websocket_manager() -> WebSocketManager:
    """Get WebSocket manager."""
    websocket_manager = getattr(app.state, 'websocket_manager', None)
    if not websocket_manager:
        raise HTTPException(status_code=503, detail="WebSocket manager not initialized")
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
