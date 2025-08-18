from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.api.deps import get_db, get_authenticated, get_torrent_service_dep
from app.models.torrent import Torrent
from app.services.torrent_service import TorrentService
from app.schemas.torrent import (
    TorrentCreate, 
    TorrentUpdate, 
    TorrentStatus, 
    TorrentListItem,
    TorrentStats,
    SessionStats,
    BulkTorrentOperation
)

router = APIRouter()

# Bulk operations
@router.post("/bulk/pause", response_model=dict)
async def bulk_pause_torrents(
    bulk_request: BulkTorrentOperation,
    authenticated: bool = Depends(get_authenticated),
    torrent_service: Optional[TorrentService] = Depends(get_torrent_service_dep),
    db: Session = Depends(get_db)
):
    """Pause multiple torrents"""
    results = []
    for torrent_id in bulk_request.torrent_ids:
        if torrent_service is not None:
            result = await torrent_service.pause_torrent(torrent_id)
        else:
            torrent = db.query(Torrent).filter(Torrent.id == torrent_id).first()
            if not torrent:
                result = {"error": "Torrent not found"}
            else:
                torrent.status = "paused"
                db.commit()
                result = {"success": True, "message": "Torrent paused"}
        results.append({"torrent_id": torrent_id, "result": result})
    return {"results": results}

@router.post("/bulk/resume", response_model=dict)
async def bulk_resume_torrents(
    bulk_request: BulkTorrentOperation,
    authenticated: bool = Depends(get_authenticated),
    torrent_service: Optional[TorrentService] = Depends(get_torrent_service_dep),
    db: Session = Depends(get_db)
):
    """Resume multiple torrents"""
    results = []
    for torrent_id in bulk_request.torrent_ids:
        if torrent_service is not None:
            result = await torrent_service.resume_torrent(torrent_id)
        else:
            torrent = db.query(Torrent).filter(Torrent.id == torrent_id).first()
            if not torrent:
                result = {"error": "Torrent not found"}
            else:
                if torrent.progress >= 1.0:
                    torrent.status = "seeding"
                else:
                    torrent.status = "downloading"
                db.commit()
                result = {"success": True, "message": "Torrent resumed"}
        results.append({"torrent_id": torrent_id, "result": result})
    return {"results": results}

@router.delete("/bulk", response_model=dict)
async def bulk_delete_torrents(
    bulk_request: BulkTorrentOperation,
    delete_files: bool = Query(False),
    authenticated: bool = Depends(get_authenticated),
    torrent_service: Optional[TorrentService] = Depends(get_torrent_service_dep),
    db: Session = Depends(get_db)
):
    """Delete multiple torrents"""
    results = []
    for torrent_id in bulk_request.torrent_ids:
        if torrent_service is not None:
            result = await torrent_service.remove_torrent(torrent_id, delete_files)
        else:
            torrent = db.query(Torrent).filter(Torrent.id == torrent_id).first()
            if not torrent:
                result = {"error": "Torrent not found"}
            else:
                db.delete(torrent)
                db.commit()
                result = {"success": True, "message": "Torrent deleted"}
        results.append({"torrent_id": torrent_id, "result": result})
    return {"results": results}

# Stats endpoints
@router.get("/stats/overview", response_model=TorrentStats)
def get_torrent_stats(
    authenticated: bool = Depends(get_authenticated),
    db: Session = Depends(get_db)
):
    """Get torrent statistics overview"""
    torrents = db.query(Torrent).all()
    
    stats = {
        "total_torrents": len(torrents),
        "active_torrents": 0,
        "downloading": 0,
        "seeding": 0,
        "paused": 0,
        "completed": 0,
        "total_download_speed": 0.0,
        "total_upload_speed": 0.0,
        "total_downloaded": 0,
        "total_uploaded": 0
    }
    
    for torrent in torrents:
        if torrent.status in ["downloading", "seeding"]:
            stats["active_torrents"] += 1
            stats["total_download_speed"] += torrent.download_speed or 0
            stats["total_upload_speed"] += torrent.upload_speed or 0
        
        if torrent.status == "downloading":
            stats["downloading"] += 1
        elif torrent.status == "seeding":
            stats["seeding"] += 1
        elif torrent.status == "paused":
            stats["paused"] += 1
        elif torrent.status == "completed":
            stats["completed"] += 1
        
        stats["total_downloaded"] += torrent.downloaded or 0
        stats["total_uploaded"] += torrent.uploaded or 0
    
    return stats

