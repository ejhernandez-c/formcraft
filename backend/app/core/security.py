"""Access-token verification — see docs/SECURITY.md §2.

Production path: verify a Cognito-issued JWT against the user pool's JWKS
(RS256). Local-dev path: verify a token minted by our own /api/auth/dev-login
endpoint (HS256, signed with `local_auth_secret`) so Phase 2 is testable
without a provisioned Cognito user pool — see app/core/config.py:auth_mode.

Both paths converge on the same TokenPayload shape, so app/modules/auth/deps.py
does not need to know which mode is active.
"""

import time
from dataclasses import dataclass

import httpx
import jwt
from jwt import PyJWKClient

from app.core.config import get_settings

_LOCAL_ALGORITHM = "HS256"
_COGNITO_ALGORITHM = "RS256"

_jwk_client: PyJWKClient | None = None


@dataclass(frozen=True)
class TokenPayload:
    sub: str
    email: str
    name: str


class TokenError(Exception):
    """Raised for any invalid/expired/malformed token — deliberately
    generic so callers never leak *why* verification failed."""


def _cognito_issuer(settings: object) -> str:
    return (
        f"https://cognito-idp.{settings.cognito_region}"  # type: ignore[attr-defined]
        f".amazonaws.com/{settings.cognito_user_pool_id}"  # type: ignore[attr-defined]
    )


def _get_jwk_client() -> PyJWKClient:
    global _jwk_client
    if _jwk_client is None:
        settings = get_settings()
        jwks_url = f"{_cognito_issuer(settings)}/.well-known/jwks.json"
        _jwk_client = PyJWKClient(jwks_url, cache_keys=True)
    return _jwk_client


def _verify_cognito_token(token: str) -> TokenPayload:
    settings = get_settings()
    try:
        signing_key = _get_jwk_client().get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=[_COGNITO_ALGORITHM],
            audience=settings.cognito_app_client_id,
            issuer=_cognito_issuer(settings),
        )
    except (jwt.PyJWTError, httpx.HTTPError) as exc:
        raise TokenError("Invalid Cognito token") from exc

    sub = claims.get("sub")
    email = claims.get("email")
    if not sub or not email:
        raise TokenError("Cognito token missing required claims")
    name = claims.get("name") or email
    return TokenPayload(sub=sub, email=email, name=name)


def _verify_local_token(token: str) -> TokenPayload:
    settings = get_settings()
    try:
        claims = jwt.decode(token, settings.local_auth_secret, algorithms=[_LOCAL_ALGORITHM])
    except jwt.PyJWTError as exc:
        raise TokenError("Invalid local dev token") from exc

    sub = claims.get("sub")
    email = claims.get("email")
    if not sub or not email:
        raise TokenError("Local dev token missing required claims")
    name = claims.get("name") or email
    return TokenPayload(sub=sub, email=email, name=name)


def verify_access_token(token: str) -> TokenPayload:
    settings = get_settings()
    if settings.auth_mode == "cognito":
        return _verify_cognito_token(token)
    return _verify_local_token(token)


def create_local_dev_token(*, email: str, name: str) -> str:
    """Mints an HS256 token for the local-dev auth stand-in. Only ever
    called from the /api/auth/dev-login route, which is itself only mounted
    when settings.auth_mode == 'local' — see app/main.py."""
    settings = get_settings()
    now = int(time.time())
    claims = {
        "sub": f"local:{email.lower()}",
        "email": email.lower(),
        "name": name,
        "iat": now,
        "exp": now + settings.local_auth_token_expire_minutes * 60,
    }
    return jwt.encode(claims, settings.local_auth_secret, algorithm=_LOCAL_ALGORITHM)
