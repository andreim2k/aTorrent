from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from datetime import datetime

from app.api.deps import get_db, get_authenticated
from app.core.security import (
    verify_password,
    get_password_hash,
    create_tokens,
    verify_token,
)
from app.models.settings import AppSettings
from app.schemas.auth import Token, Login, RefreshToken

router = APIRouter()

# Registration removed - single-user application


@router.post("/login", response_model=Token)
def login(credentials: Login, db: Session = Depends(get_db)):
    """Authenticate with password and return access token"""
    # Get app settings to check password
    settings = db.query(AppSettings).first()

    if not settings:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Application not initialized",
        )

    # Verify password against stored hash
    if not verify_password(credentials.password, settings.app_password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password"
        )

    # Create and return tokens (using a fixed user ID since single user)
    return create_tokens(1)


@router.post("/refresh", response_model=Token)
def refresh_token(refresh_data: RefreshToken, db: Session = Depends(get_db)):
    """Refresh access token using refresh token"""
    user_id = verify_token(refresh_data.refresh_token, "refresh")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    # Create and return new tokens (fixed user ID for single-user)
    return create_tokens(1)


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout():
    """Logout (client should discard tokens)"""
    # In a production app, you might want to blacklist the token
    # For now, we just return success and let the client discard the token
    return {"message": "Successfully logged out"}


@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    password_data: dict,
    authenticated: bool = Depends(get_authenticated),
    db: Session = Depends(get_db),
):
    """Change the application password"""

    # Validate required fields
    current_password = password_data.get("current_password")
    new_password = password_data.get("new_password")

    if not current_password or not new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both current_password and new_password are required",
        )

    # Get app settings
    settings = db.query(AppSettings).first()
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Application not initialized",
        )

    # Verify current password
    if not verify_password(current_password, settings.app_password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect",
        )

    # Validate new password
    if len(new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long",
        )

    # Update password
    settings.app_password_hash = get_password_hash(new_password)
    db.commit()

    return {"message": "Password changed successfully"}


# User profile endpoints removed - single-user application
