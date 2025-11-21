from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import os
from pathlib import Path

# Create database engine
connect_args = {}
if "sqlite" in settings.DATABASE_URL:
    connect_args["check_same_thread"] = False
    # Ensure database file has write permissions
    db_path_str = settings.DATABASE_URL.replace("sqlite:///", "")
    if db_path_str:
        db_path = Path(db_path_str)
        # Ensure parent directory exists and is writable
        db_path.parent.mkdir(parents=True, exist_ok=True)
        # Set directory permissions
        try:
            os.chmod(db_path.parent, 0o755)
        except Exception:
            pass  # Ignore if we can't set permissions

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False,  # Disable SQL query logging
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create declarative base for models
Base = declarative_base()


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)
    
    # Ensure database file has proper permissions after creation
    if "sqlite" in settings.DATABASE_URL:
        db_path_str = settings.DATABASE_URL.replace("sqlite:///", "")
        if db_path_str:
            db_path = Path(db_path_str)
            if db_path.exists():
                try:
                    os.chmod(db_path, 0o664)
                except Exception:
                    pass  # Ignore permission errors


def drop_tables():
    """Drop all database tables"""
    Base.metadata.drop_all(bind=engine)
