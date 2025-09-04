"""Improved torrent service with better structure and error handling."""

import libtorrent as lt
import os
import asyncio
import logging
import time
import base64
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path

from app.core.config import settings
from app.core.constants import (
    TORRENT_UPDATE_INTERVAL,
    ALERT_PROCESSING_INTERVAL,
    ERROR_RETRY_DELAY,
    TORRENT_STATUS_PAUSED,
    TORRENT_STATUS_DOWNLOADING,
    TORRENT_STATUS_SEEDING,
)
from app.db.utils import get_db_context, DatabaseManager
from app.models.torrent import Torrent
from app.models.settings import AppSettings
from app.services.torrent_helpers import (
    TorrentFileHandler,
    TorrentStatusMapper, 
    TorrentCalculations,
    TorrentParameterBuilder,
    SessionConfigurer,
)

logger = logging.getLogger(__name__)


class ImprovedTorrentService:
    """Improved torrent service with better structure and error handling."""

    def __init__(self, downloads_path: str = None):
        self.downloads_path = downloads_path or getattr(settings, "DOWNLOADS_PATH", "./downloads")
        self.session = None
        self.handles: Dict[str, Any] = {}
        self.running = False
        self.startup_time = time.time()
        self._ensure_downloads_directory()

    def _ensure_downloads_directory(self) -> None:
        """Ensure downloads directory exists."""
        os.makedirs(self.downloads_path, exist_ok=True)

    async def initialize(self) -> None:
        """Initialize libtorrent session with proper configuration."""
        try:
            logger.info("Initializing torrent service...")
            
            # Create session
            self.session = lt.session()
            
            # Configure basic settings
            SessionConfigurer.configure_basic_settings(self.session)
            
            # Apply user settings from database
            self._apply_user_settings_from_db()
            
            # Configure DHT and services
            SessionConfigurer.configure_dht_and_services(self.session)
            
            # Set alert mask
            self.session.set_alert_mask(lt.alert.category_t.all_categories)
            
            self.running = True
            logger.info("TorrentService initialized successfully")
            
            # Start background tasks
            asyncio.create_task(self._process_alerts_loop())

        except Exception as e:
            logger.error(f"Failed to initialize TorrentService: {e}")
            raise

    def _apply_user_settings_from_db(self) -> None:
        """Apply user settings from database to session."""
        try:
            user_settings = DatabaseManager.get_single_record(
                AppSettings, 
                AppSettings.id.isnot(None)  # Get first record
            )
            SessionConfigurer.apply_user_settings(self.session, user_settings)
        except Exception as e:
            logger.warning(f"Failed to apply user settings: {e}")

    async def cleanup(self) -> None:
        """Clean up torrent service resources."""
        try:
            logger.info("Cleaning up torrent service...")
            self.running = False
            
            if self.session:
                # Pause all torrents
                for handle in self.handles.values():
                    try:
                        if hasattr(handle, "pause"):
                            handle.pause()
                    except Exception as e:
                        logger.warning(f"Error pausing torrent during cleanup: {e}")
                
                # Clear session without saving state to prevent torrent resurrection
                self.session = None
                logger.info("TorrentService cleaned up successfully")
                
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")

    async def _process_alerts_loop(self) -> None:
        """Process libtorrent alerts in a loop."""
        while self.running and self.session:
            try:
                alerts = self.session.pop_alerts()
                for alert in alerts:
                    await self._handle_alert(alert)
                await asyncio.sleep(ALERT_PROCESSING_INTERVAL)
            except Exception as e:
                logger.error(f"Error processing alerts: {e}")
                await asyncio.sleep(ERROR_RETRY_DELAY)

    async def _handle_alert(self, alert) -> None:
        """Handle individual libtorrent alert."""
        try:
            if isinstance(alert, lt.torrent_added_alert):
                logger.debug(f"Torrent added: {alert.torrent_name}")
            elif isinstance(alert, lt.torrent_finished_alert):
                logger.info(f"Torrent finished: {alert.torrent_name}")
            elif isinstance(alert, lt.torrent_error_alert):
                logger.error(f"Torrent error: {alert.what()}")
        except Exception as e:
            logger.error(f"Error handling alert: {e}")

    def _get_download_path(self) -> str:
        """Get download path from settings with fallback."""
        try:
            user_settings = DatabaseManager.get_single_record(
                AppSettings,
                AppSettings.id.isnot(None)
            )
            
            if user_settings and user_settings.default_download_path:
                download_path = user_settings.default_download_path
                os.makedirs(download_path, exist_ok=True)
                return download_path
                
        except Exception as e:
            logger.warning(f"Failed to get download path from settings: {e}")

        # Fallback to default
        os.makedirs(self.downloads_path, exist_ok=True)
        return self.downloads_path

    async def add_torrent(self, torrent_file: str, auto_start: bool = True) -> Dict[str, Any]:
        """Add a new torrent with improved error handling and structure."""
        try:
            if not self.session:
                return {"error": "Torrent service not initialized"}

            # Decode and validate torrent file
            torrent_data, torrent_name = self._process_torrent_file(torrent_file)
            if isinstance(torrent_data, dict) and "error" in torrent_data:
                return torrent_data

            # Check if torrent already exists
            info_hash = self._get_info_hash_from_data(torrent_data)
            if self._torrent_exists(info_hash):
                return {"error": "Torrent already exists"}

            # Build torrent parameters
            save_path = self._get_download_path()
            params = TorrentParameterBuilder.build_from_file_content(
                torrent_data, save_path, auto_start
            )

            # Add torrent to session
            handle = self._add_torrent_to_session(params, auto_start)
            if isinstance(handle, dict) and "error" in handle:
                return handle

            # Store handle and sanitize paths
            info_hash = str(handle.info_hash())
            self.handles[info_hash] = handle
            TorrentFileHandler.sanitize_file_paths(handle)

            # Save to database
            return await self._save_torrent_to_database(
                info_hash, torrent_name, save_path, auto_start
            )

        except Exception as e:
            logger.error(f"Error adding torrent: {e}")
            return {"error": str(e)}

    def _process_torrent_file(self, torrent_file: str) -> tuple:
        """Process and validate torrent file."""
        try:
            torrent_data = base64.b64decode(torrent_file)
            info = lt.torrent_info(torrent_data)
            torrent_name = TorrentFileHandler.sanitize_name(info.name())
            return torrent_data, torrent_name
        except Exception as e:
            return {"error": f"Invalid torrent file content: {str(e)}"}, None

    def _get_info_hash_from_data(self, torrent_data: bytes) -> str:
        """Extract info hash from torrent data."""
        try:
            info = lt.torrent_info(torrent_data)
            return str(info.info_hash())
        except Exception:
            return ""

    def _torrent_exists(self, info_hash: str) -> bool:
        """Check if torrent already exists in database."""
        existing = DatabaseManager.get_single_record(
            Torrent,
            Torrent.info_hash == info_hash
        )
        return existing is not None

    def _add_torrent_to_session(self, params, auto_start: bool):
        """Add torrent to libtorrent session."""
        try:
            handle = self.session.add_torrent(params)
            
            # Force recheck and set proper state
            handle.force_recheck()
            
            if auto_start:
                handle.resume()
            else:
                handle.pause()
            
            return handle
            
        except Exception as e:
            logger.error(f"Error adding torrent to session: {e}")
            return {"error": f"Failed to add torrent to session: {str(e)}"}

    async def _save_torrent_to_database(
        self, info_hash: str, torrent_name: str, save_path: str, auto_start: bool
    ) -> Dict[str, Any]:
        """Save torrent information to database."""
        try:
            initial_status = TORRENT_STATUS_DOWNLOADING if auto_start else TORRENT_STATUS_PAUSED
            
            db_torrent = Torrent(
                info_hash=info_hash,
                name=torrent_name,
                magnet_link=None,
                total_size=0,  # Will be updated when metadata is received
                downloaded=0,
                uploaded=0,
                download_speed=0,
                upload_speed=0,
                progress=0.0,
                status=initial_status,
                download_path=save_path,
            )
            
            created_torrent = DatabaseManager.create_record(db_torrent)
            
            return {
                "success": True,
                "torrent_id": created_torrent.id,
                "info_hash": info_hash,
                "name": torrent_name,
            }
            
        except Exception as e:
            logger.error(f"Error saving torrent to database: {e}")
            return {"error": f"Failed to save torrent: {str(e)}"}

    async def remove_torrent(self, torrent_id: int, delete_files: bool = False) -> Dict[str, Any]:
        """Remove torrent with improved error handling."""
        try:
            if not self.session:
                return {"error": "Torrent service not initialized"}

            # Get torrent from database
            torrent = DatabaseManager.get_single_record(
                Torrent,
                Torrent.id == torrent_id
            )
            
            if not torrent:
                return {"error": "Torrent not found"}

            info_hash = torrent.info_hash
            
            # Stop and remove from session
            removed_from_session = await self._remove_from_session(info_hash, delete_files)
            
            # Remove from database
            DatabaseManager.delete_record(Torrent, Torrent.id == torrent_id)
            
            # Manual file cleanup if needed
            if delete_files and not removed_from_session:
                await self._manual_file_cleanup(torrent)
            
            return {"success": True, "removed_from_session": removed_from_session}
            
        except Exception as e:
            logger.error(f"Error removing torrent: {e}")
            return {"error": str(e)}

    async def _remove_from_session(self, info_hash: str, delete_files: bool) -> bool:
        """Remove torrent from libtorrent session."""
        try:
            if info_hash not in self.handles:
                return False
                
            handle = self.handles[info_hash]
            
            # Pause and stop
            handle.pause()
            handle.unset_flags(lt.torrent_flags.auto_managed)
            handle.flush_cache()
            await asyncio.sleep(0.5)  # Allow operations to complete
            
            # Remove from session
            flags = lt.remove_flags_t.delete_files if delete_files else 0
            self.session.remove_torrent(handle, flags)
            
            # Remove from our tracking
            del self.handles[info_hash]
            return True
            
        except Exception as e:
            logger.error(f"Error removing torrent from session: {e}")
            # Still remove from tracking even if session removal failed
            if info_hash in self.handles:
                del self.handles[info_hash]
            return False

    async def _manual_file_cleanup(self, torrent) -> None:
        """Manually delete torrent files if session removal failed."""
        try:
            if not torrent.download_path:
                return
                
            import shutil
            from pathlib import Path
            
            base_path = Path(torrent.download_path)
            torrent_data_path = base_path / torrent.name
            
            if torrent_data_path.exists():
                if torrent_data_path.is_file():
                    torrent_data_path.unlink()
                else:
                    shutil.rmtree(torrent_data_path)
                logger.info(f"Manually deleted files for: {torrent.name}")
                    
        except Exception as e:
            logger.error(f"Error manually deleting files: {e}")

    async def get_all_torrents_status(self) -> List[Dict[str, Any]]:
        """Get status of all torrents with improved data handling."""
        try:
            torrents = DatabaseManager.get_all_records(Torrent)
            results = []
            
            for torrent in torrents:
                # Update with real-time data if available
                self._update_torrent_from_handle(torrent)
                
                # Calculate additional metrics
                eta = TorrentCalculations.calculate_eta(
                    torrent.total_size, torrent.downloaded, torrent.download_speed
                )
                ratio = TorrentCalculations.calculate_ratio(
                    torrent.downloaded, torrent.uploaded
                )
                
                # Get peer information
                peers_info = self._get_peer_information(torrent.info_hash)
                
                result = {
                    "id": torrent.id,
                    "name": torrent.name,
                    "status": torrent.status,
                    "progress": torrent.progress,
                    "total_size": torrent.total_size,
                    "downloaded": torrent.downloaded,
                    "uploaded": torrent.uploaded,
                    "download_speed": torrent.download_speed,
                    "upload_speed": torrent.upload_speed,
                    "ratio": ratio,
                    "eta": eta,
                    "num_peers": peers_info.get("num_peers", 0),
                    "num_seeds": peers_info.get("num_seeds", 0),
                    "created_at": torrent.created_at.isoformat() if torrent.created_at else None,
                }
                
                results.append(result)
            
            return results
            
        except Exception as e:
            logger.error(f"Error getting all torrents status: {e}")
            return []

    def _update_torrent_from_handle(self, torrent) -> None:
        """Update torrent data from libtorrent handle."""
        try:
            if torrent.info_hash not in self.handles:
                # Clear speeds if no active handle
                torrent.download_speed = 0
                torrent.upload_speed = 0
                return
                
            handle = self.handles[torrent.info_hash]
            if not handle.is_valid():
                return
                
            status = handle.status()
            
            # Update torrent data
            torrent.downloaded = status.total_done
            torrent.uploaded = status.total_upload
            torrent.download_speed = status.download_rate
            torrent.upload_speed = status.upload_rate
            torrent.progress = status.progress
            
            # Update total size if we didn't have it
            if torrent.total_size == 0 and hasattr(status, "total_wanted"):
                torrent.total_size = status.total_wanted
            
            # Update status
            torrent.status = TorrentStatusMapper.map_status(status)
            
        except Exception as e:
            logger.error(f"Error updating torrent from handle: {e}")

    def _get_peer_information(self, info_hash: str) -> Dict[str, int]:
        """Get peer information for a torrent."""
        try:
            if info_hash not in self.handles:
                return {"num_peers": 0, "num_seeds": 0}
                
            handle = self.handles[info_hash]
            if not handle.is_valid():
                return {"num_peers": 0, "num_seeds": 0}
                
            status = handle.status()
            return {
                "num_peers": status.num_peers,
                "num_seeds": status.num_seeds,
            }
            
        except Exception as e:
            logger.error(f"Error getting peer information: {e}")
            return {"num_peers": 0, "num_seeds": 0}

    async def pause_torrent(self, torrent_id: int) -> Dict[str, Any]:
        """Pause a torrent."""
        return await self._control_torrent(torrent_id, "pause")

    async def resume_torrent(self, torrent_id: int) -> Dict[str, Any]:
        """Resume a torrent."""
        return await self._control_torrent(torrent_id, "resume")

    async def _control_torrent(self, torrent_id: int, action: str) -> Dict[str, Any]:
        """Control torrent with improved error handling."""
        try:
            if not self.session:
                return {"error": "Torrent service not initialized"}

            # Get torrent
            torrent = DatabaseManager.get_single_record(
                Torrent,
                Torrent.id == torrent_id
            )
            
            if not torrent:
                return {"error": "Torrent not found"}

            info_hash = torrent.info_hash
            
            # Update handle if available
            if info_hash in self.handles:
                handle = self.handles[info_hash]
                
                if action == "pause":
                    handle.pause()
                    new_status = TORRENT_STATUS_PAUSED
                elif action == "resume":
                    handle.resume()
                    new_status = TORRENT_STATUS_DOWNLOADING if torrent.progress < 1.0 else TORRENT_STATUS_SEEDING
                else:
                    return {"error": f"Unknown action: {action}"}
            else:
                # No handle available, just update database status
                if action == "pause":
                    new_status = TORRENT_STATUS_PAUSED
                elif action == "resume":
                    new_status = TORRENT_STATUS_DOWNLOADING if torrent.progress < 1.0 else TORRENT_STATUS_SEEDING
                else:
                    return {"error": f"Unknown action: {action}"}

            # Update database
            DatabaseManager.update_record(
                Torrent,
                Torrent.id == torrent_id,
                {"status": new_status}
            )
            
            return {"success": True, "action": action, "status": new_status}
            
        except Exception as e:
            logger.error(f"Error controlling torrent: {e}")
            return {"error": str(e)}

    def get_session_stats(self) -> Dict[str, Any]:
        """Get session statistics."""
        try:
            if not self.session:
                return self._get_empty_stats()
            
            status = self.session.status()
            
            return {
                "port": self.session.listen_port(),
                "num_peers": status.num_peers,
                "dht_nodes": status.dht_nodes,
                "libtorrent_version": lt.version,
                "uptime": int(time.time() - self.startup_time),
                "download_rate": status.download_rate,
                "upload_rate": status.upload_rate,
                "payload_download_rate": status.payload_download_rate,
                "payload_upload_rate": status.payload_upload_rate,
            }
            
        except Exception as e:
            logger.error(f"Error getting session stats: {e}")
            return self._get_empty_stats()

    def _get_empty_stats(self) -> Dict[str, Any]:
        """Get empty stats fallback."""
        return {
            "port": 0,
            "num_peers": 0,
            "dht_nodes": 0,
            "libtorrent_version": lt.version,
            "uptime": int(time.time() - self.startup_time),
            "download_rate": 0,
            "upload_rate": 0,
            "payload_download_rate": 0,
            "payload_upload_rate": 0,
        }
