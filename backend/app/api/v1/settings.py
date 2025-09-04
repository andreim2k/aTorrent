import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_authenticated
from app.core.config import settings
from app.models.settings import AppSettings
from app.schemas.settings import AppSettingsUpdate, AppSettingsResponse

router = APIRouter()

# Default download path - use user's home directory + Downloads
DEFAULT_DOWNLOAD_PATH = os.path.join(os.path.expanduser("~"), "Downloads")


@router.get("/", response_model=AppSettingsResponse)
def get_settings(
    authenticated: bool = Depends(get_authenticated), db: Session = Depends(get_db)
):
    """Get application settings"""
    settings = db.query(AppSettings).first()

    if not settings:
        # Create default settings if they don't exist
        settings = AppSettings(
            app_password_hash="",  # Will be set during initialization
            theme="dark",
            language="en",
            tmdb_api_key=settings.DEFAULT_TMDB_API_KEY or "a71d76587da20baba148ea7911f7a343",  # Default API key
            default_download_path=DEFAULT_DOWNLOAD_PATH,
            max_download_speed=0,
            max_upload_speed=0,
            max_active_downloads=5,
            auto_start_downloads=True,
            enable_notifications=True,
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return AppSettingsResponse(
        theme=settings.theme,
        language=settings.language,
        timezone=settings.timezone,
        tmdb_api_key=settings.tmdb_api_key,
        default_download_path=settings.default_download_path,
        max_download_speed=settings.max_download_speed,
        max_upload_speed=settings.max_upload_speed,
        max_active_downloads=settings.max_active_downloads,
        auto_start_downloads=settings.auto_start_downloads,
        enable_notifications=settings.enable_notifications,
        notify_on_download_complete=settings.notify_on_download_complete,
        enable_dht=settings.enable_dht,
        connection_port=settings.connection_port,
        use_random_port=settings.use_random_port,
    )


@router.put("/", response_model=AppSettingsResponse)
def update_settings(
    settings_update: AppSettingsUpdate,
    authenticated: bool = Depends(get_authenticated),
    db: Session = Depends(get_db),
):
    """Update application settings"""
    settings = db.query(AppSettings).first()

    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Settings not found - application may not be initialized",
        )

    # Update fields directly
    update_data = settings_update.dict(exclude_unset=True)

    # Update fields
    for field, value in update_data.items():
        if (
            hasattr(settings, field) and field != "app_password_hash"
        ):  # Don't allow password changes here
            setattr(settings, field, value)

    db.commit()
    db.refresh(settings)

    return AppSettingsResponse(
        theme=settings.theme,
        language=settings.language,
        timezone=settings.timezone,
        tmdb_api_key=settings.tmdb_api_key,
        default_download_path=settings.default_download_path,
        max_download_speed=settings.max_download_speed,
        max_upload_speed=settings.max_upload_speed,
        max_active_downloads=settings.max_active_downloads,
        auto_start_downloads=settings.auto_start_downloads,
        enable_notifications=settings.enable_notifications,
        notify_on_download_complete=settings.notify_on_download_complete,
        enable_dht=settings.enable_dht,
        connection_port=settings.connection_port,
        use_random_port=settings.use_random_port,
    )


@router.post("/reset", response_model=AppSettingsResponse)
def reset_settings(
    authenticated: bool = Depends(get_authenticated), db: Session = Depends(get_db)
):
    """Reset application settings to defaults"""
    settings = db.query(AppSettings).first()

    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Settings not found - application may not be initialized",
        )

    # Keep the password hash but reset other settings
    password_hash = settings.app_password_hash

    # Reset settings to defaults (keep the current download path or use default)
    settings.theme = "dark"
    settings.language = "en"
    settings.tmdb_api_key = "a71d76587da20baba148ea7911f7a343"  # Default API key
    # Only reset download path if it's empty or invalid, otherwise keep user's choice
    if not settings.default_download_path:
        settings.default_download_path = DEFAULT_DOWNLOAD_PATH
    settings.max_download_speed = 0
    settings.max_upload_speed = 0
    settings.max_active_downloads = 5
    settings.auto_start_downloads = True
    settings.enable_notifications = True
    settings.notify_on_download_complete = True
    settings.enable_dht = True
    settings.connection_port = 6881
    settings.use_random_port = True

    db.commit()
    db.refresh(settings)

    return AppSettingsResponse(
        theme=settings.theme,
        language=settings.language,
        timezone=settings.timezone,
        tmdb_api_key=settings.tmdb_api_key,
        default_download_path=settings.default_download_path,
        max_download_speed=settings.max_download_speed,
        max_upload_speed=settings.max_upload_speed,
        max_active_downloads=settings.max_active_downloads,
        auto_start_downloads=settings.auto_start_downloads,
        enable_notifications=settings.enable_notifications,
        notify_on_download_complete=settings.notify_on_download_complete,
        enable_dht=settings.enable_dht,
        connection_port=settings.connection_port,
        use_random_port=settings.use_random_port,
    )
