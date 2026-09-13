from collections.abc import Callable

from fastapi.testclient import TestClient


def test_me_returns_the_authenticated_users_profile(
    client: TestClient, make_auth_headers: Callable[[str | None], dict[str, str]]
) -> None:
    headers = make_auth_headers("Ada Lovelace")

    response = client.get("/api/users/me", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Ada Lovelace"
    assert "@example.com" in body["email"]
    assert "id" in body
