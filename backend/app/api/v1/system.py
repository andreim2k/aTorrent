"""
System Statistics API endpoints
Provides REST and WebSocket endpoints for real-time system monitoring
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, Any
import asyncio
import json
import logging
from app.services.system_stats import get_system_stats
from app.api.deps import get_authenticated

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/stats")
async def get_system_statistics(
    is_authenticated: bool = Depends(get_authenticated),
) -> Dict[str, Any]:
    """
    Get current system statistics snapshot
    Includes CPU, memory, disk, and network usage
    """
    try:
        stats = get_system_stats()
        return {"status": "success", "data": stats}
    except Exception as e:
        logger.error(f"Error getting system stats: {e}")
        return {"status": "error", "error": str(e), "data": None}


@router.websocket("/ws")
async def system_stats_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for real-time system statistics
    Streams system stats every 200ms
    """
    await websocket.accept()
    logger.info("System stats WebSocket connection established")

    try:
        while True:
            try:
                # Get current system stats
                stats = get_system_stats()

                # Send to client
                await websocket.send_text(
                    json.dumps(
                        {
                            "type": "system_stats",
                            "data": stats,
                            "timestamp": stats.get("timestamp"),
                        }
                    )
                )

                # Wait for 200ms before next update
                await asyncio.sleep(0.2)

            except Exception as e:
                logger.error(f"Error sending system stats: {e}")
                await websocket.send_text(
                    json.dumps(
                        {
                            "type": "error",
                            "error": str(e),
                            "timestamp": asyncio.get_event_loop().time(),
                        }
                    )
                )
                await asyncio.sleep(1)  # Wait longer on error

    except WebSocketDisconnect:
        logger.info("System stats WebSocket disconnected")
    except Exception as e:
        logger.error(f"System stats WebSocket error: {e}")
        try:
            await websocket.close()
        except:
            pass
