"""Custom exceptions for the application."""

from typing import Optional, Dict, Any


class TorrentServiceError(Exception):
    """Base exception for torrent service errors."""
    
    def __init__(self, message: str, error_code: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class TorrentNotFoundError(TorrentServiceError):
    """Raised when a torrent is not found."""
    
    def __init__(self, torrent_id: int):
        super().__init__(
            message=f"Torrent with ID {torrent_id} not found",
            error_code="TORRENT_NOT_FOUND",
            details={"torrent_id": torrent_id}
        )


class TorrentAlreadyExistsError(TorrentServiceError):
    """Raised when trying to add a torrent that already exists."""
    
    def __init__(self, info_hash: str):
        super().__init__(
            message=f"Torrent with hash {info_hash} already exists",
            error_code="TORRENT_ALREADY_EXISTS",
            details={"info_hash": info_hash}
        )


class TorrentServiceNotInitializedError(TorrentServiceError):
    """Raised when torrent service is not initialized."""
    
    def __init__(self):
        super().__init__(
            message="Torrent service is not initialized",
            error_code="SERVICE_NOT_INITIALIZED"
        )


class InvalidTorrentFileError(TorrentServiceError):
    """Raised when torrent file is invalid."""
    
    def __init__(self, reason: str):
        super().__init__(
            message=f"Invalid torrent file: {reason}",
            error_code="INVALID_TORRENT_FILE",
            details={"reason": reason}
        )


class DatabaseError(TorrentServiceError):
    """Raised when database operations fail."""
    
    def __init__(self, operation: str, reason: str):
        super().__init__(
            message=f"Database {operation} failed: {reason}",
            error_code="DATABASE_ERROR",
            details={"operation": operation, "reason": reason}
        )


class ConfigurationError(TorrentServiceError):
    """Raised when configuration is invalid."""
    
    def __init__(self, setting: str, reason: str):
        super().__init__(
            message=f"Configuration error for {setting}: {reason}",
            error_code="CONFIGURATION_ERROR",
            details={"setting": setting, "reason": reason}
        )

