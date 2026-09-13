from fastapi.testclient import TestClient


def test_liveness_returns_ok(client: TestClient) -> None:
    """The plain /health check has no dependencies (not even the database)
    so it must succeed even if the DB is unreachable — see
    app/modules/common/router.py."""
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
