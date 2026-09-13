import time

import jwt
import pytest

from app.core.config import get_settings
from app.core.security import TokenError, create_local_dev_token, verify_access_token


def test_local_dev_token_round_trip() -> None:
    """The local-dev auth stand-in must verify a token it minted itself —
    this is the one auth code path testable without a live Cognito pool or
    a database (see docs/SECURITY.md §2)."""
    token = create_local_dev_token(email="Ada@Example.com", name="Ada Lovelace")

    payload = verify_access_token(token)

    assert payload.email == "ada@example.com"
    assert payload.sub == "local:ada@example.com"
    assert payload.name == "Ada Lovelace"


def test_local_dev_token_rejects_tampering() -> None:
    token = create_local_dev_token(email="ada@example.com", name="Ada")
    tampered = token[:-1] + ("A" if token[-1] != "A" else "B")

    with pytest.raises(TokenError):
        verify_access_token(tampered)


def test_local_dev_token_rejects_expired() -> None:
    settings = get_settings()
    now = int(time.time())
    expired_claims = {
        "sub": "local:ada@example.com",
        "email": "ada@example.com",
        "name": "Ada",
        "iat": now - 120,
        "exp": now - 60,
    }
    expired_token = jwt.encode(expired_claims, settings.local_auth_secret, algorithm="HS256")

    with pytest.raises(TokenError):
        verify_access_token(expired_token)
