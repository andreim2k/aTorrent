"""Google OAuth authentication module."""

from google.oauth2 import id_token
from google.auth.transport import requests
from typing import Optional, Dict, Any
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class GoogleOAuth:
    """Google OAuth authentication handler."""
    
    def __init__(self):
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.allowed_domains = settings.ALLOWED_GOOGLE_DOMAINS
    
    async def verify_token(self, credential: str) -> Optional[Dict[str, Any]]:
        """
        Verify Google OAuth token and return user information.
        
        Args:
            credential: Google ID token from OAuth flow
            
        Returns:
            Dict with user info (email, name, picture, google_id) or None if invalid
        """
        try:
            # Verify the token
            idinfo = id_token.verify_oauth2_token(
                credential, 
                requests.Request(), 
                self.client_id
            )
            
            # Verify the token was issued by Google
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                logger.warning(f"Invalid token issuer: {idinfo.get('iss')}")
                return None
            
            # Extract user information
            email = idinfo.get('email')
            if not email:
                logger.warning("No email in Google token")
                return None
            
            # Check if email is verified
            if not idinfo.get('email_verified', False):
                logger.warning(f"Unverified email: {email}")
                return None
            
            # Check domain restrictions if configured
            if self.allowed_domains:
                email_domain = email.split('@')[1] if '@' in email else ''
                if email_domain not in self.allowed_domains:
                    logger.warning(f"Email domain not allowed: {email_domain}")
                    return None
            
            user_info = {
                'email': email,
                'name': idinfo.get('name', ''),
                'picture': idinfo.get('picture', ''),
                'google_id': idinfo.get('sub', ''),  # Google user ID
            }
            
            logger.info(f"Successfully authenticated Google user: {email}")
            return user_info
            
        except ValueError as e:
            # Token is invalid
            logger.error(f"Invalid Google token: {e}")
            return None
        except Exception as e:
            logger.error(f"Error verifying Google token: {e}", exc_info=True)
            return None
    
    def is_configured(self) -> bool:
        """Check if Google OAuth is properly configured."""
        return bool(self.client_id and self.client_id != "")


# Global instance
google_oauth = GoogleOAuth()


