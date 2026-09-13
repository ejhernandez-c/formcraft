from fastapi.testclient import TestClient


def test_dev_login_issues_a_bearer_token(client: TestClient) -> None:
    response = client.post(
        "/api/auth/dev-login", json={"email": "ada@example.com", "name": "Ada Lovelace"}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert isinstance(body["access_token"], str) and body["access_token"]


def test_dev_login_rejects_invalid_email(client: TestClient) -> None:
    response = client.post("/api/auth/dev-login", json={"email": "not-an-email", "name": "Ada"})

    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert "email" in body["error"]["fields"]
