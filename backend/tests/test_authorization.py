from datetime import UTC, datetime, timedelta

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db
from app.main import app
from app.models.user import Role, User

VALID_BOOK = {
    "isbn": "9786073112878",
    "title": "Cien años de soledad",
    "author": "Gabriel García Márquez",
    "genre": "Novela",
    "publication_year": 1967,
}

PROTECTED_REQUESTS = [
    ("get", "/api/books", {}),
    ("get", "/api/books/genres", {}),
    ("get", "/api/books/1", {}),
    ("post", "/api/books", {"json": VALID_BOOK}),
    ("put", "/api/books/1", {"json": VALID_BOOK}),
    ("delete", "/api/books/1", {}),
    ("get", "/api/users", {}),
    ("get", "/api/auth/me", {}),
]


@pytest.mark.parametrize(("method", "url", "kwargs"), PROTECTED_REQUESTS)
def test_protected_route_without_token_returns_401(
    client: TestClient,
    method: str,
    url: str,
    kwargs: dict,
) -> None:
    response = getattr(client, method)(url, **kwargs)

    assert response.status_code == 401
    assert response.json()["detail"] == "No autenticado"


def register_and_login(client: TestClient, email: str = "reader@test.local") -> str:
    password = "Lectura2026"
    registered = client.post(
        "/api/auth/register",
        json={"email": email, "full_name": "Usuario de prueba", "password": password},
    )
    assert registered.status_code == 201

    logged_in = client.post("/api/auth/login", json={"email": email, "password": password})
    assert logged_in.status_code == 200
    return logged_in.json()["access_token"]


def test_token_signed_with_another_secret_returns_401(client: TestClient) -> None:
    token = jwt.encode(
        {"sub": "1", "exp": datetime.now(UTC) + timedelta(minutes=5)},
        "otro-secreto-completamente-distinto",
        algorithm="HS256",
    )

    response = client.get("/api/books", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401
    assert response.json()["detail"] == "No autenticado"


def test_expired_token_returns_401(client: TestClient) -> None:
    token = jwt.encode(
        {"sub": "1", "exp": datetime.now(UTC) - timedelta(minutes=1)},
        settings.JWT_SECRET,
        algorithm="HS256",
    )

    response = client.get("/api/books", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401
    assert response.json()["detail"] == "No autenticado"


def test_valid_token_allows_reading_books(client: TestClient) -> None:
    token = register_and_login(client)

    response = client.get("/api/books", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["total"] == 0


@pytest.mark.parametrize(
    ("method", "url", "kwargs"),
    [
        ("post", "/api/books", {"json": VALID_BOOK}),
        ("put", "/api/books/1", {"json": VALID_BOOK}),
        ("delete", "/api/books/1", {}),
    ],
)
def test_reader_cannot_write_books(
    client: TestClient,
    auth_as,
    method: str,
    url: str,
    kwargs: dict,
) -> None:
    auth_as(Role.reader)

    response = getattr(client, method)(url, **kwargs)

    assert response.status_code == 403
    assert response.json()["detail"] == "No tienes permiso para esta acción"


def test_librarian_can_create_book(client: TestClient, auth_as) -> None:
    auth_as(Role.librarian)

    response = client.post("/api/books", json=VALID_BOOK)

    assert response.status_code == 201
    assert response.json()["title"] == VALID_BOOK["title"]


def test_librarian_cannot_list_users(client: TestClient, auth_as) -> None:
    auth_as(Role.librarian)

    response = client.get("/api/users")

    assert response.status_code == 403
    assert response.json()["detail"] == "No tienes permiso para esta acción"


def test_admin_can_list_users(client: TestClient, auth_as) -> None:
    auth_as(Role.admin)

    response = client.get("/api/users")

    assert response.status_code == 200
    assert response.json() == {"items": [], "total": 0, "page": 1, "size": 10}


def deactivate_user(email: str) -> None:
    session_generator = app.dependency_overrides[get_db]()
    db = next(session_generator)
    try:
        user = db.scalar(select(User).where(User.email == email))
        assert user is not None
        user.is_active = False
        db.commit()
    finally:
        session_generator.close()


def test_disabled_user_token_returns_403(client: TestClient) -> None:
    email = "disabled@test.local"
    token = register_and_login(client, email)
    deactivate_user(email)

    response = client.get("/api/books", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 403
    assert response.json()["detail"] == "La cuenta está desactivada"
