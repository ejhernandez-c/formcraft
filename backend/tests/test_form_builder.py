from collections.abc import Callable

from fastapi.testclient import TestClient
from httpx import Response

AuthHeaders = Callable[[str | None], dict[str, str]]


def _create_form(client: TestClient, headers: dict[str, str]) -> Response:
    response: Response = client.post(
        "/api/forms",
        json={"name": "Encuesta con secciones", "form_type": "survey"},
        headers=headers,
    )
    return response


def _create_section(client: TestClient, headers: dict[str, str], form_id: str) -> Response:
    response: Response = client.post(
        f"/api/forms/{form_id}/sections", json={"title": "Sección 1"}, headers=headers
    )
    return response


def test_create_section_appends_at_the_end(
    client: TestClient, make_auth_headers: AuthHeaders
) -> None:
    headers = make_auth_headers(None)
    form_id = _create_form(client, headers).json()["id"]

    first = _create_section(client, headers, form_id).json()
    second = client.post(
        f"/api/forms/{form_id}/sections", json={"title": "Sección 2"}, headers=headers
    ).json()

    assert first["order_index"] == 0
    assert second["order_index"] == 1


def test_a_non_owner_cannot_see_sections(
    client: TestClient, make_auth_headers: AuthHeaders
) -> None:
    owner_headers = make_auth_headers(None)
    other_headers = make_auth_headers(None)
    form_id = _create_form(client, owner_headers).json()["id"]
    _create_section(client, owner_headers, form_id)

    response = client.get(f"/api/forms/{form_id}/sections", headers=other_headers)

    assert response.status_code == 404


def test_reorder_sections(client: TestClient, make_auth_headers: AuthHeaders) -> None:
    headers = make_auth_headers(None)
    form_id = _create_form(client, headers).json()["id"]
    first = _create_section(client, headers, form_id).json()
    second = client.post(
        f"/api/forms/{form_id}/sections", json={"title": "Sección 2"}, headers=headers
    ).json()

    response = client.post(
        f"/api/forms/{form_id}/sections/reorder",
        json=[
            {"id": first["id"], "order_index": 1},
            {"id": second["id"], "order_index": 0},
        ],
        headers=headers,
    )

    assert response.status_code == 200
    by_id = {item["id"]: item["order_index"] for item in response.json()}
    assert by_id[first["id"]] == 1
    assert by_id[second["id"]] == 0


def test_create_question_element_with_options(
    client: TestClient, make_auth_headers: AuthHeaders
) -> None:
    headers = make_auth_headers(None)
    form_id = _create_form(client, headers).json()["id"]
    section_id = _create_section(client, headers, form_id).json()["id"]

    response = client.post(
        f"/api/forms/{form_id}/sections/{section_id}/elements",
        json={
            "element_kind": "question",
            "control_type": "radio",
            "label": "¿Color favorito?",
            "validation": {"required": True},
            "options": [{"label": "Rojo"}, {"label": "Azul"}],
        },
        headers=headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert len(body["options"]) == 2
    assert body["validation"]["required"] is True


def test_choice_control_requires_at_least_one_option(
    client: TestClient, make_auth_headers: AuthHeaders
) -> None:
    headers = make_auth_headers(None)
    form_id = _create_form(client, headers).json()["id"]
    section_id = _create_section(client, headers, form_id).json()["id"]

    response = client.post(
        f"/api/forms/{form_id}/sections/{section_id}/elements",
        json={"element_kind": "question", "control_type": "dropdown", "options": []},
        headers=headers,
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_non_choice_control_rejects_options(
    client: TestClient, make_auth_headers: AuthHeaders
) -> None:
    headers = make_auth_headers(None)
    form_id = _create_form(client, headers).json()["id"]
    section_id = _create_section(client, headers, form_id).json()["id"]

    response = client.post(
        f"/api/forms/{form_id}/sections/{section_id}/elements",
        json={
            "element_kind": "question",
            "control_type": "short_text",
            "options": [{"label": "shouldn't be here"}],
        },
        headers=headers,
    )

    assert response.status_code == 422


def test_control_type_must_match_element_kind(
    client: TestClient, make_auth_headers: AuthHeaders
) -> None:
    headers = make_auth_headers(None)
    form_id = _create_form(client, headers).json()["id"]
    section_id = _create_section(client, headers, form_id).json()["id"]

    response = client.post(
        f"/api/forms/{form_id}/sections/{section_id}/elements",
        json={"element_kind": "content", "control_type": "short_text"},
        headers=headers,
    )

    assert response.status_code == 422


def test_update_element_replaces_options(
    client: TestClient, make_auth_headers: AuthHeaders
) -> None:
    headers = make_auth_headers(None)
    form_id = _create_form(client, headers).json()["id"]
    section_id = _create_section(client, headers, form_id).json()["id"]
    element = client.post(
        f"/api/forms/{form_id}/sections/{section_id}/elements",
        json={
            "element_kind": "question",
            "control_type": "checkbox",
            "options": [{"label": "A"}, {"label": "B"}],
        },
        headers=headers,
    ).json()

    response = client.put(
        f"/api/forms/{form_id}/elements/{element['id']}",
        json={
            "element_kind": "question",
            "control_type": "checkbox",
            "options": [{"label": "C"}],
        },
        headers=headers,
    )

    assert response.status_code == 200
    options = response.json()["options"]
    assert len(options) == 1
    assert options[0]["label"] == "C"


def test_reorder_elements_can_move_between_sections(
    client: TestClient, make_auth_headers: AuthHeaders
) -> None:
    headers = make_auth_headers(None)
    form_id = _create_form(client, headers).json()["id"]
    section_a = _create_section(client, headers, form_id).json()
    section_b = client.post(
        f"/api/forms/{form_id}/sections", json={"title": "Sección 2"}, headers=headers
    ).json()
    element = client.post(
        f"/api/forms/{form_id}/sections/{section_a['id']}/elements",
        json={"element_kind": "content", "control_type": "divider"},
        headers=headers,
    ).json()

    response = client.post(
        f"/api/forms/{form_id}/elements/reorder",
        json=[{"id": element["id"], "section_id": section_b["id"], "order_index": 0}],
        headers=headers,
    )

    assert response.status_code == 200
    moved = next(item for item in response.json() if item["id"] == element["id"])
    assert moved["section_id"] == section_b["id"]


def test_delete_section_cascades_to_its_elements(
    client: TestClient, make_auth_headers: AuthHeaders
) -> None:
    headers = make_auth_headers(None)
    form_id = _create_form(client, headers).json()["id"]
    section_id = _create_section(client, headers, form_id).json()["id"]
    client.post(
        f"/api/forms/{form_id}/sections/{section_id}/elements",
        json={"element_kind": "content", "control_type": "divider"},
        headers=headers,
    )

    delete_response = client.delete(f"/api/forms/{form_id}/sections/{section_id}", headers=headers)
    elements_response = client.get(f"/api/forms/{form_id}/elements", headers=headers)

    assert delete_response.status_code == 204
    assert elements_response.json() == []


def test_cannot_edit_an_archived_form(client: TestClient, make_auth_headers: AuthHeaders) -> None:
    headers = make_auth_headers(None)
    form_id = _create_form(client, headers).json()["id"]
    client.post(f"/api/forms/{form_id}/publish", headers=headers)
    client.post(f"/api/forms/{form_id}/close", headers=headers)
    client.post(f"/api/forms/{form_id}/archive", headers=headers)

    response = client.post(
        f"/api/forms/{form_id}/sections", json={"title": "Too late"}, headers=headers
    )

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "CONFLICT"
