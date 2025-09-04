"""Database utilities and context managers."""

from contextlib import contextmanager
from typing import Generator
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
import logging

logger = logging.getLogger(__name__)


@contextmanager
def get_db_context() -> Generator[Session, None, None]:
    """
    Context manager for database sessions.
    Ensures proper cleanup and error handling.
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        logger.error(f"Database error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


class DatabaseManager:
    """Database operations manager with proper session handling."""
    
    @staticmethod
    def execute_with_session(func, *args, **kwargs):
        """Execute a function with a managed database session."""
        with get_db_context() as db:
            return func(db, *args, **kwargs)
    
    @staticmethod
    def get_single_record(model, filter_condition):
        """Get a single record with proper session management."""
        with get_db_context() as db:
            return db.query(model).filter(filter_condition).first()
    
    @staticmethod
    def get_all_records(model, filter_condition=None):
        """Get all records with proper session management."""
        with get_db_context() as db:
            query = db.query(model)
            if filter_condition is not None:
                query = query.filter(filter_condition)
            return query.all()
    
    @staticmethod
    def create_record(record):
        """Create a new record with proper session management."""
        with get_db_context() as db:
            db.add(record)
            db.commit()
            db.refresh(record)
            return record
    
    @staticmethod
    def update_record(model, filter_condition, update_data):
        """Update records with proper session management."""
        with get_db_context() as db:
            record = db.query(model).filter(filter_condition).first()
            if record:
                for key, value in update_data.items():
                    if hasattr(record, key):
                        setattr(record, key, value)
                db.commit()
                db.refresh(record)
                return record
            return None
    
    @staticmethod
    def delete_record(model, filter_condition):
        """Delete records with proper session management."""
        with get_db_context() as db:
            record = db.query(model).filter(filter_condition).first()
            if record:
                db.delete(record)
                db.commit()
                return True
            return False
