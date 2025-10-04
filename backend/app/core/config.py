from pydantic_settings import BaseSettings
from typing import List, Union
import os
import secrets
from pathlib import Path
from pydantic import model_validator


def _generate_secret_key() -> str:
    """Generate a secure secret key if none is provided"""
    return secrets.token_urlsafe(32)


class Settings(BaseSettings):
    APP_NAME: str = "@Torrent"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    API_V1_STR: str = "/api/v1"

    # Security - Generate secure defaults
    SECRET_KEY: str = os.getenv("SECRET_KEY", _generate_secret_key())
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Database
    DATABASE_URL: str = "sqlite:///./aTorrent.db"

    # CORS settings
    ALLOWED_ORIGINS: List[str] = []

    # Trusted hosts
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1", "*"]

    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = 8000

    # Torrent settings
    DOWNLOAD_PATH: str = "./downloads"
    MAX_DOWNLOAD_SPEED: int = 0  # 0 for unlimited (bytes/sec)
    MAX_UPLOAD_SPEED: int = 0  # 0 for unlimited (bytes/sec)
    MAX_CONNECTIONS: int = 200
    MAX_TORRENTS: int = 100

    # External API Keys
    DEFAULT_TMDB_API_KEY: str = os.getenv("DEFAULT_TMDB_API_KEY", "")

    # Rate limiting
    RATE_LIMIT_REQUESTS: int = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
    RATE_LIMIT_WINDOW: int = int(os.getenv("RATE_LIMIT_WINDOW", "3600"))  # 1 hour

    # Security
    SECURE_COOKIES: bool = os.getenv("SECURE_COOKIES", "false").lower() == "true"
    COOKIE_SAMESITE: str = os.getenv("COOKIE_SAMESITE", "lax")

    # WebSocket
    WEBSOCKET_PING_INTERVAL: int = int(os.getenv("WEBSOCKET_PING_INTERVAL", "30"))

    # Torrent service constants
    TORRENT_UPDATE_INTERVAL: float = float(os.getenv("TORRENT_UPDATE_INTERVAL", "0.2"))
    ALERT_PROCESSING_INTERVAL: float = float(os.getenv("ALERT_PROCESSING_INTERVAL", "0.2"))

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/atorrent.log"

    # Production Settings
    ENABLE_METRICS: bool = False
    ENABLE_HEALTH_CHECKS: bool = True

    # CORS Settings
    DEVELOPMENT_MODE: bool = False
    FRONTEND_URL: str = "http://localhost:3000"

    @model_validator(mode='after')
    def set_allowed_origins(self):
        if self.DEVELOPMENT_MODE:
            self.ALLOWED_ORIGINS = ["*"]
        else:
            self.ALLOWED_ORIGINS = [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:8000",
                "http://127.0.0.1:8000",
                self.FRONTEND_URL,
            ]
        return self

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def absolute_download_path(self) -> Path:
        """Get absolute path for downloads directory"""
        path = Path(self.DOWNLOAD_PATH)
        if not path.is_absolute():
            path = Path.cwd() / path
        return path


# Create global settings instance
settings = Settings()


def ensure_downloads_dir() -> Path:
    """Ensure downloads directory exists and return path"""
    downloads_path = settings.absolute_download_path
    downloads_path.mkdir(parents=True, exist_ok=True)
    return downloads_path
