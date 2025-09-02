from fastapi import APIRouter

from app.api.v1 import auth, torrents, settings, torrent_details

api_router = APIRouter()

# Include route modules for single-user system
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(torrents.router, prefix="/torrents", tags=["torrents"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(torrent_details.router, tags=["torrent-details"])
