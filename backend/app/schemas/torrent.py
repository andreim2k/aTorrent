from pydantic import BaseModel, validator
from typing import Optional, List, Any, Dict
from datetime import datetime


class TorrentBase(BaseModel):
    name: str
    download_path: Optional[str] = None
    priority: int = 1
    sequential_download: bool = False
    label: Optional[str] = None
    category: Optional[str] = None


class TorrentCreate(BaseModel):
    torrent_file: str
    auto_start: bool = True
    sequential_download: bool = False
    priority: int = 1

    @validator("torrent_file")
    def validate_torrent_file(cls, v):
        # Only allow base64 encoded torrent file content
        if len(v) > 100:  # Basic length check for base64 content
            try:
                import base64

                # Try to decode to validate it's proper base64
                base64.b64decode(v)
                return v
            except Exception:
                raise ValueError("Invalid base64 torrent file content")
        else:
            raise ValueError("Must be base64 encoded torrent file content")
        return v


class TorrentUpdate(BaseModel):
    priority: Optional[int] = None
    sequential_download: Optional[bool] = None
    label: Optional[str] = None
    category: Optional[str] = None
    download_path: Optional[str] = None


class TorrentStatus(BaseModel):
    id: int
    user_id: Optional[int] = None
    info_hash: Optional[str] = None
    name: str
    status: str
    progress: float
    total_size: int
    downloaded: int
    uploaded: int
    download_speed: float
    upload_speed: float
    peers_connected: int
    peers_total: Optional[int] = None
    seeds_connected: int
    seeds_total: Optional[int] = None
    ratio: float
    availability: Optional[float] = None
    eta: int
    time_active: Optional[int] = None
    download_path: Optional[str]
    priority: int
    sequential_download: Optional[bool] = None
    file_count: Optional[int] = None
    files_info: Optional[List[Dict[str, Any]]] = None
    label: Optional[str]
    category: Optional[str]
    tags: Optional[List[str]] = None
    created_at: datetime
    updated_at: Optional[datetime]
    completed_at: Optional[datetime]
    started_at: Optional[datetime]
    files: Optional[List[Dict[str, Any]]] = None
    trackers: Optional[List[Dict[str, Any]]] = None

    class Config:
        from_attributes = True


class Torrent(TorrentStatus):
    pass


class TorrentResponse(TorrentStatus):
    """Response model for torrent operations"""

    pass


class TorrentListItem(BaseModel):
    id: int
    name: str
    status: str
    progress: float
    total_size: int
    downloaded: int
    uploaded: int
    download_speed: float
    upload_speed: float
    peers_connected: int
    seeds_connected: int
    ratio: float
    eta: int
    priority: int
    label: Optional[str]
    category: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class TorrentStats(BaseModel):
    total_torrents: int
    active_torrents: int
    downloading: int
    seeding: int
    paused: int
    completed: int
    total_download_speed: float
    total_upload_speed: float
    total_downloaded: int
    total_uploaded: int


class BulkTorrentOperation(BaseModel):
    """Schema for bulk torrent operations"""

    torrent_ids: List[int]

    @validator("torrent_ids")
    def validate_torrent_ids(cls, v):
        if not v or len(v) == 0:
            raise ValueError("At least one torrent ID is required")
        return v


class SessionStats(BaseModel):
    port: int
    num_peers: int
    dht_nodes: int
    libtorrent_version: str
    uptime: int
    download_rate: int = 0
    upload_rate: int = 0
    payload_download_rate: int = 0
    payload_upload_rate: int = 0
