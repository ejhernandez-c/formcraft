from fastapi.testclient import TestClient


def test_users_me_requires_authentication(client: TestClient) -> None:
    response = client.get("/api/users/me")

    assert response.status_code == 401
    body = response.json()
    assert body["error"]["code"] == "UNAUTHORIZED"


def test_forms_list_requires_authentication(client: TestClient) -> None:
    response = client.get("/api/forms")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


def test_forms_create_requires_authentication(client: TestClient) -> None:
    response = client.post("/api/forms", json={"name": "Untitled", "form_type": "survey"})

    assert response.status_code == 401


def test_invalid_bearer_token_is_rejected(client: TestClient) -> None:
    response = client.get("/api/users/me", headers={"Authorization": "Bearer not-a-real-token"})

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"
