import libtorrent as lt
import os
import asyncio
import logging
import time
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.torrent import Torrent
from app.models.settings import AppSettings
from app.core.config import settings

logger = logging.getLogger(__name__)

class TorrentService:
    """Real torrent service using libtorrent"""
    
    def __init__(self, downloads_path: str = None):
        self.downloads_path = downloads_path or getattr(settings, 'DOWNLOADS_PATH', './downloads')
        self.session = None
        self.handles: Dict[str, Any] = {}  # info_hash -> torrent_handle mapping
        self.running = False
        self.startup_time = time.time()  # Track when service was created
        
        # Ensure downloads directory exists
        os.makedirs(self.downloads_path, exist_ok=True)

    async def initialize(self):
        """Initialize libtorrent session"""
        try:
            self.session = lt.session()
            
            # Configure session settings
            settings = self.session.get_settings()
            settings["listen_interfaces"] = "0.0.0.0:6881"
            settings["enable_dht"] = True
            settings["enable_lsd"] = True
            settings["enable_upnp"] = True
            settings["enable_natpmp"] = True
            
            # Disable resume data to prevent immediate seeding
            settings["auto_manage_startup"] = False
            
            self.session.apply_settings(settings)
            
            # Set alert mask to get all alerts
            self.session.set_alert_mask(lt.alert.category_t.all_categories)
            
            # Add DHT bootstrap nodes
            self.session.add_dht_router("router.bittorrent.com", 6881)
            self.session.add_dht_router("dht.transmissionbt.com", 6881)
            
            # Start services
            self.session.start_dht()
            self.session.start_lsd()
            self.session.start_upnp()
            self.session.start_natpmp()
            
            self.running = True
            logger.info("TorrentService initialized successfully")
            
            # Start alert processing
            asyncio.create_task(self._process_alerts())
            
            # Load existing torrents (disabled to prevent resume issues)
            # await self._load_existing_torrents()
            
        except Exception as e:
            logger.error(f"Failed to initialize TorrentService: {e}")
            raise

    async def cleanup(self):
        """Clean up torrent service"""
        if self.session:
            self.running = False
            # Pause all torrents
            for handle in self.handles.values():
                if hasattr(handle, 'pause'):
                    handle.pause()
            
            # DO NOT save session state to prevent torrents from reappearing
            # Session state persistence can cause deleted torrents to reappear
            # as libtorrent may resume them from saved state
            logger.info("Skipping session state save to prevent torrent resurrection")
            
            self.session = None
            logger.info("TorrentService cleaned up")

    async def _process_alerts(self):
        """Process libtorrent alerts"""
        while self.running and self.session:
            try:
                alerts = self.session.pop_alerts()
                for alert in alerts:
                    await self._handle_alert(alert)
                await asyncio.sleep(0.2)  # Check for alerts every 200ms
            except Exception as e:
                logger.error(f"Error processing alerts: {e}")
                await asyncio.sleep(5)

    async def _handle_alert(self, alert):
        """Handle individual alert"""
        try:
            if isinstance(alert, lt.torrent_added_alert):
                logger.info(f"Torrent added: {alert.torrent_name}")
            elif isinstance(alert, lt.torrent_finished_alert):
                logger.info(f"Torrent finished: {alert.torrent_name}")
            elif isinstance(alert, lt.torrent_error_alert):
                logger.error(f"Torrent error: {alert.what()}")
        except Exception as e:
            logger.error(f"Error handling alert: {e}")

    def _get_db(self) -> Session:
        """Get database session"""
        return SessionLocal()
    
    def _calculate_eta(self, total_size: int, downloaded: int, download_speed: float) -> int:
        """Calculate ETA (Estimated Time of Arrival) in seconds"""
        try:
            if download_speed <= 0 or total_size <= 0 or downloaded >= total_size:
                return 0  # No ETA if no download speed, no size, or already complete
            
            remaining_bytes = total_size - downloaded
            eta_seconds = remaining_bytes / download_speed
            
            # Cap ETA at a reasonable maximum (e.g., 1 year)
            max_eta = 365 * 24 * 60 * 60  # 1 year in seconds
            return min(int(eta_seconds), max_eta)
            
        except (ZeroDivisionError, ValueError):
            return 0

    def _update_torrent_in_db(self, info_hash: str, torrent_data: dict):
        """Update torrent information in database"""
        try:
            db = self._get_db()
            try:
                torrent = db.query(Torrent).filter(
                    Torrent.info_hash == info_hash
                ).first()
                
                if torrent:
                    for key, value in torrent_data.items():
                        if hasattr(torrent, key):
                            setattr(torrent, key, value)
                    db.commit()
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Error updating torrent in database: {e}")

    def _get_download_path(self) -> str:
        """Get download path from settings"""
        try:
            db = self._get_db()
            try:
                # Get settings from first user (admin) - single user system
                user_settings = db.query(AppSettings).first()
                if user_settings and user_settings.default_download_path:
                    # Use custom download path directly
                    download_path = user_settings.default_download_path
                    os.makedirs(download_path, exist_ok=True)
                    return download_path
            finally:
                db.close()
        except Exception as e:
            logger.warning(f"Failed to get download path from settings: {e}")
        
        # Fall back to default download path
        os.makedirs(self.downloads_path, exist_ok=True)
        return self.downloads_path

    async def add_torrent(self, torrent_file: str, auto_start: bool = True) -> Dict[str, Any]:
        """Add a new torrent"""
        try:
            if not self.session:
                return {"error": "Torrent service not initialized"}
            
            # Determine torrent parameters
            params = lt.add_torrent_params()
            
            # Handle base64 encoded torrent file content only
            try:
                import base64
                torrent_data = base64.b64decode(torrent_file)
                info = lt.torrent_info(torrent_data)
                params.ti = info
            except Exception as e:
                return {"error": f"Invalid torrent file content: {str(e)}"}
            
            # Set download path using settings
            save_path = self._get_download_path()
            params.save_path = save_path
            
            # Set torrent flags based on auto_start parameter
            if auto_start:
                # Start downloading immediately - use auto_managed for queue management
                params.flags |= lt.torrent_flags.auto_managed
            else:
                # Start paused and disable auto-management to prevent automatic resuming
                params.flags |= lt.torrent_flags.paused
                # Don't use auto_managed flag when we want manual control
            
            # Add torrent to session
            handle = self.session.add_torrent(params)
            
            # Force a recheck to verify actual file state on disk
            # This prevents showing incorrect progress from stale resume data
            handle.force_recheck()
            
            # Ensure the correct state is set after adding
            if auto_start:
                # Resume after recheck completes
                handle.resume()  # Start downloading immediately
            else:
                handle.pause()   # Ensure it stays paused
                
            info_hash = str(handle.info_hash())
            
            # Store handle
            self.handles[info_hash] = handle
            
            # Get torrent name
            torrent_name = "Unknown"
            if hasattr(params, 'ti') and params.ti:
                torrent_name = params.ti.name()
            elif hasattr(params, 'name') and params.name:
                torrent_name = params.name
            
            # Save to database
            db = self._get_db()
            try:
                # Check if torrent already exists
                existing_torrent = db.query(Torrent).filter(
                    Torrent.info_hash == info_hash
                ).first()
                
                if existing_torrent:
                    return {"error": "Torrent already exists", "torrent_id": existing_torrent.id}
                
                # Set initial status based on auto_start parameter
                initial_status = "downloading" if auto_start else "paused"
                
                db_torrent = Torrent(
                    info_hash=info_hash,
                    name=torrent_name,
                    magnet_link=None,  # No magnet links supported, only torrent files
                    total_size=0,  # Will be updated when metadata is received
                    downloaded=0,
                    uploaded=0,
                    download_speed=0,
                    upload_speed=0,
                    progress=0.0,
                    status=initial_status,  # Respect auto_start parameter
                    download_path=save_path
                )
                db.add(db_torrent)
                db.commit()
                db.refresh(db_torrent)
                
                return {
                    "success": True,
                    "torrent_id": db_torrent.id,
                    "info_hash": info_hash,
                    "name": torrent_name
                }
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error adding torrent: {e}")
            return {"error": str(e)}

    async def remove_torrent(self, torrent_id: int, delete_files: bool = False) -> Dict[str, Any]:
        """Remove a torrent"""
        try:
            if not self.session:
                return {"error": "Torrent service not initialized"}
            
            db = self._get_db()
            try:
                torrent = db.query(Torrent).filter(
                    Torrent.id == torrent_id
                ).first()
                
                if not torrent:
                    return {"error": "Torrent not found"}
                
                info_hash = torrent.info_hash
                
                # FIRST: Stop/pause the torrent to ensure clean deletion
                if info_hash in self.handles:
                    handle = self.handles[info_hash]
                    try:
                        # Pause the torrent to stop all activity
                        handle.pause()
                        # Force stop by removing auto-management
                        handle.unset_flags(lt.torrent_flags.auto_managed)
                        # Flush any pending data
                        handle.flush_cache()
                        # Small delay to ensure operations complete
                        await asyncio.sleep(0.5)
                    except Exception as stop_error:
                        logger.warning(f"Error stopping torrent before removal: {stop_error}")
                        # Continue with removal anyway
                
                # SECOND: Remove from libtorrent session
                removed_from_session = False
                if info_hash in self.handles:
                    handle = self.handles[info_hash]
                    try:
                        flags = lt.remove_flags_t.delete_files if delete_files else 0
                        self.session.remove_torrent(handle, flags)
                        removed_from_session = True
                    except Exception as session_error:
                        logger.error(f"Error removing from libtorrent session: {session_error}")
                        # Already paused above, so just log the error
                    finally:
                        # ALWAYS remove the handle from our tracking dict
                        # This ensures it won't contribute to stats even if libtorrent removal failed
                        del self.handles[info_hash]
                
                # Remove from database
                db.delete(torrent)
                db.commit()
                
                # If delete_files is True but we couldn't remove from session, manually delete files
                if delete_files and not removed_from_session and torrent.download_path:
                    try:
                        import shutil
                        from pathlib import Path
                        
                        # The actual torrent data is in download_path/torrent_name
                        base_path = Path(torrent.download_path)
                        torrent_data_path = base_path / torrent.name
                        
                        if torrent_data_path.exists():
                            if torrent_data_path.is_file():
                                torrent_data_path.unlink()
                            else:
                                shutil.rmtree(torrent_data_path)
                        else:
                            # Try alternative: sometimes the name might be different from file system name
                            # Check if there's a folder/file that starts with the torrent name
                            possible_matches = list(base_path.glob(f"{torrent.name[:20]}*")) if len(torrent.name) > 20 else []
                            if possible_matches:
                                for match in possible_matches:
                                    if match.is_file():
                                        match.unlink()
                                    elif match.is_dir():
                                        shutil.rmtree(match)
                    except Exception as file_error:
                        logger.error(f"Error manually deleting files: {file_error}")
                        # Don't fail the whole operation for file deletion errors
                
                return {"success": True, "removed_from_session": removed_from_session}
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error removing torrent: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return {"error": str(e)}

    async def pause_torrent(self, torrent_id: int) -> Dict[str, Any]:
        """Pause a torrent"""
        return await self._control_torrent(torrent_id, "pause")

    async def resume_torrent(self, torrent_id: int) -> Dict[str, Any]:
        """Resume a torrent"""
        return await self._control_torrent(torrent_id, "resume")

    async def recheck_torrent(self, torrent_id: int) -> Dict[str, Any]:
        """Force recheck of torrent files"""
        try:
            if not self.session:
                return {"error": "Torrent service not initialized"}
            
            db = self._get_db()
            try:
                torrent = db.query(Torrent).filter(
                    Torrent.id == torrent_id
                ).first()
                
                if not torrent:
                    return {"error": "Torrent not found"}
                
                info_hash = torrent.info_hash
                
                if info_hash in self.handles:
                    handle = self.handles[info_hash]
                    
                    # Force recheck the torrent
                    handle.force_recheck()
                    
                    # Update status to checking
                    torrent.status = "checking"
                    db.commit()
                    
                    logger.info(f"Initiated recheck for torrent: {torrent.name}")
                    return {"success": True, "message": "Recheck initiated"}
                else:
                    logger.warning(f"No libtorrent handle found for torrent: {torrent.name}")
                    return {"error": "Torrent handle not found in session"}
                    
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error rechecking torrent: {e}")
            return {"error": str(e)}

    async def _control_torrent(self, torrent_id: int, action: str) -> Dict[str, Any]:
        """Control torrent (pause/resume)"""
        try:
            if not self.session:
                return {"error": "Torrent service not initialized"}
            
            db = self._get_db()
            try:
                torrent = db.query(Torrent).filter(
                    Torrent.id == torrent_id
                ).first()
                
                if not torrent:
                    return {"error": "Torrent not found"}
                
                info_hash = torrent.info_hash
                
                if info_hash in self.handles:
                    handle = self.handles[info_hash]
                    
                    if action == "pause":
                        handle.pause()
                        torrent.status = "paused"
                    elif action == "resume":
                        # Simply resume without manipulating flags
                        handle.resume()
                        torrent.status = "downloading" if torrent.progress < 1.0 else "seeding"
                    
                    db.commit()
                    logger.info(f"Successfully {action}d torrent with libtorrent handle: {torrent.name}")
                    return {"success": True, "used_handle": True}
                else:
                    # No libtorrent handle, but still update database status
                    logger.warning(f"No libtorrent handle for {torrent.name}, updating database status only")
                    
                    if action == "pause":
                        torrent.status = "paused"
                    elif action == "resume":
                        # Try to reload the torrent into libtorrent if we have a magnet link
                        if hasattr(torrent, 'magnet_link') and torrent.magnet_link:
                            try:
                                import libtorrent as lt
                                params = lt.parse_magnet_uri(torrent.magnet_link)
                                params.save_path = torrent.download_path or self.downloads_path
                                handle = self.session.add_torrent(params)
                                self.handles[info_hash] = handle
                                torrent.status = "downloading" if torrent.progress < 1.0 else "seeding"
                                logger.info(f"Reloaded torrent into libtorrent and resumed: {torrent.name}")
                            except Exception as e:
                                logger.error(f"Failed to reload torrent {torrent.name}: {e}")
                                torrent.status = "downloading" if torrent.progress < 1.0 else "seeding"
                        else:
                            torrent.status = "downloading" if torrent.progress < 1.0 else "seeding"
                    
                    db.commit()
                    logger.info(f"Updated database status to {torrent.status} for torrent: {torrent.name}")
                    return {"success": True, "used_handle": False, "status_updated": True}
                    
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error controlling torrent: {e}")
            return {"error": str(e)}

    async def get_torrent_status(self, torrent_id: int) -> Dict[str, Any]:
        """Get detailed torrent status"""
        try:
            db = self._get_db()
            try:
                torrent = db.query(Torrent).filter(
                    Torrent.id == torrent_id
                ).first()
                
                if not torrent:
                    return {"error": "Torrent not found"}
                
                # Get real-time status from libtorrent if available
                if torrent.info_hash in self.handles and self.session:
                    handle = self.handles[torrent.info_hash]
                    if handle.is_valid():
                        status = handle.status()
                        
                        # Update database with real-time data
                        torrent.downloaded = status.total_done
                        torrent.uploaded = status.total_upload
                        torrent.download_speed = status.download_rate
                        torrent.upload_speed = status.upload_rate
                        torrent.progress = status.progress
                        
                        if status.paused:
                            torrent.status = "paused"
                        elif status.state == lt.torrent_status.checking_files:
                            torrent.status = "checking"
                        elif status.state == lt.torrent_status.checking_resume_data:
                            torrent.status = "checking"
                        elif status.state == lt.torrent_status.downloading:
                            torrent.status = "downloading"
                        elif status.state == lt.torrent_status.seeding:
                            torrent.status = "seeding"
                        elif status.state == lt.torrent_status.finished:
                            torrent.status = "completed"
                        elif status.state == lt.torrent_status.allocating:
                            torrent.status = "allocating"
                        
                        db.commit()
                
                # Get additional data from libtorrent handle if available
                peers_total = getattr(torrent, 'peers_total', 0)
                seeds_total = getattr(torrent, 'seeds_total', 0)
                availability = getattr(torrent, 'availability', 0.0)
                time_active = getattr(torrent, 'time_active', 0)
                
                if torrent.info_hash in self.handles and self.session:
                    handle = self.handles[torrent.info_hash]
                    if handle.is_valid():
                        status = handle.status()
                        peers_total = status.num_peers
                        seeds_total = status.num_seeds
                        availability = 1.0  # Default availability
                        time_active = status.active_time if hasattr(status, 'active_time') else 0
                
                # Calculate real-time ETA
                eta = self._calculate_eta(torrent.total_size, torrent.downloaded, torrent.download_speed)
                
                return {
                    "id": torrent.id,
                    "info_hash": torrent.info_hash,
                    "name": torrent.name,
                    "status": torrent.status,
                    "progress": torrent.progress,
                    "total_size": torrent.total_size,
                    "downloaded": torrent.downloaded,
                    "uploaded": torrent.uploaded,
                    "download_speed": torrent.download_speed,
                    "upload_speed": torrent.upload_speed,
                    "peers_connected": getattr(torrent, 'peers_connected', 0),
                    "peers_total": peers_total,
                    "seeds_connected": getattr(torrent, 'seeds_connected', 0),
                    "seeds_total": seeds_total,
                    "ratio": torrent.uploaded / torrent.downloaded if torrent.downloaded > 0 else 0,
                    "availability": availability,
                    "eta": eta,
                    "time_active": time_active,
                    "download_path": torrent.download_path,
                    "priority": getattr(torrent, 'priority', 1),
                    "sequential_download": getattr(torrent, 'sequential_download', False),
                    "file_count": getattr(torrent, 'file_count', 0),
                    "files_info": getattr(torrent, 'files_info', None),
                    "label": getattr(torrent, 'label', None),
                    "category": getattr(torrent, 'category', None),
                    "tags": getattr(torrent, 'tags', None),
                    "created_at": torrent.created_at,
                    "updated_at": torrent.updated_at,
                    "completed_at": getattr(torrent, 'completed_at', None),
                    "started_at": getattr(torrent, 'started_at', None)
                }
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error getting torrent status: {e}")
            return {"error": str(e)}

    async def get_all_torrents_status(self) -> List[Dict[str, Any]]:
        """Get status of all torrents"""
        try:
            db = self._get_db()
            try:
                torrents = db.query(Torrent).all()
                results = []
                
                for torrent in torrents:
                    # Update with real-time data if available
                    updated_from_libtorrent = False
                    if torrent.info_hash in self.handles and self.session:
                        handle = self.handles[torrent.info_hash]
                        
                        if handle.is_valid():
                            try:
                                status = handle.status()
                                
                                torrent.downloaded = status.total_done
                                torrent.uploaded = status.total_upload
                                torrent.download_speed = status.download_rate
                                torrent.upload_speed = status.upload_rate
                                torrent.progress = status.progress
                                
                                # Update total_size if we didn't have it
                                if torrent.total_size == 0 and hasattr(status, 'total_wanted'):
                                    torrent.total_size = status.total_wanted
                                
                                # Update status based on libtorrent state
                                if status.paused:
                                    torrent.status = "paused"
                                elif status.state == lt.torrent_status.checking_files:
                                    torrent.status = "checking"
                                elif status.state == lt.torrent_status.checking_resume_data:
                                    torrent.status = "checking"
                                elif status.state == lt.torrent_status.downloading:
                                    torrent.status = "downloading"
                                elif status.state == lt.torrent_status.seeding:
                                    torrent.status = "seeding"
                                elif status.state == lt.torrent_status.finished:
                                    torrent.status = "completed"
                                elif status.state == lt.torrent_status.allocating:
                                    torrent.status = "allocating"
                                
                                updated_from_libtorrent = True
                                
                            except Exception as status_error:
                                logger.error(f"Error getting status for {torrent.name}: {status_error}")
                    else:
                        # If no handle, ensure speeds are 0 unless paused
                        if torrent.status not in ["paused", "downloading", "error"]:
                            torrent.download_speed = 0
                            torrent.upload_speed = 0
                    
                    # Get additional data from libtorrent handle if available
                    peers_total = getattr(torrent, 'peers_total', 0)
                    seeds_total = getattr(torrent, 'seeds_total', 0)
                    availability = getattr(torrent, 'availability', 0.0)
                    time_active = getattr(torrent, 'time_active', 0)
                    
                    if torrent.info_hash in self.handles and self.session:
                        handle = self.handles[torrent.info_hash]
                        if handle.is_valid():
                            try:
                                status = handle.status()
                                peers_total = status.num_peers
                                seeds_total = status.num_seeds
                                availability = 1.0  # Default availability
                                time_active = status.active_time if hasattr(status, 'active_time') else 0
                            except Exception:
                                pass  # Use defaults
                    
                    # Calculate real-time ETA
                    eta = self._calculate_eta(torrent.total_size, torrent.downloaded, torrent.download_speed)
                    
                    results.append({
                        "id": torrent.id,
                        "name": torrent.name,
                        "status": torrent.status,
                        "progress": torrent.progress,
                        "total_size": torrent.total_size,
                        "downloaded": torrent.downloaded,
                        "uploaded": torrent.uploaded,
                        "download_speed": torrent.download_speed,
                        "upload_speed": torrent.upload_speed,
                        "peers_connected": getattr(torrent, 'peers_connected', 0),
                        "seeds_connected": getattr(torrent, 'seeds_connected', 0),
                        "num_peers": peers_total,  # Add this for frontend compatibility
                        "num_seeds": seeds_total,  # Add this for frontend compatibility
                        "ratio": torrent.uploaded / torrent.downloaded if torrent.downloaded > 0 else 0,
                        "eta": eta,
                        "priority": getattr(torrent, 'priority', 1),
                        "label": getattr(torrent, 'label', None),
                        "category": getattr(torrent, 'category', None),
                        "created_at": torrent.created_at.isoformat() if torrent.created_at else None,
                        "updated_from_libtorrent": updated_from_libtorrent
                    })
                
                # Bulk update database
                db.commit()
                return results
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error getting all torrents status: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return []

    def get_session_stats(self) -> Dict[str, Any]:
        """Get session statistics"""
        try:
            if not self.session:
                return {
                    "port": 0,
                    "num_peers": 0,
                    "dht_nodes": 0,
                    "libtorrent_version": lt.version,
                    "uptime": 0
                }
            
            # Use session status for stats
            try:
                status = self.session.status()
                return {
                    "port": self.session.listen_port(),
                    "num_peers": status.num_peers,
                    "dht_nodes": status.dht_nodes,
                    "libtorrent_version": lt.version,
                    "uptime": int(time.time() - self.startup_time),  # Service uptime in seconds
                    "download_rate": status.download_rate,
                    "upload_rate": status.upload_rate,
                    "payload_download_rate": status.payload_download_rate,
                    "payload_upload_rate": status.payload_upload_rate
                }
            except Exception:
                # Fallback if status() doesn't work
                return {
                    "port": self.session.listen_port() if hasattr(self.session, 'listen_port') else 0,
                    "num_peers": len(self.handles),
                    "dht_nodes": 0,
                    "libtorrent_version": lt.version,
                    "uptime": 0
                }
            
        except Exception as e:
            logger.error(f"Error getting session stats: {e}")
            return {
                "port": 0,
                "num_peers": 0,
                "dht_nodes": 0,
                "libtorrent_version": lt.version,
                "uptime": 0
            }
            
    async def _load_existing_torrents(self):
        """Load existing torrents from database into libtorrent session"""
        try:
            db = self._get_db()
            try:
                torrents = db.query(Torrent).filter(
                    Torrent.status.in_(["downloading", "seeding", "paused"])
                ).all()
                
                for torrent in torrents:
                    try:
                        # Recreate torrent from magnet link if available
                        if hasattr(torrent, 'magnet_link') and torrent.magnet_link:
                            params = lt.parse_magnet_uri(torrent.magnet_link)
                            params.save_path = torrent.download_path or self.downloads_path
                            handle = self.session.add_torrent(params)
                            self.handles[torrent.info_hash] = handle
                            
                            if torrent.status == "paused":
                                handle.pause()
                                
                            logger.info(f"Reloaded torrent: {torrent.name}")
                        
                    except Exception as e:
                        logger.error(f"Failed to reload torrent {torrent.name}: {e}")
                        
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error loading existing torrents: {e}")
