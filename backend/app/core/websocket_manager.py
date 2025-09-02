from fastapi import WebSocket
from typing import List, Dict, Any
import json
import asyncio
import logging

logger = logging.getLogger(__name__)


class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int = None):
        """Connect a new WebSocket client"""
        await websocket.accept()
        self.active_connections.append(websocket)

        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = []
            self.user_connections[user_id].append(websocket)

        logger.info(
            f"WebSocket connected. Total connections: {len(self.active_connections)}"
        )

    def disconnect(self, websocket: WebSocket, user_id: int = None):
        """Disconnect a WebSocket client"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

        if user_id and user_id in self.user_connections:
            if websocket in self.user_connections[user_id]:
                self.user_connections[user_id].remove(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

        logger.info(
            f"WebSocket disconnected. Total connections: {len(self.active_connections)}"
        )

    async def send_personal_message(
        self, message: Dict[str, Any], websocket: WebSocket
    ):
        """Send a message to a specific WebSocket connection"""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            self.disconnect(websocket)

    async def send_to_user(self, message: Dict[str, Any], user_id: int):
        """Send a message to all connections for a specific user"""
        if user_id not in self.user_connections:
            return

        disconnected = []
        for websocket in self.user_connections[user_id]:
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending message to user {user_id}: {e}")
                disconnected.append(websocket)

        # Clean up disconnected connections
        for websocket in disconnected:
            self.disconnect(websocket, user_id)

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast a message to all connected clients"""
        if not self.active_connections:
            return

        disconnected = []
        message_json = json.dumps(message)

        for connection in self.active_connections:
            try:
                await connection.send_text(message_json)
            except Exception as e:
                logger.error(f"Error broadcasting message: {e}")
                disconnected.append(connection)

        # Remove disconnected connections
        for connection in disconnected:
            self.disconnect(connection)

    async def broadcast_to_users(self, message: Dict[str, Any], user_ids: List[int]):
        """Broadcast a message to specific users"""
        tasks = []
        for user_id in user_ids:
            if user_id in self.user_connections:
                tasks.append(self.send_to_user(message, user_id))

        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    def get_connection_count(self) -> int:
        """Get the total number of active connections"""
        return len(self.active_connections)

    def get_user_connection_count(self, user_id: int) -> int:
        """Get the number of connections for a specific user"""
        return len(self.user_connections.get(user_id, []))
