import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError

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
            tmdb_api_key=settings.DEFAULT_TMDB_API_KEY,
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
    try:
        settings = db.query(AppSettings).first()

        if not settings:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Settings not found - application may not be initialized",
            )

        # Update fields directly
        update_data = settings_update.dict(exclude_unset=True)

        # Validate and update download path if provided
        if "default_download_path" in update_data:
            download_path = update_data["default_download_path"]
            if download_path:
                # Ensure path exists and is writable
                from pathlib import Path
                path_obj = Path(download_path)
                try:
                    # Create directory if it doesn't exist
                    path_obj.mkdir(parents=True, exist_ok=True)
                    # Check if directory is writable
                    if not os.access(path_obj, os.W_OK):
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Download path is not writable: {download_path}",
                        )
                except PermissionError:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Permission denied for download path: {download_path}",
                    )
                except Exception as e:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid download path: {str(e)}",
                    )

        # Update fields
        for field, value in update_data.items():
            if (
                hasattr(settings, field) and field != "app_password_hash"
            ):  # Don't allow password changes here
                setattr(settings, field, value)

        try:
            db.commit()
            db.refresh(settings)
        except OperationalError as e:
            db.rollback()
            # Check if it's a readonly database error
            if "readonly" in str(e).lower() or "read-only" in str(e).lower():
                # Try to fix database file permissions
                db_path = Path(settings.DATABASE_URL.replace("sqlite:///", ""))
                if db_path.exists():
                    try:
                        os.chmod(db_path, 0o664)
                        # Retry the commit
                        db.commit()
                        db.refresh(settings)
                    except Exception as perm_error:
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Database permission error. Please check file permissions for: {db_path}",
                        )
                else:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Database file not found. Please ensure the application is properly initialized.",
                    )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Database error: {str(e)}",
                )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update settings: {str(e)}",
        )

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
    settings.tmdb_api_key = settings.DEFAULT_TMDB_API_KEY
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
