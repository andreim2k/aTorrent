from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Generator, Optional

from app.core.config import settings
from app.core.security import verify_token
from app.db.database import SessionLocal

# User model removed - single-user application
from app.services.torrent_service import TorrentService
from app.core.websocket_manager import WebSocketManager


def get_torrent_service_dep() -> Optional[TorrentService]:
    """Get torrent service dependency from main.py global instance"""
    from app.main import get_torrent_service

    return get_torrent_service()


# Security scheme
security = HTTPBearer()


def get_db() -> Generator:
    """Database dependency"""
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()


def get_authenticated(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> bool:
    """Validate JWT token for single-user application"""
    token = credentials.credentials
    user_id = verify_token(token, "access")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return True


# User authentication functions removed - single-user application
