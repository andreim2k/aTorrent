from pydantic import BaseModel, EmailStr
from typing import Optional, List


class Login(BaseModel):
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenData(BaseModel):
    user_id: Optional[int] = None
    scopes: List[str] = []


class RefreshToken(BaseModel):
    refresh_token: str
