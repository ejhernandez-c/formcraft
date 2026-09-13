from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.errors import UnauthorizedError
from app.core.security import TokenError, verify_access_token
from app.modules.users.models import User
from app.modules.users.service import get_or_create_user

# auto_error=False so a missing Authorization header goes through our own
# error envelope (UnauthorizedError) instead of FastAPI's default 403 shape.
_bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Verifies the bearer token (Cognito or local-dev, see
    app/core/security.py) and returns the corresponding User, upserting it
    on first sight. Every creator-facing route depends on this — see
    docs/SECURITY.md §2."""
    if credentials is None:
        raise UnauthorizedError("Missing or invalid Authorization header.")

    try:
        payload = verify_access_token(credentials.credentials)
    except TokenError as exc:
        raise UnauthorizedError("Missing or invalid Authorization header.") from exc

    return get_or_create_user(db, sub=payload.sub, email=payload.email, name=payload.name)
