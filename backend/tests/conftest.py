import uuid
from collections.abc import Callable

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def make_auth_headers(client: TestClient) -> Callable[[str | None], dict[str, str]]:
    """Logs in a fresh creator via the local dev-login stand-in (see
    app/modules/auth/router.py) and returns Authorization headers for them.
    A random email per call keeps each test's user isolated even though
    these tests run against a real, persistent database (no per-test
    transaction rollback — see docs/PHASES/PHASE-2.md known limitations)."""

    def _make(name: str | None = None) -> dict[str, str]:
        email = f"{uuid.uuid4().hex}@example.com"
        response = client.post(
            "/api/auth/dev-login", json={"email": email, "name": name or "Test Creator"}
        )
        assert response.status_code == 200, response.text
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    return _make
