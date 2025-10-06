"""Standardized response models for API endpoints."""

from pydantic import BaseModel
from typing import Any, Dict, List, Optional, Union
from datetime import datetime


class BaseResponse(BaseModel):
    """Base response model with common fields."""
    success: bool = True
    message: Optional[str] = None
    timestamp: datetime = datetime.now()


class ErrorResponse(BaseResponse):
    """Standardized error response."""
    success: bool = False
    error_code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class SuccessResponse(BaseResponse):
    """Standardized success response."""
    data: Optional[Any] = None


class PaginatedResponse(BaseResponse):
    """Paginated response model."""
    data: List[Any]
    total: int
    page: int
    per_page: int
    total_pages: int


class TorrentOperationResponse(BaseResponse):
    """Response for torrent operations."""
    torrent_id: int
    action: str
    status: str
    details: Optional[Dict[str, Any]] = None


class BulkOperationResponse(BaseResponse):
    """Response for bulk operations."""
    results: List[Dict[str, Any]]
    total_processed: int
    successful: int
    failed: int


class HealthCheckResponse(BaseResponse):
    """Health check response."""
    status: str
    components: Dict[str, str]
    uptime: Optional[int] = None
    version: Optional[str] = None


class StatsResponse(BaseResponse):
    """Statistics response."""
    stats: Dict[str, Any]
    period: Optional[str] = None
    last_updated: Optional[datetime] = None

