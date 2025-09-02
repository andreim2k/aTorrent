from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
    Float,
    ForeignKey,
    Text,
    BigInteger,
    JSON,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class Torrent(Base):
    __tablename__ = "torrents"

    id = Column(Integer, primary_key=True, index=True)
    # Removed user_id - single-user application

    # Torrent identification
    info_hash = Column(String(40), unique=True, index=True, nullable=False)
    name = Column(String(500), nullable=False)
    magnet_link = Column(Text)
    torrent_file_path = Column(String(500))

    # Status and progress
    status = Column(
        String(20), default="paused", index=True
    )  # downloading, seeding, paused, error, completed, checking
    progress = Column(Float, default=0.0)  # 0.0 to 1.0

    # Size information (in bytes)
    total_size = Column(BigInteger, default=0)
    downloaded = Column(BigInteger, default=0)
    uploaded = Column(BigInteger, default=0)

    # Speed information (bytes/sec)
    download_speed = Column(Float, default=0.0)
    upload_speed = Column(Float, default=0.0)

    # Peer information
    peers_connected = Column(Integer, default=0)
    peers_total = Column(Integer, default=0)
    seeds_connected = Column(Integer, default=0)
    seeds_total = Column(Integer, default=0)

    # Ratio and sharing
    ratio = Column(Float, default=0.0)
    availability = Column(Float, default=0.0)

    # Time information
    eta = Column(Integer, default=0)  # Estimated time remaining in seconds
    time_active = Column(Integer, default=0)  # Time active in seconds

    # Settings
    download_path = Column(String(500))
    priority = Column(Integer, default=1)  # 0=low, 1=normal, 2=high
    sequential_download = Column(Boolean, default=False)

    # File information
    file_count = Column(Integer, default=0)
    files_info = Column(JSON)  # Store file list and individual file info

    # Labels and categories
    label = Column(String(100))
    category = Column(String(100))
    tags = Column(JSON)  # Array of tags

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships removed for single-user app

    def __repr__(self):
        return f"<Torrent(id={self.id}, name='{self.name[:50]}...', status='{self.status}', progress={self.progress:.2%})>"

    @property
    def progress_percentage(self) -> float:
        """Get progress as percentage (0-100)"""
        return self.progress * 100

    @property
    def remaining_size(self) -> int:
        """Get remaining bytes to download"""
        return max(0, self.total_size - self.downloaded)

    @property
    def is_complete(self) -> bool:
        """Check if torrent is complete"""
        return self.progress >= 1.0 or self.status == "completed"

    @property
    def is_active(self) -> bool:
        """Check if torrent is actively downloading or seeding"""
        return self.status in ["downloading", "seeding"]
