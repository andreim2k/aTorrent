"""Monitoring and metrics API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from datetime import datetime, timedelta

from app.api.deps import get_authenticated
from app.core.monitoring import monitor
from app.core.cache import torrent_cache, session_cache, stats_cache

router = APIRouter()


@router.get("/metrics", response_model=Dict[str, Any])
def get_metrics(
    authenticated: bool = Depends(get_authenticated)
):
    """Get performance metrics."""
    try:
        return monitor.get_summary()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get metrics: {str(e)}"
        )


@router.get("/cache/stats", response_model=Dict[str, Any])
def get_cache_stats(
    authenticated: bool = Depends(get_authenticated)
):
    """Get cache statistics."""
    try:
        return {
            "torrent_cache": torrent_cache.get_stats(),
            "session_cache": session_cache.get_stats(),
            "stats_cache": stats_cache.get_stats()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get cache stats: {str(e)}"
        )


@router.post("/cache/clear")
def clear_cache(
    cache_type: str = "all",
    authenticated: bool = Depends(get_authenticated)
):
    """Clear cache entries."""
    try:
        if cache_type == "all":
            torrent_cache.clear()
            session_cache.clear()
            stats_cache.clear()
        elif cache_type == "torrent":
            torrent_cache.clear()
        elif cache_type == "session":
            session_cache.clear()
        elif cache_type == "stats":
            stats_cache.clear()
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid cache type. Use 'all', 'torrent', 'session', or 'stats'"
            )
        
        return {"message": f"Cache {cache_type} cleared successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear cache: {str(e)}"
        )


@router.get("/health/detailed", response_model=Dict[str, Any])
def get_detailed_health(
    authenticated: bool = Depends(get_authenticated)
):
    """Get detailed health information."""
    try:
        from app.main import torrent_service
        
        # Get basic health info
        health_info = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "components": {
                "torrent_service": "healthy" if torrent_service and torrent_service.running else "unhealthy",
                "database": "healthy",  # Could add actual DB check
                "cache": "healthy",
                "monitoring": "healthy"
            }
        }
        
        # Add performance metrics
        health_info["performance"] = {
            "cache_hit_rates": {
                "torrent_cache": torrent_cache.get_stats().get("hit_rate", 0),
                "session_cache": session_cache.get_stats().get("hit_rate", 0),
                "stats_cache": stats_cache.get_stats().get("hit_rate", 0)
            },
            "recent_errors": monitor.get_counter("error_count"),
            "uptime": "unknown"  # Could calculate from startup time
        }
        
        # Add cache statistics
        health_info["cache_stats"] = {
            "torrent_cache": torrent_cache.get_stats(),
            "session_cache": session_cache.get_stats(),
            "stats_cache": stats_cache.get_stats()
        }
        
        return health_info
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get detailed health: {str(e)}"
        )

