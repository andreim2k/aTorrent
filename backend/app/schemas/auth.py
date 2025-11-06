from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List


class Login(BaseModel):
    """Password-based login (deprecated in favor of Google OAuth)."""
    password: str = Field(..., min_length=1, max_length=256)


class Token(BaseModel):
    """JWT token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenData(BaseModel):
    """Token payload data."""
    user_id: Optional[int] = None
    scopes: List[str] = []


class RefreshToken(BaseModel):
    """Refresh token request."""
    refresh_token: str = Field(..., min_length=1)


class GoogleAuthRequest(BaseModel):
    """Google OAuth token request."""
    credential: str = Field(..., description="Google ID token from OAuth flow")
    
    @validator('credential')
    def validate_credential(cls, v):
        if not v or len(v) < 10:
            raise ValueError("Invalid Google credential")
        return v


class PasswordChange(BaseModel):
    """Password change request with strong validation."""
    current_password: str = Field(..., min_length=1, max_length=256)
    new_password: str = Field(..., min_length=8, max_length=128)
    
    @validator('new_password')
    def validate_password_strength(cls, v):
        """Validate password meets complexity requirements."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if len(v) > 128:
            raise ValueError('Password too long (max 128 characters)')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        if not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in v):
            raise ValueError('Password must contain at least one special character')
        return v


class UserProfile(BaseModel):
    """User profile information."""
    email: EmailStr
    name: Optional[str] = None
    picture: Optional[str] = None
    google_id: Optional[str] = None