@router.get("/stats/session", response_model=SessionStats)
def get_session_stats(
    authenticated: bool = Depends(get_authenticated),
    torrent_service: Optional[TorrentService] = Depends(get_torrent_service_dep)
):
    """Get global session statistics"""
    if torrent_service is not None:
        return torrent_service.get_session_stats()
    else:
        return {
            "port": 6881,
            "num_peers": 0,
            "dht_nodes": 0,
            "libtorrent_version": "2.0.11.0",
            "uptime": 0,
            "total_payload_download": 0,
            "total_payload_upload": 0,
            "download_rate": 0,
            "upload_rate": 0,
            "payload_download_rate": 0,
            "payload_upload_rate": 0
        }

# Basic torrent CRUD operations
@router.get("/", response_model=List[TorrentListItem])
async def get_torrents(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status_filter: Optional[str] = Query(None, alias="status"),
    authenticated: bool = Depends(get_authenticated),
    torrent_service: Optional[TorrentService] = Depends(get_torrent_service_dep),
    db: Session = Depends(get_db)
):
    """Get list of all torrents with real-time data"""
    if torrent_service is not None:
        torrents_status = await torrent_service.get_all_torrents_status()
    else:
        # Fallback to database data when torrent service is unavailable
        query = db.query(Torrent)
        if status_filter and status_filter != 'all':
            query = query.filter(Torrent.status == status_filter)
        
        torrents = query.offset(skip).limit(limit).all()
        torrents_status = [
            {
                "id": t.id,
                "name": t.name,
                "status": t.status,
                "progress": t.progress,
                "total_size": t.total_size or 0,
                "downloaded": t.downloaded or 0,
                "uploaded": t.uploaded or 0,
                "download_speed": t.download_speed or 0,
                "upload_speed": t.upload_speed or 0,
                "peers_connected": getattr(t, 'peers_connected', 0),
                "seeds_connected": getattr(t, 'seeds_connected', 0),
                "ratio": (t.uploaded / t.downloaded) if (t.downloaded and t.downloaded > 0) else 0,
                "eta": getattr(t, 'eta', 0),
                "priority": getattr(t, 'priority', 1),
                "label": getattr(t, 'label', ''),
                "category": getattr(t, 'category', ''),
                "created_at": t.created_at
            } for t in torrents
        ]
    
    # Apply filters
    if status_filter and status_filter != 'all':
        torrents_status = [t for t in torrents_status if t.get('status') == status_filter]
    
    # Apply pagination (if not already done in DB query)
    if torrent_service is not None:
        if skip > 0:
            torrents_status = torrents_status[skip:]
        if limit > 0:
            torrents_status = torrents_status[:limit]
    
    return torrents_status

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def add_torrent(
    torrent_data: TorrentCreate,
    authenticated: bool = Depends(get_authenticated),
    torrent_service: Optional[TorrentService] = Depends(get_torrent_service_dep),
    db: Session = Depends(get_db)
):
    """Add a new torrent"""
    if torrent_service is not None:
        result = await torrent_service.add_torrent(
            torrent_file=torrent_data.torrent_file,
            auto_start=torrent_data.auto_start
        )
        
        if "error" in result:
            if "already exists" in result["error"]:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=result["error"]
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=result["error"]
                )
        
        return result
    else:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Torrent service unavailable"
        )

