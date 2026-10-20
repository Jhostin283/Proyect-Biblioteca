from fastapi.testclient import TestClient

from app.core.config import settings
from app.models.user import Role

REGISTER_URL = "/api/auth/register"
LOGIN_URL = "/api/auth/login"
USERS_URL = "/api/users"

VALID_BOOK = {
    "isbn": "9786073112878",
    "title": "Cien años de soledad",
    "author": "Gabriel García Márquez",
    "genre": "Novela",
    "publication_year": 1967,
}


def register(
    client: TestClient,
    email: str,
    full_name: str = "Usuario de prueba",
    password: str = "Lectura2026",
) -> dict:
    response = client.post(
        REGISTER_URL,
        json={"email": email, "full_name": full_name, "password": password},
    )
    assert response.status_code == 201, response.text
    return response.json()


def login(client: TestClient, email: str, password: str = "Lectura2026") -> str:
    response = client.post(LOGIN_URL, json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def admin_token(client: TestClient) -> str:
    return login(client, settings.ADMIN_EMAIL, settings.ADMIN_PASSWORD)


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def admin_id(client: TestClient, token: str) -> int:
    return client.get("/api/auth/me", headers=auth(token)).json()["id"]


def test_admin_lists_users(client: TestClient) -> None:
    token = admin_token(client)

    response = client.get(USERS_URL, headers=auth(token))

    assert response.status_code == 200
    body = response.json()
    assert body["page"] == 1
    assert body["size"] == 10
    assert body["total"] >= 1
    assert any(user["email"] == settings.ADMIN_EMAIL for user in body["items"])
    assert "hashed_password" not in body["items"][0]


def test_admin_searches_users_by_email_or_name(client: TestClient) -> None:
    register(client, "ana@correo.com", "Ana Pérez")
    register(client, "luis@correo.com", "Luis Soto")
    token = admin_token(client)

    response = client.get(f"{USERS_URL}?q=ana", headers=auth(token))

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert len(body["items"]) == 1
    assert body["items"][0]["full_name"] == "Ana Pérez"
    assert body["page"] == 1
    assert body["size"] == 10


def test_admin_paginates_users(client: TestClient) -> None:
    register(client, "ana@correo.com", "Ana Pérez")
    register(client, "luis@correo.com", "Luis Soto")
    token = admin_token(client)

    first = client.get(f"{USERS_URL}?page=1&size=1", headers=auth(token))
    second = client.get(f"{USERS_URL}?page=2&size=1", headers=auth(token))

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["size"] == 1
    assert first.json()["page"] == 1
    assert len(first.json()["items"]) == 1
    assert second.json()["page"] == 2
    assert len(second.json()["items"]) == 1
    assert first.json()["items"][0]["id"] != second.json()["items"][0]["id"]


def test_librarian_cannot_list_users(client: TestClient, auth_as) -> None:
    auth_as(Role.librarian)

    response = client.get(USERS_URL)

    assert response.status_code == 403
    assert response.json()["detail"] == "No tienes permiso para esta acción"


def test_users_requires_authentication(client: TestClient) -> None:
    response = client.get(USERS_URL)

    assert response.status_code == 401
    assert response.json()["detail"] == "No autenticado"


def test_admin_promotes_reader_to_librarian(client: TestClient) -> None:
    created = register(client, "lectora@correo.com", "Lectora")
    token = admin_token(client)

    response = client.patch(
        f"{USERS_URL}/{created['id']}",
        json={"role": "librarian"},
        headers=auth(token),
    )

    assert response.status_code == 200
    assert response.json()["role"] == Role.librarian.value

    reader_token = login(client, "lectora@correo.com")
    book = client.post("/api/books", json=VALID_BOOK, headers=auth(reader_token))
    assert book.status_code == 201


def test_patch_invalid_role_returns_422(client: TestClient) -> None:
    created = register(client, "lectora@correo.com", "Lectora")
    token = admin_token(client)

    response = client.patch(
        f"{USERS_URL}/{created['id']}",
        json={"role": "superuser"},
        headers=auth(token),
    )

    assert response.status_code == 422


def test_patch_missing_user_returns_404(client: TestClient) -> None:
    token = admin_token(client)

    response = client.patch(
        f"{USERS_URL}/9999",
        json={"role": "reader"},
        headers=auth(token),
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Usuario no encontrado"


def test_admin_cannot_demote_self(client: TestClient) -> None:
    token = admin_token(client)
    own_id = admin_id(client, token)

    response = client.patch(
        f"{USERS_URL}/{own_id}",
        json={"role": "reader"},
        headers=auth(token),
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "No puedes quitarte tu propio rol de administrador"


def test_admin_cannot_deactivate_self(client: TestClient) -> None:
    token = admin_token(client)
    own_id = admin_id(client, token)

    response = client.patch(
        f"{USERS_URL}/{own_id}",
        json={"is_active": False},
        headers=auth(token),
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "No puedes desactivar tu propia cuenta"


def test_deactivate_and_reactivate_user(client: TestClient) -> None:
    created = register(client, "lectora@correo.com", "Lectora")
    user_token = login(client, "lectora@correo.com")
    token = admin_token(client)

    deactivated = client.patch(
        f"{USERS_URL}/{created['id']}",
        json={"is_active": False},
        headers=auth(token),
    )
    assert deactivated.status_code == 200
    assert deactivated.json()["is_active"] is False

    blocked = client.get("/api/books", headers=auth(user_token))
    assert blocked.status_code == 403
    assert blocked.json()["detail"] == "La cuenta está desactivada"

    login_disabled = client.post(
        LOGIN_URL,
        json={"email": "lectora@correo.com", "password": "Lectura2026"},
    )
    assert login_disabled.status_code == 403
    assert login_disabled.json()["detail"] == "La cuenta está desactivada"

    reactivated = client.patch(
        f"{USERS_URL}/{created['id']}",
        json={"is_active": True},
        headers=auth(token),
    )
    assert reactivated.status_code == 200
    assert reactivated.json()["is_active"] is True

    login_enabled = client.post(
        LOGIN_URL,
        json={"email": "lectora@correo.com", "password": "Lectura2026"},
    )
    assert login_enabled.status_code == 200
