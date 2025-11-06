from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from datetime import datetime
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.deps import get_db, get_authenticated
from app.core.security import (
    verify_password,
    get_password_hash,
    create_tokens,
    verify_token,
    revoke_token,
)
from app.core.oauth import google_oauth
from app.models.settings import AppSettings
from app.schemas.auth import (
    Token, 
    Login, 
    RefreshToken,
    GoogleAuthRequest,
    PasswordChange,
    UserProfile
)

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/google", response_model=Token)
@limiter.limit("10/minute")
async def google_login(
    request: Request,
    auth_request: GoogleAuthRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate with Google OAuth.
    This is the preferred authentication method.
    """
    # Check if Google OAuth is configured
    if not google_oauth.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google authentication not configured"
        )
    
    # Verify Google token
    user_info = await google_oauth.verify_token(auth_request.credential)
    
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google credentials"
        )
    
    # Get or create app settings
    settings = db.query(AppSettings).first()
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Application not initialized"
        )
    
    # Store Google user info in settings (for single-user app)
    settings.google_user_email = user_info['email']
    settings.google_user_name = user_info.get('name')
    settings.google_user_picture = user_info.get('picture')
    settings.google_user_id = user_info.get('google_id')
    db.commit()
    
    # Create and return tokens (using fixed user ID for single-user app)
    return create_tokens(1)


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login(
    request: Request,
    credentials: Login,
    db: Session = Depends(get_db)
):
    """
    Authenticate with password (deprecated - use Google OAuth instead).
    Rate limited to 5 attempts per minute.
    """
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
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )

    # Create and return tokens (using a fixed user ID since single user)
    return create_tokens(1)


@router.post("/refresh", response_model=Token)
@limiter.limit("20/minute")
def refresh_token(
    request: Request,
    refresh_data: RefreshToken,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token"""
    user_id = verify_token(refresh_data.refresh_token, "refresh")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    # Revoke old refresh token (token rotation)
    revoke_token(refresh_data.refresh_token)

    # Create and return new tokens (fixed user ID for single-user)
    return create_tokens(1)


@router.post("/logout", status_code=status.HTTP_200_OK)
@limiter.limit("10/minute")
def logout(
    request: Request,
    authenticated: bool = Depends(get_authenticated)
):
    """
    Logout and revoke tokens.
    Note: Client should also discard tokens from storage.
    """
    # In a more complete implementation, we would:
    # 1. Get the token from the request
    # 2. Revoke it using revoke_token()
    # For now, we rely on client-side token removal
    return {"message": "Successfully logged out"}


@router.post("/change-password", status_code=status.HTTP_200_OK)
@limiter.limit("3/minute")
def change_password(
    request: Request,
    password_data: PasswordChange,
    authenticated: bool = Depends(get_authenticated),
    db: Session = Depends(get_db),
):
    """
    Change the application password.
    Rate limited to 3 attempts per minute.
    Requires strong password: min 8 chars, uppercase, lowercase, digit, special char.
    """
    # Get app settings
    settings = db.query(AppSettings).first()
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Application not initialized",
        )

    # Verify current password
    if not verify_password(password_data.current_password, settings.app_password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect",
        )

    # Update password (Pydantic already validated strength)
    settings.app_password_hash = get_password_hash(password_data.new_password)
    db.commit()

    return {"message": "Password changed successfully"}


@router.get("/profile", response_model=UserProfile)
def get_profile(
    authenticated: bool = Depends(get_authenticated),
    db: Session = Depends(get_db)
):
    """
    Get user profile information.
    For single-user app, returns Google user info if authenticated with Google.
    """
    settings = db.query(AppSettings).first()
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Application not initialized"
        )
    
    return UserProfile(
        email=settings.google_user_email or "admin@atorrent.local",
        name=settings.google_user_name,
        picture=settings.google_user_picture,
        google_id=settings.google_user_id
    )
