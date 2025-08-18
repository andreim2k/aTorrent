from sqlalchemy.orm import Session
from app.db.database import SessionLocal, create_tables
from app.models.torrent import Torrent
from app.models.settings import AppSettings
from app.core.security import get_password_hash
import logging

logger = logging.getLogger(__name__)

def init_db() -> None:
    """Initialize database with tables and default data"""
    try:
        # Create all tables
        create_tables()
        logger.info("Database tables created successfully")
        
        # Initialize app settings if none exist
        db = SessionLocal()
        try:
            settings = db.query(AppSettings).first()
            if not settings:
                # Create default app settings without password (will be set during initialization)
                import os
                default_download_path = os.path.join(os.path.expanduser("~"), "Downloads")
                
                # Generate a secure random password placeholder that will be replaced
                import secrets
                import string
                temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
                
                default_settings = AppSettings(
                    app_password_hash=get_password_hash(temp_password),  # Temporary secure hash
                    theme="dark",
                    language="en",
                    default_download_path=default_download_path,
                    max_download_speed=0,
                    max_upload_speed=0,
                    max_active_downloads=5,
                    auto_start_downloads=True,
                    enable_notifications=True
                )
                db.add(default_settings)
                db.commit()
                
                logger.warning("Default application settings created with temporary password - must run initialize_app.py")
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise
