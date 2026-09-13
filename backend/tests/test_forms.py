from collections.abc import Callable

from fastapi.testclient import TestClient
from httpx import Response

AuthHeaders = Callable[[str | None], dict[str, str]]


def _create_form(
    client: TestClient, headers: dict[str, str], name: str = "Encuesta de prueba"
) -> Response:
    response: Response = client.post(
        "/api/forms", json={"name": name, "form_type": "survey"}, headers=headers
    )
    return response


def test_create_form_starts_as_draft_with_an_opaque_slug(
    client: TestClient, make_auth_headers: AuthHeaders
) -> None:
    headers = make_auth_headers(None)

    response = _create_form(client, headers)

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "draft"
    assert body["response_count"] == 0
    assert body["slug"] and body["slug"].isalnum()
    # Public identifier must not leak the internal UUID (CLAUDE.md §69).
    assert body["slug"] != body["id"]


def test_list_forms_is_scoped_to_the_authenticated_owner(
    client: TestClient, make_auth_headers: AuthHeaders
) -> None:
    owner_headers = make_auth_headers(None)
    other_headers = make_auth_headers(None)
    _create_form(client, owner_headers, "Formulario de A")
    _create_form(client, other_headers, "Formulario de B")

    response = client.get("/api/forms", headers=owner_headers)

    assert response.status_code == 200
    body = response.json()
    names = [item["name"] for item in body["items"]]
    assert "Formulario de A" in names
    assert "Formulario de B" not in names


def test_a_non_owner_gets_404_not_403(client: TestClient, make_auth_headers: AuthHeaders) -> None:
    owner_headers = make_auth_headers(None)
    other_headers = make_auth_headers(None)
    form_id = _create_form(client, owner_headers).json()["id"]

    response = client.get(f"/api/forms/{form_id}", headers=other_headers)

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


def _valid_update_payload(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "name": "Encuesta actualizada",
        "identification_type": "anonymous",
        "allow_multiple_responses": False,
        "response_limit_enabled": False,
        "max_responses": None,
        "one_response_per_email": False,
        "open_at": None,
        "close_at": None,
        "settings": {},
        "theme": {},
    }
    payload.update(overrides)
    return payload


def test_update_form_replaces_metadata(client: TestClient, make_auth_headers: AuthHeaders) -> None:
    headers = make_auth_headers(None)
    form_id = _create_form(client, headers).json()["id"]

    response = client.put(f"/api/forms/{form_id}", json=_valid_update_payload(), headers=headers)

    assert response.status_code == 200
    assert response.json()["name"] == "Encuesta actualizada"


def test_new_form_has_no_description_and_update_can_set_it(
    client: TestClient, make_auth_headers: AuthHeaders
) -> None:
    headers = make_auth_headers(None)
    created = _create_form(client, headers).json()
    assert created["description"] is None

    response = client.put(
        f"/api/forms/{created['id']}",
        json=_valid_update_payload(description="Una breve descripción."),
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["description"] == "Una breve descripción."


def test_response_limit_enabled_requires_max_responses(
    client: TestClient, make_auth_headers: AuthHeaders
) -> None:
    headers = make_auth_headers(None)
    form_id = _create_form(client, headers).json()["id"]

    response = client.put(
        f"/api/forms/{form_id}",
        json=_valid_update_payload(response_limit_enabled=True, max_responses=None),
        headers=headers,
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_publish_then_close_then_archive_lifecycle(
    client: TestClient, make_auth_headers: AuthHeaders
) -> None:
    headers = make_auth_headers(None)
    form_id = _create_form(client, headers).json()["id"]

    publish = client.post(f"/api/forms/{form_id}/publish", headers=headers)
    assert publish.status_code == 200
    assert publish.json()["status"] == "published"
    assert publish.json()["published_at"] is not None

    close = client.post(f"/api/forms/{form_id}/close", headers=headers)
    assert close.status_code == 200
    assert close.json()["status"] == "closed"

    archive = client.post(f"/api/forms/{form_id}/archive", headers=headers)
    assert archive.status_code == 200
    assert archive.json()["status"] == "archived"


def test_cannot_close_a_form_that_was_never_published(
    client: TestClient, make_auth_headers: AuthHeaders
) -> None:
    headers = make_auth_headers(None)
    form_id = _create_form(client, headers).json()["id"]

    response = client.post(f"/api/forms/{form_id}/close", headers=headers)

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "CONFLICT"


def test_cannot_publish_an_archived_form(
    client: TestClient, make_auth_headers: AuthHeaders
) -> None:
    headers = make_auth_headers(None)
    form_id = _create_form(client, headers).json()["id"]
    client.post(f"/api/forms/{form_id}/publish", headers=headers)
    client.post(f"/api/forms/{form_id}/close", headers=headers)
    client.post(f"/api/forms/{form_id}/archive", headers=headers)

    response = client.post(f"/api/forms/{form_id}/publish", headers=headers)

    assert response.status_code == 409


def test_duplicate_form_creates_a_new_draft_with_a_distinct_slug(
    client: TestClient, make_auth_headers: AuthHeaders
) -> None:
    headers = make_auth_headers(None)
    original = _create_form(client, headers, "Formulario original").json()

    response = client.post(f"/api/forms/{original['id']}/duplicate", headers=headers)

    assert response.status_code == 201
    copy = response.json()
    assert copy["id"] != original["id"]
    assert copy["slug"] != original["slug"]
    assert copy["status"] == "draft"
    assert "copia" in copy["name"]
