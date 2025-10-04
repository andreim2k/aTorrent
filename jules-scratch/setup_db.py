import os
import sys

# Add backend path to sys.path to allow imports
sys.path.insert(0, os.path.abspath('backend'))

from app.db.database import SessionLocal, engine, Base
from app.models.settings import AppSettings
from app.core.security import get_password_hash

def setup_database():
    """Creates the database and sets a default password non-interactively."""
    print("Setting up the database non-interactively...")

    # Create tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Check if settings already exist
        if db.query(AppSettings).first():
            print("Database already initialized. Skipping setup.")
            return

        # Create default settings with a known password
        password = "password"
        hashed_password = get_password_hash(password)

        default_path = os.path.join(os.path.expanduser("~"), "Downloads")
        os.makedirs(default_path, exist_ok=True)

        new_settings = AppSettings(
            app_password_hash=hashed_password,
            default_download_path=default_path,
            theme="dark",
            language="en",
            max_active_downloads=5,
            auto_start_downloads=True
        )

        db.add(new_settings)
        db.commit()

        print(f"Database created successfully. Password is set to: '{password}'")

    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    setup_database()