@router.get("/{torrent_id}", response_model=TorrentStatus)
async def get_torrent(
    torrent_id: int,
    authenticated: bool = Depends(get_authenticated),
    torrent_service: Optional[TorrentService] = Depends(get_torrent_service_dep),
    db: Session = Depends(get_db)
):
    """Get detailed torrent information"""
    if torrent_service is not None:
        result = await torrent_service.get_torrent_status(torrent_id)
        
        if "error" in result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["error"]
            )
        
        return result
    else:
        # Fallback: get torrent info from database when service is unavailable
        torrent = db.query(Torrent).filter(Torrent.id == torrent_id).first()
        
        if not torrent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Torrent not found"
            )
        
        return {
            "id": torrent.id,
            "info_hash": torrent.info_hash,
            "name": torrent.name,
            "status": torrent.status,
            "progress": torrent.progress or 0,
            "total_size": torrent.total_size or 0,
            "downloaded": torrent.downloaded or 0,
            "uploaded": torrent.uploaded or 0,
            "download_speed": torrent.download_speed or 0,
            "upload_speed": torrent.upload_speed or 0,
            "peers_connected": getattr(torrent, 'peers_connected', 0),
            "peers_total": getattr(torrent, 'peers_total', 0),
            "seeds_connected": getattr(torrent, 'seeds_connected', 0),
            "seeds_total": getattr(torrent, 'seeds_total', 0),
            "ratio": (torrent.uploaded / torrent.downloaded) if (torrent.downloaded and torrent.downloaded > 0) else 0,
            "availability": getattr(torrent, 'availability', 0),
            "eta": getattr(torrent, 'eta', 0),
            "time_active": getattr(torrent, 'time_active', 0),
            "download_path": torrent.download_path,
            "priority": getattr(torrent, 'priority', 1),
            "sequential_download": getattr(torrent, 'sequential_download', False),
            "file_count": getattr(torrent, 'file_count', 0),
            "files_info": getattr(torrent, 'files_info', None),
            "label": getattr(torrent, 'label', ''),
            "category": getattr(torrent, 'category', ''),
            "tags": getattr(torrent, 'tags', None),
            "created_at": torrent.created_at,
            "updated_at": torrent.updated_at,
            "completed_at": getattr(torrent, 'completed_at', None),
            "started_at": getattr(torrent, 'started_at', None)
        }

@router.delete("/{torrent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_torrent(
    torrent_id: int,
    delete_files: bool = Query(False),
    authenticated: bool = Depends(get_authenticated),
    torrent_service: Optional[TorrentService] = Depends(get_torrent_service_dep),
    db: Session = Depends(get_db)
):
    """Delete a torrent"""
    if torrent_service is not None:
        result = await torrent_service.remove_torrent(torrent_id, delete_files)
        
        if "error" in result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["error"]
            )
    else:
        torrent = db.query(Torrent).filter(Torrent.id == torrent_id).first()
        
        if not torrent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Torrent not found"
            )
        
        db.delete(torrent)
        db.commit()

# Individual torrent operations
@router.post("/{torrent_id}/pause", response_model=dict)
async def pause_torrent(
    torrent_id: int,
    authenticated: bool = Depends(get_authenticated),
    torrent_service: Optional[TorrentService] = Depends(get_torrent_service_dep),
    db: Session = Depends(get_db)
):
    """Pause a torrent"""
    if torrent_service is not None:
        result = await torrent_service.pause_torrent(torrent_id)
        
        if "error" in result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["error"]
            )
        
        return result
    else:
        torrent = db.query(Torrent).filter(Torrent.id == torrent_id).first()
        
        if not torrent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Torrent not found"
            )
        
        torrent.status = "paused"
        db.commit()
        
        return {"success": True, "message": "Torrent paused"}

@router.post("/{torrent_id}/resume", response_model=dict)
async def resume_torrent(
    torrent_id: int,
    authenticated: bool = Depends(get_authenticated),
    torrent_service: Optional[TorrentService] = Depends(get_torrent_service_dep),
    db: Session = Depends(get_db)
):
    """Resume a torrent"""
    if torrent_service is not None:
        result = await torrent_service.resume_torrent(torrent_id)
        
        if "error" in result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["error"]
            )
        
        return result
    else:
        torrent = db.query(Torrent).filter(Torrent.id == torrent_id).first()
        
        if not torrent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Torrent not found"
            )
        
        if torrent.progress >= 1.0:
            torrent.status = "seeding"
        else:
            torrent.status = "downloading"
        db.commit()
        
        return {"success": True, "message": "Torrent resumed"}

@router.post("/{torrent_id}/recheck", response_model=dict)
async def recheck_torrent(
    torrent_id: int,
    authenticated: bool = Depends(get_authenticated),
    torrent_service: Optional[TorrentService] = Depends(get_torrent_service_dep),
    db: Session = Depends(get_db)
):
    """Force recheck of torrent files"""
    if torrent_service is not None:
        result = await torrent_service.recheck_torrent(torrent_id)
        
        if "error" in result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["error"]
            )
        
        return result
    else:
        # Can't recheck without libtorrent
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Torrent service unavailable - cannot recheck files"
        )
