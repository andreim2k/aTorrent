from pydantic_settings import BaseSettings
from typing import List, Union
import os
import secrets
from pathlib import Path

def _generate_secret_key() -> str:
    """Generate a secure secret key if none is provided"""
    return secrets.token_urlsafe(32)

class Settings(BaseSettings):
    APP_NAME: str = "aTorrent"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    
    # Security - Generate secure defaults
    SECRET_KEY: str = os.getenv("SECRET_KEY", _generate_secret_key())
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    DATABASE_URL: str = "sqlite:///./atorrent.db"
    
    # CORS - Allow environment override
    ALLOWED_ORIGINS: List[str] = [
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
        "http://127.0.0.1:3000"
    ]
    
    # Trusted hosts
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1", "*"]
    
    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = 8000
    
    # Torrent settings
    DOWNLOAD_PATH: str = "./downloads"
    MAX_DOWNLOAD_SPEED: int = 0  # 0 for unlimited (bytes/sec)
    MAX_UPLOAD_SPEED: int = 0    # 0 for unlimited (bytes/sec)
    MAX_CONNECTIONS: int = 200
    MAX_TORRENTS: int = 100
    
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
