from pydantic import BaseModel, validator
from typing import Optional, Dict, Any
from datetime import datetime

class AppSettingsBase(BaseModel):
    theme: str = "dark"
    language: str = "en"
    timezone: str = "UTC"
    tmdb_api_key: str = ""
    default_download_path: Optional[str] = None
    max_download_speed: int = 0
    max_upload_speed: int = 0
    max_active_downloads: int = 5
    max_connections_per_torrent: int = 50
    auto_start_downloads: bool = True
    sequential_download: bool = False
    auto_manage_torrents: bool = True
    delete_torrent_files: bool = False
    seed_ratio_limit: int = 200
    seed_time_limit: int = 0
    stop_seeding_at_ratio: bool = False
    enable_notifications: bool = True
    notify_on_download_complete: bool = True
    notify_on_torrent_added: bool = False
    notify_on_errors: bool = True
    enable_dht: bool = True
    enable_pex: bool = True
    enable_lsd: bool = True
    anonymous_mode: bool = False
    schedule_enabled: bool = False
    schedule_settings: Optional[Dict[str, Any]] = None
    connection_port: int = 6881
    use_random_port: bool = True
    upnp_enabled: bool = True
    natpmp_enabled: bool = True
    require_encryption: bool = False
    allow_legacy_connections: bool = True
    web_ui_port: int = 8080
    web_ui_username: Optional[str] = None
    enable_csrf_protection: bool = True
    custom_settings: Optional[Dict[str, Any]] = None

class AppSettingsUpdate(BaseModel):
    theme: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    tmdb_api_key: Optional[str] = None
    default_download_path: Optional[str] = None
    max_download_speed: Optional[int] = None
    max_upload_speed: Optional[int] = None
    max_active_downloads: Optional[int] = None
    max_connections_per_torrent: Optional[int] = None
    auto_start_downloads: Optional[bool] = None
    sequential_download: Optional[bool] = None
    auto_manage_torrents: Optional[bool] = None
    delete_torrent_files: Optional[bool] = None
    seed_ratio_limit: Optional[int] = None
    seed_time_limit: Optional[int] = None
    stop_seeding_at_ratio: Optional[bool] = None
    enable_notifications: Optional[bool] = None
    notify_on_download_complete: Optional[bool] = None
    notify_on_torrent_added: Optional[bool] = None
    notify_on_errors: Optional[bool] = None
    enable_dht: Optional[bool] = None
    enable_pex: Optional[bool] = None
    enable_lsd: Optional[bool] = None
    anonymous_mode: Optional[bool] = None
    schedule_enabled: Optional[bool] = None
    schedule_settings: Optional[Dict[str, Any]] = None
    connection_port: Optional[int] = None
    use_random_port: Optional[bool] = None
    upnp_enabled: Optional[bool] = None
    natpmp_enabled: Optional[bool] = None
    require_encryption: Optional[bool] = None
    allow_legacy_connections: Optional[bool] = None
    web_ui_port: Optional[int] = None
    web_ui_username: Optional[str] = None
    enable_csrf_protection: Optional[bool] = None
    custom_settings: Optional[Dict[str, Any]] = None
    
    @validator('theme')
    def validate_theme(cls, v):
        if v and v not in ['dark', 'light', 'auto']:
            raise ValueError('Theme must be dark, light, or auto')
        return v
    
    @validator('max_download_speed', 'max_upload_speed')
    def validate_speeds(cls, v):
        if v and v < 0:
            raise ValueError('Speed limits must be 0 or positive')
        return v
    
    @validator('max_active_downloads')
    def validate_max_downloads(cls, v):
        if v and not 1 <= v <= 100:
            raise ValueError('Max active downloads must be between 1 and 100')
        return v
    
    @validator('connection_port', 'web_ui_port')
    def validate_ports(cls, v):
        if v and not 1024 <= v <= 65535:
            raise ValueError('Port must be between 1024 and 65535')
        return v

class AppSettings(AppSettingsBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AppSettingsResponse(BaseModel):
    """Simplified settings response for frontend"""
    theme: str
    language: str
    timezone: str
    tmdb_api_key: str
    default_download_path: Optional[str] = None
    max_download_speed: int
    max_upload_speed: int
    max_active_downloads: int
    auto_start_downloads: bool
    enable_notifications: bool
    notify_on_download_complete: bool
    enable_dht: bool
    connection_port: int
    use_random_port: bool
    
    class Config:
        from_attributes = True
