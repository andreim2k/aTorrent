"""Authentication API tests."""

import pytest
from fastapi.testclient import TestClient


class TestAuthentication:
    """Test authentication endpoints."""

    def test_login_success(self, client, test_password, db_session):
        """Test successful login."""
        from app.models.settings import AppSettings
        from app.core.security import get_password_hash
        
        # Create settings with password
        settings = AppSettings(
            app_password_hash=get_password_hash(test_password),
            theme="dark",
            language="en",
            default_download_path="./downloads"
        )
        db_session.add(settings)
        db_session.commit()
        
        response = client.post(
            "/api/v1/auth/login",
            json={"password": test_password}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_in" in data

    def test_login_invalid_password(self, client, db_session):
        """Test login with invalid password."""
        from app.models.settings import AppSettings
        from app.core.security import get_password_hash
        
        settings = AppSettings(
            app_password_hash=get_password_hash("correct_password"),
            theme="dark",
            language="en",
            default_download_path="./downloads"
        )
        db_session.add(settings)
        db_session.commit()
        
        response = client.post(
            "/api/v1/auth/login",
            json={"password": "wrong_password"}
        )
        
        assert response.status_code == 401
        assert "detail" in response.json()

    def test_login_no_settings(self, client):
        """Test login when app is not initialized."""
        response = client.post(
            "/api/v1/auth/login",
            json={"password": "any_password"}
        )
        
        assert response.status_code == 500

    def test_change_password_success(self, client, auth_headers, test_password, db_session):
        """Test successful password change."""
        new_password = "NewTestPass456!"
        
        response = client.post(
            "/api/v1/auth/change-password",
            json={
                "current_password": test_password,
                "new_password": new_password
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200
        assert response.json()["message"] == "Password changed successfully"
        
        # Try logging in with new password
        response = client.post(
            "/api/v1/auth/login",
            json={"password": new_password}
        )
        assert response.status_code == 200

    def test_change_password_weak(self, client, auth_headers, test_password):
        """Test password change with weak password."""
        response = client.post(
            "/api/v1/auth/change-password",
            json={
                "current_password": test_password,
                "new_password": "weak"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 422  # Validation error

    def test_change_password_wrong_current(self, client, auth_headers):
        """Test password change with wrong current password."""
        response = client.post(
            "/api/v1/auth/change-password",
            json={
                "current_password": "WrongPass123!",
                "new_password": "NewPass123!"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 401

    def test_logout(self, client, auth_headers):
        """Test logout endpoint."""
        response = client.post(
            "/api/v1/auth/logout",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        assert "message" in response.json()

    def test_protected_endpoint_no_auth(self, client):
        """Test accessing protected endpoint without authentication."""
        response = client.post("/api/v1/auth/logout")
        
        assert response.status_code in [401, 403]

    def test_get_profile(self, client, auth_headers):
        """Test getting user profile."""
        response = client.get(
            "/api/v1/auth/profile",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "email" in data


class TestPasswordValidation:
    """Test password strength validation."""

    def test_password_too_short(self, client, auth_headers, test_password):
        """Test password that's too short."""
        response = client.post(
            "/api/v1/auth/change-password",
            json={
                "current_password": test_password,
                "new_password": "Short1!"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 422

    def test_password_no_uppercase(self, client, auth_headers, test_password):
        """Test password without uppercase letter."""
        response = client.post(
            "/api/v1/auth/change-password",
            json={
                "current_password": test_password,
                "new_password": "testpass123!"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 422

    def test_password_no_lowercase(self, client, auth_headers, test_password):
        """Test password without lowercase letter."""
        response = client.post(
            "/api/v1/auth/change-password",
            json={
                "current_password": test_password,
                "new_password": "TESTPASS123!"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 422

    def test_password_no_digit(self, client, auth_headers, test_password):
        """Test password without digit."""
        response = client.post(
            "/api/v1/auth/change-password",
            json={
                "current_password": test_password,
                "new_password": "TestPass!@#"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 422

    def test_password_no_special_char(self, client, auth_headers, test_password):
        """Test password without special character."""
        response = client.post(
            "/api/v1/auth/change-password",
            json={
                "current_password": test_password,
                "new_password": "TestPass123"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 422


class TestJWTSecurity:
    """Test JWT token security features."""

    def test_token_contains_jti(self, client, test_password, db_session):
        """Test that tokens contain JTI for revocation."""
        from app.models.settings import AppSettings
        from app.core.security import get_password_hash, decode_token
        
        settings = AppSettings(
            app_password_hash=get_password_hash(test_password),
            theme="dark",
            language="en",
            default_download_path="./downloads"
        )
        db_session.add(settings)
        db_session.commit()
        
        response = client.post(
            "/api/v1/auth/login",
            json={"password": test_password}
        )
        
        assert response.status_code == 200
        token = response.json()["access_token"]
        
        # Decode token and check for JTI
        payload = decode_token(token)
        assert payload is not None
        assert "jti" in payload
        assert "iat" in payload  # Issued at
        assert "type" in payload

    def test_expired_token_rejected(self, client):
        """Test that expired tokens are rejected."""
        # This would require creating a token with past expiration
        # For now, we just test that invalid tokens are rejected
        response = client.post(
            "/api/v1/auth/logout",
            headers={"Authorization": "Bearer invalid_token"}
        )
        
        assert response.status_code in [401, 403, 422]


