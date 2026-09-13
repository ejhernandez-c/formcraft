from pydantic import BaseModel, EmailStr, Field


class DevLoginRequest(BaseModel):
    """Local-only auth stand-in — see docs/SECURITY.md §2 and
    app/core/security.py. Never mounted outside settings.auth_mode == 'local'."""

    email: EmailStr
    name: str = Field(min_length=1, max_length=255)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
