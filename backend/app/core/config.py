from pydantic_settings import BaseSettings
from pydantic import Field, validator
from typing import List, Union, Optional
import os
import secrets
import socket
from pathlib import Path


def _generate_secret_key() -> str:
    """Generate a secure secret key if none is provided"""
    return secrets.token_urlsafe(32)


class Settings(BaseSettings):
    APP_NAME: str = Field(default="@Torrent", description="Application name")
    APP_VERSION: str = Field(default="1.0.0", description="Application version")
    DEBUG: bool = Field(default=False, description="Debug mode")
    DEVELOPMENT_MODE: bool = Field(default=False, description="Development mode (allows wildcard CORS)")
    API_V1_STR: str = Field(default="/api/v1", description="API version string")

    # Security - Generate secure defaults
    SECRET_KEY: str = Field(default_factory=_generate_secret_key, description="Secret key for JWT")
    ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, ge=1, le=1440, description="Token expiration in minutes")
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = Field(default="", description="Google OAuth client ID")
    GOOGLE_CLIENT_SECRET: str = Field(default="", description="Google OAuth client secret")
    GOOGLE_REDIRECT_URI: str = Field(default="http://localhost:3000/auth/callback", description="Google OAuth redirect URI")
    ALLOWED_GOOGLE_DOMAINS: List[str] = Field(default_factory=list, description="Allowed Google email domains (empty = allow all)")

    # Database
    DATABASE_URL: str = Field(default="sqlite:///./aTorrent.db", description="Database connection URL")

    # CORS - Secure configuration
    ALLOWED_ORIGINS: List[str] = Field(
        default_factory=lambda: [
            os.getenv("FRONTEND_URL", "http://localhost:3000"),
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            f"http://{socket.gethostname()}:3000",
            f"http://{socket.gethostname()}:8000",
        ],
        description="Allowed CORS origins"
    )

    # Trusted hosts
    ALLOWED_HOSTS: List[str] = Field(default=["localhost", "127.0.0.1", "*"], description="Trusted hosts")

    # Server
    HOST: str = Field(default="0.0.0.0", description="Server host")
    PORT: int = Field(default=8000, ge=1, le=65535, description="Server port")

    # Torrent settings
    DOWNLOAD_PATH: str = Field(default="./downloads", description="Default download path")
    MAX_DOWNLOAD_SPEED: int = Field(default=0, ge=0, description="Max download speed in bytes/sec (0=unlimited)")
    MAX_UPLOAD_SPEED: int = Field(default=0, ge=0, description="Max upload speed in bytes/sec (0=unlimited)")
    MAX_CONNECTIONS: int = Field(default=200, ge=1, le=1000, description="Max connections")
    MAX_TORRENTS: int = Field(default=100, ge=1, le=1000, description="Max torrents")

    # External API Keys
    DEFAULT_TMDB_API_KEY: str = Field(default="", description="TMDB API key")

    # Rate limiting
    RATE_LIMIT_REQUESTS: int = Field(default=100, ge=1, description="Rate limit requests per window")
    RATE_LIMIT_WINDOW: int = Field(default=3600, ge=1, description="Rate limit window in seconds")

    # Security
    SECURE_COOKIES: bool = Field(default=False, description="Use secure cookies")
    COOKIE_SAMESITE: str = Field(default="lax", description="Cookie SameSite policy")

    # WebSocket
    WEBSOCKET_PING_INTERVAL: int = Field(default=30, ge=5, le=300, description="WebSocket ping interval in seconds")

    # Torrent service constants
    TORRENT_UPDATE_INTERVAL: float = Field(default=0.2, ge=0.1, le=5.0, description="Torrent update interval in seconds")
    ALERT_PROCESSING_INTERVAL: float = Field(default=0.2, ge=0.1, le=5.0, description="Alert processing interval in seconds")

    class Config:
        env_file = ".env"
        case_sensitive = True

    @validator('DOWNLOAD_PATH')
    def validate_download_path(cls, v):
        """Validate download path"""
        path = Path(v)
        if not path.is_absolute():
            path = Path.cwd() / path
        # Ensure directory exists
        path.mkdir(parents=True, exist_ok=True)
        return str(path)

    @validator('ALLOWED_ORIGINS')
    def validate_cors_origins(cls, v, values):
        """Validate CORS origins - never allow wildcard in production."""
        # Get development mode from the model values being validated
        is_dev = values.get('DEVELOPMENT_MODE', False)
        
        if "*" in v:
            if not is_dev:
                raise ValueError("Wildcard CORS origin not allowed in production")
            if len(v) > 1:
                raise ValueError("Cannot specify '*' with other origins")
        
        # Ensure only valid URLs
        for origin in v:
            if origin != "*" and not origin.startswith(("http://", "https://")):
                raise ValueError(f"Invalid origin URL: {origin}")
        
        return v

    @validator('COOKIE_SAMESITE')
    def validate_cookie_samesite(cls, v):
        """Validate cookie SameSite policy"""
        allowed_values = ['strict', 'lax', 'none']
        if v not in allowed_values:
            raise ValueError(f"COOKIE_SAMESITE must be one of {allowed_values}")
        return v

    @property
    def absolute_download_path(self) -> Path:
        """Get absolute path for downloads directory"""
        return Path(self.DOWNLOAD_PATH)


# Create global settings instance
settings = Settings()


def ensure_downloads_dir() -> Path:
    """Ensure downloads directory exists and return path"""
    downloads_path = settings.absolute_download_path
    downloads_path.mkdir(parents=True, exist_ok=True)
    return downloads_path
