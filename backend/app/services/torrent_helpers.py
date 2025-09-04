"""Helper functions for torrent service operations."""

import libtorrent as lt
import os
import logging
from typing import Dict, Any, Optional
from pathlib import Path

from app.core.constants import (
    DEFAULT_MAX_ETA_SECONDS,
    TORRENT_STATUS_PAUSED,
    TORRENT_STATUS_DOWNLOADING,
    TORRENT_STATUS_SEEDING,
    TORRENT_STATUS_COMPLETED,
    TORRENT_STATUS_CHECKING,
    TORRENT_STATUS_ALLOCATING,
)

logger = logging.getLogger(__name__)


class TorrentFileHandler:
    """Handles torrent file operations and sanitization."""
    
    @staticmethod
    def sanitize_name(name: str) -> str:
        """Remove commas and replace spaces with dots in filename/directory name."""
        if not name:
            return name
        # Remove commas and replace spaces with dots
        sanitized = name.replace(",", "").replace(" ", ".")
        return sanitized

    @staticmethod
    def sanitize_file_paths(handle) -> None:
        """Sanitize file paths using libtorrent handle after torrent is added."""
        try:
            if not handle or not handle.is_valid():
                return

            torrent_info = handle.torrent_file()
            if not torrent_info:
                return

            # Rename individual files
            for file_index in range(torrent_info.num_files()):
                file_info = torrent_info.file_at(file_index)
                original_path = file_info.path

                # Split path into components and sanitize each
                path_parts = original_path.split("/")
                sanitized_parts = []

                for part in path_parts:
                    if part:  # Skip empty parts
                        sanitized_part = TorrentFileHandler.sanitize_name(part)
                        sanitized_parts.append(sanitized_part)

                if sanitized_parts:
                    sanitized_path = "/".join(sanitized_parts)

                    # Only rename if the path has changed
                    if sanitized_path != original_path:
                        handle.rename_file(file_index, sanitized_path)
                        logger.debug(f"Renamed file: {original_path} -> {sanitized_path}")

        except Exception as e:
            logger.warning(f"Failed to sanitize file paths: {e}")


class TorrentStatusMapper:
    """Maps libtorrent status to application status."""
    
    @staticmethod
    def map_status(lt_status) -> str:
        """Map libtorrent status to application status string."""
        if lt_status.paused:
            return TORRENT_STATUS_PAUSED
        elif lt_status.state == lt.torrent_status.checking_files:
            return TORRENT_STATUS_CHECKING
        elif lt_status.state == lt.torrent_status.checking_resume_data:
            return TORRENT_STATUS_CHECKING
        elif lt_status.state == lt.torrent_status.downloading:
            return TORRENT_STATUS_DOWNLOADING
        elif lt_status.state == lt.torrent_status.seeding:
            return TORRENT_STATUS_SEEDING
        elif lt_status.state == lt.torrent_status.finished:
            return TORRENT_STATUS_COMPLETED
        elif lt_status.state == lt.torrent_status.allocating:
            return TORRENT_STATUS_ALLOCATING
        else:
            return TORRENT_STATUS_DOWNLOADING


class TorrentCalculations:
    """Utility functions for torrent calculations."""
    
    @staticmethod
    def calculate_eta(total_size: int, downloaded: int, download_speed: float) -> int:
        """Calculate ETA (Estimated Time of Arrival) in seconds."""
        try:
            if download_speed <= 0 or total_size <= 0 or downloaded >= total_size:
                return 0  # No ETA if no download speed, no size, or already complete

            remaining_bytes = total_size - downloaded
            eta_seconds = remaining_bytes / download_speed

            # Cap ETA at a reasonable maximum
            return min(int(eta_seconds), DEFAULT_MAX_ETA_SECONDS)

        except (ZeroDivisionError, ValueError):
            return 0
    
    @staticmethod
    def calculate_ratio(downloaded: int, uploaded: int) -> float:
        """Calculate upload/download ratio."""
        if downloaded <= 0:
            return 0.0
        return uploaded / downloaded


class TorrentParameterBuilder:
    """Builds libtorrent add_torrent_params objects."""
    
    @staticmethod
    def build_from_file_content(torrent_data: bytes, save_path: str, auto_start: bool) -> lt.add_torrent_params:
        """Build torrent parameters from torrent file content."""
        params = lt.add_torrent_params()
        
        # Set torrent info
        info = lt.torrent_info(torrent_data)
        params.ti = info
        
        # Set save path
        params.save_path = save_path
        
        # Set flags based on auto_start parameter
        if auto_start:
            # Start downloading immediately - use auto_managed for queue management
            params.flags |= lt.torrent_flags.auto_managed
        else:
            # Start paused and disable auto-management to prevent automatic resuming
            params.flags |= lt.torrent_flags.paused
        
        return params


class SessionConfigurer:
    """Configures libtorrent session settings."""
    
    @staticmethod
    def configure_basic_settings(session: lt.session) -> None:
        """Configure basic session settings."""
        from app.core.constants import LIBTORRENT_SESSION_FLAGS
        
        settings = session.get_settings()
        
        # Apply basic configuration
        for key, value in LIBTORRENT_SESSION_FLAGS.items():
            settings[key] = value
        
        session.apply_settings(settings)
    
    @staticmethod
    def apply_user_settings(session: lt.session, user_settings) -> None:
        """Apply user settings from database to libtorrent session."""
        try:
            if user_settings and session:
                # Get current session settings
                lt_settings = session.get_settings()
                
                # Apply user settings to libtorrent
                lt_settings["active_downloads"] = user_settings.max_active_downloads or 5
                lt_settings["download_rate_limit"] = user_settings.max_download_speed or 0
                lt_settings["upload_rate_limit"] = user_settings.max_upload_speed or 0
                
                # Apply the updated settings
                session.apply_settings(lt_settings)
                
                logger.info(f"Applied user settings: max_active_downloads={user_settings.max_active_downloads}")
        except Exception as e:
            logger.warning(f"Failed to apply user settings to session: {e}")
    
    @staticmethod
    def configure_dht_and_services(session: lt.session) -> None:
        """Configure DHT and other services."""
        from app.core.constants import DHT_BOOTSTRAP_NODES
        
        # Add DHT bootstrap nodes
        for host, port in DHT_BOOTSTRAP_NODES:
            session.add_dht_router(host, port)
        
        # Start services
        session.start_dht()
        session.start_lsd()
        session.start_upnp()
        session.start_natpmp()
