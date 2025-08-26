#!/usr/bin/env python3
"""
Initialize the single-user @Torrent application.
This script sets up the default password and initial settings.
"""

import os
import sys
from getpass import getpass

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine, Base
from app.models.settings import AppSettings
from app.core.security import get_password_hash

def initialize_database():
    """Initialize the database with default settings."""
    print("🔧 Initializing @Torrent single-user application...")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    
    try:
        # Check if settings already exist
        existing_settings = db.query(AppSettings).first()
        
        if existing_settings:
            print("⚠️  Application already initialized!")
            
            # Ask if user wants to reset password
            reset = input("Do you want to reset the password? (y/N): ").lower().strip()
            if reset == 'y':
                # Get new password
                while True:
                    password = getpass("Enter new password: ")
                    confirm = getpass("Confirm password: ")
                    
                    if password != confirm:
                        print("❌ Passwords don't match. Please try again.")
                        continue
                    
                    if len(password) < 6:
                        print("❌ Password must be at least 6 characters long.")
                        continue
                    
                    break
                
                # Update password
                existing_settings.app_password_hash = get_password_hash(password)
                db.commit()
                print("✅ Password updated successfully!")
            else:
                print("⏭️  Skipping password reset.")
        else:
            # Get password from user
            while True:
                password = getpass("Enter password for the application: ")
                confirm = getpass("Confirm password: ")
                
                if password != confirm:
                    print("❌ Passwords don't match. Please try again.")
                    continue
                
                if len(password) < 6:
                    print("❌ Password must be at least 6 characters long.")
                    continue
                
                break
            
            # Get download path
            import os
            default_path = os.path.join(os.path.expanduser("~"), "Downloads")
            download_path = input(f"Enter default download path (or press Enter for {default_path}): ").strip()
            if not download_path:
                download_path = default_path
            
            # Make sure download path exists
            os.makedirs(download_path, exist_ok=True)
            
            # Create settings
            settings = AppSettings(
                app_password_hash=get_password_hash(password),
                theme="dark",
                language="en",
                default_download_path=download_path,
                max_download_speed=0,
                max_upload_speed=0,
                max_active_downloads=5,
                auto_start_downloads=True,
                enable_notifications=True
            )
            
            db.add(settings)
            db.commit()
            
            print("✅ Application initialized successfully!")
            print(f"📂 Default download path: {download_path}")
            print("🚀 You can now start the application with: python -m app.main")
    
    except Exception as e:
        print(f"❌ Error initializing application: {e}")
        db.rollback()
        return False
    
    finally:
        db.close()
    
    return True

if __name__ == "__main__":
    success = initialize_database()
    if not success:
        sys.exit(1)
