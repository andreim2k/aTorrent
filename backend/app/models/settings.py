from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
    Text,
    ForeignKey,
    JSON,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class AppSettings(Base):
    __tablename__ = "app_settings"

    id = Column(Integer, primary_key=True, index=True)
    # Removed user_id - single-user application

    # Authentication
    app_password_hash = Column(String(255), nullable=False)

    # UI Settings
    theme = Column(String(20), default="dark")  # dark, light, auto
    language = Column(String(10), default="en")  # ISO language code
    timezone = Column(String(50), default="UTC")

    # API Keys
    tmdb_api_key = Column(String(255), default="")  # TMDB API key for movie information

    # Download Settings
    default_download_path = Column(String(500))
    max_download_speed = Column(Integer, default=0)  # 0 for unlimited (bytes/sec)
    max_upload_speed = Column(Integer, default=0)  # 0 for unlimited (bytes/sec)
    max_active_downloads = Column(Integer, default=5)
    max_connections_per_torrent = Column(Integer, default=50)

    # Behavior Settings
    auto_start_downloads = Column(Boolean, default=True)
    sequential_download = Column(Boolean, default=False)
    auto_manage_torrents = Column(Boolean, default=True)
    delete_torrent_files = Column(Boolean, default=False)

    # Seeding Settings
    seed_ratio_limit = Column(Integer, default=200)  # 200% = 2.0 ratio
    seed_time_limit = Column(Integer, default=0)  # 0 for unlimited (minutes)
    stop_seeding_at_ratio = Column(Boolean, default=False)

    # Notification Settings
    enable_notifications = Column(Boolean, default=True)
    notify_on_download_complete = Column(Boolean, default=True)
    notify_on_torrent_added = Column(Boolean, default=False)
    notify_on_errors = Column(Boolean, default=True)

    # Privacy Settings
    enable_dht = Column(Boolean, default=True)
    enable_pex = Column(Boolean, default=True)
    enable_lsd = Column(Boolean, default=True)
    anonymous_mode = Column(Boolean, default=False)

    # Bandwidth Settings
    schedule_enabled = Column(Boolean, default=False)
    schedule_settings = Column(JSON)  # Store schedule configuration

    # Advanced Settings
    connection_port = Column(Integer, default=6881)
    use_random_port = Column(Boolean, default=True)
    upnp_enabled = Column(Boolean, default=True)
    natpmp_enabled = Column(Boolean, default=True)

    # Security Settings
    require_encryption = Column(Boolean, default=False)
    allow_legacy_connections = Column(Boolean, default=True)

    # Web UI Settings
    web_ui_port = Column(Integer, default=8080)
    web_ui_username = Column(String(100))
    web_ui_password_hash = Column(String(255))
    enable_csrf_protection = Column(Boolean, default=True)

    # Custom Settings (JSON for extensibility)
    custom_settings = Column(JSON)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships removed for single-user app

    def __repr__(self):
        return f"<AppSettings(theme='{self.theme}', language='{self.language}')>"

    @property
    def max_download_speed_kb(self) -> float:
        """Get max download speed in KB/s"""
        return self.max_download_speed / 1024 if self.max_download_speed > 0 else 0

    @property
    def max_upload_speed_kb(self) -> float:
        """Get max upload speed in KB/s"""
        return self.max_upload_speed / 1024 if self.max_upload_speed > 0 else 0

    @property
    def seed_ratio_decimal(self) -> float:
        """Get seed ratio as decimal (e.g., 2.0 for 200%)"""
        return self.seed_ratio_limit / 100
