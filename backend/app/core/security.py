from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional, Set
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import HTTPException, status
import secrets
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Token revocation list (in production, use Redis or database)
_revoked_tokens: Set[str] = set()


def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    """Create a JWT access token with proper timezone handling and unique ID."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    # Add jti (JWT ID) for token revocation support
    jti = secrets.token_urlsafe(16)
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "access",
        "jti": jti,
        "iat": datetime.now(timezone.utc)
    }
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(subject: Union[str, Any]) -> str:
    """Create a JWT refresh token with proper timezone and rotation support."""
    expire = datetime.now(timezone.utc) + timedelta(days=7)  # Reduced from 30 to 7 days
    jti = secrets.token_urlsafe(16)
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh",
        "jti": jti,
        "iat": datetime.now(timezone.utc)
    }
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate password hash"""
    return pwd_context.hash(password)


def verify_token(token: str, token_type: str = "access") -> Optional[str]:
    """Verify JWT token with revocation check and return user ID."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        token_type_claim: str = payload.get("type")
        jti: str = payload.get("jti")

        if user_id is None or token_type_claim != token_type:
            return None

        # Check if token is revoked
        if jti and jti in _revoked_tokens:
            logger.warning(f"Attempt to use revoked token: {jti}")
            return None

        return user_id
    except JWTError as e:
        logger.warning(f"Token verification failed: {e}")
        return None


def revoke_token(token: str) -> bool:
    """Revoke a token by adding its JTI to the revocation list."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        jti = payload.get("jti")
        if jti:
            _revoked_tokens.add(jti)
            logger.info(f"Token revoked: {jti}")
            return True
        return False
    except JWTError:
        return False


def cleanup_revoked_tokens() -> int:
    """Remove expired tokens from revocation list."""
    removed = 0
    for jti in list(_revoked_tokens):
        # In production, check expiration from database
        # For now, keep all revoked tokens
        pass
    return removed


def decode_token(token: str) -> Optional[dict]:
    """Decode JWT token without verification (for extracting claims)"""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


class TokenData:
    """Token data model"""

    def __init__(self, user_id: Optional[str] = None, scopes: list = None):
        self.user_id = user_id
        self.scopes = scopes or []


def create_tokens(user_id: int) -> dict:
    """Create both access and refresh tokens for a user"""
    access_token = create_access_token(subject=user_id)
    refresh_token = create_refresh_token(subject=user_id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }
