"""Pytest configuration and fixtures."""

import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set development mode for testing
os.environ["DEVELOPMENT_MODE"] = "true"

from app.main import app
from app.db.database import Base, get_db
from app.core.config import settings


# Test database setup
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for tests."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with overridden dependencies."""
    app.dependency_overrides[get_db] = override_get_db
    
    # Initialize app state for testing
    from app.core.websocket_manager import WebSocketManager
    app.state.websocket_manager = WebSocketManager()
    app.state.torrent_service = None
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def test_password():
    """Test password that meets requirements."""
    return "TestPass123!"


@pytest.fixture
def mock_google_token():
    """Mock Google OAuth token for testing."""
    return "mock_google_token_1234567890"


@pytest.fixture
def auth_headers(client, test_password, db_session):
    """Get authentication headers for protected endpoints."""
    from app.models.settings import AppSettings
    from app.core.security import get_password_hash
    
    # Create test settings with password
    settings_obj = AppSettings(
        app_password_hash=get_password_hash(test_password),
        theme="dark",
        language="en",
        default_download_path="./test_downloads",
        max_download_speed=0,
        max_upload_speed=0,
        max_active_downloads=5,
        auto_start_downloads=True,
        enable_notifications=True
    )
    db_session.add(settings_obj)
    db_session.commit()
    
    # Login to get token
    response = client.post(
        "/api/v1/auth/login",
        json={"password": test_password}
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    
    return {"Authorization": f"Bearer {token}"}

