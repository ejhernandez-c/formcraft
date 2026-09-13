from fastapi import APIRouter

from app.core.security import create_local_dev_token
from app.modules.auth.schemas import DevLoginRequest, TokenResponse

# Only included in app/main.py when settings.auth_mode == 'local' — this
# endpoint issues a self-signed token and must never be reachable when a
# real Cognito user pool is configured.
router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/dev-login", response_model=TokenResponse)
def dev_login(payload: DevLoginRequest) -> TokenResponse:
    """Local-dev stand-in for Cognito email authentication (see
    docs/SECURITY.md §2). Mints a token for the given email; the user row is
    upserted lazily by get_current_user on the first authenticated call."""
    token = create_local_dev_token(email=payload.email, name=payload.name)
    return TokenResponse(access_token=token)
