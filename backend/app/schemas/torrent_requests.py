"""Torrent request validation schemas."""

from pydantic import BaseModel, validator, Field
from typing import Optional
import base64
import logging

logger = logging.getLogger(__name__)


class TorrentAddRequest(BaseModel):
    """Request schema for adding a new torrent."""
    
    torrent_file: str = Field(..., description="Base64 encoded torrent file content")
    auto_start: bool = Field(True, description="Whether to start the torrent automatically")
    
    @validator('torrent_file')
    def validate_torrent_file(cls, v):
        """Validate that the torrent file is valid base64."""
        if not v:
            raise ValueError("Torrent file content is required")
        
        try:
            # Try to decode base64
            decoded = base64.b64decode(v)
            
            # Basic validation - check if it looks like a torrent file
            if not decoded.startswith(b'd'):
                raise ValueError("Invalid torrent file format")
                
            return v
        except Exception as e:
            logger.error(f"Invalid torrent file: {e}")
            raise ValueError(f"Invalid torrent file: must be valid base64 encoded .torrent file")


class TorrentControlRequest(BaseModel):
    """Request schema for torrent control operations."""
    
    torrent_id: int = Field(..., gt=0, description="ID of the torrent to control")
    

class TorrentRemoveRequest(BaseModel):
    """Request schema for removing a torrent."""
    
    torrent_id: int = Field(..., gt=0, description="ID of the torrent to remove")
    delete_files: bool = Field(False, description="Whether to delete the downloaded files")


class TorrentUpdateRequest(BaseModel):
    """Request schema for updating torrent properties."""
    
    torrent_id: int = Field(..., gt=0, description="ID of the torrent to update")
    priority: Optional[int] = Field(None, ge=0, le=7, description="Torrent priority (0-7)")
    sequential_download: Optional[bool] = Field(None, description="Enable sequential download")
    
    @validator('priority')
    def validate_priority(cls, v):
        """Validate torrent priority."""
        if v is not None and not (0 <= v <= 7):
            raise ValueError("Priority must be between 0 and 7")
        return v


class BulkTorrentRequest(BaseModel):
    """Request schema for bulk torrent operations."""
    
    torrent_ids: list[int] = Field(..., min_items=1, description="List of torrent IDs")
    action: str = Field(..., description="Action to perform: pause, resume, remove")
    delete_files: bool = Field(False, description="For remove action: whether to delete files")
    
    @validator('torrent_ids')
    def validate_torrent_ids(cls, v):
        """Validate torrent IDs."""
        if not v:
            raise ValueError("At least one torrent ID is required")
        
        if len(v) > 100:  # Prevent excessive bulk operations
            raise ValueError("Maximum 100 torrents can be processed at once")
        
        for torrent_id in v:
            if not isinstance(torrent_id, int) or torrent_id <= 0:
                raise ValueError(f"Invalid torrent ID: {torrent_id}")
        
        return v
    
    @validator('action')
    def validate_action(cls, v):
        """Validate bulk action."""
        allowed_actions = ['pause', 'resume', 'remove', 'recheck']
        if v not in allowed_actions:
            raise ValueError(f"Action must be one of: {', '.join(allowed_actions)}")
        return v
