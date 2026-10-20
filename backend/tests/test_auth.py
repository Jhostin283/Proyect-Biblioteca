from collections.abc import Generator
from datetime import UTC, datetime, timedelta

import jwt
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.main import app
from app.models.user import Role, User
from app.services.auth_service import ensure_initial_admin

REGISTER_URL = "/api/auth/register"
LOGIN_URL = "/api/auth/login"
ME_URL = "/api/auth/me"


def _register(
    client: TestClient,
    email: str = "ana@correo.com",
    password: str = "Lectura2026",
    **extra,
):
    body = {"email": email, "full_name": "Ana López", "password": password, **extra}
    return client.post(REGISTER_URL, json=body)


def _login(client: TestClient, email: str, password: str):
    return client.post(LOGIN_URL, json={"email": email, "password": password})


def _db_session() -> Generator[Session, None, None]:
    # Reutiliza la sesión SQLite del fixture `client` (StaticPool: la misma conexión)
    override = app.dependency_overrides.get(get_db)
    assert override is not None, "el fixture `client` debe sobreescribir get_db"
    return override()


# ---------------------------------------------------------------- Registro


def test_register_success_returns_201_with_reader_role(client: TestClient) -> None:
    response = _register(client)
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "ana@correo.com"
    assert body["full_name"] == "Ana López"
    assert body["role"] == Role.reader.value
    assert "id" in body
    assert "password" not in body
    assert "hashed_password" not in body


def test_register_duplicate_email_returns_409(client: TestClient) -> None:
    _register(client)
    response = _register(client)
    assert response.status_code == 409
    assert response.json()["detail"] == "El email ya está registrado"


def test_register_weak_password_returns_422(client: TestClient) -> None:
    response = _register(client, password="12345678")
    assert response.status_code == 422
    detail = str(response.json()["detail"])
    assert "8 caracteres" in detail
    assert "letra" in detail
    assert "número" in detail


def test_register_ignores_role_field(client: TestClient) -> None:
    response = _register(client, role="admin")
    assert response.status_code == 201
    assert response.json()["role"] == Role.reader.value


# --------------------------------------------------- Almacenamiento seguro


def test_hashed_password_stored_as_argon2_in_database(client: TestClient) -> None:
    _register(client)
    session_gen = _db_session()
    session = next(session_gen)
    try:
        user = session.query(User).filter_by(email="ana@correo.com").one()
        assert user.hashed_password.startswith("$argon2")
        assert "Lectura2026" not in user.hashed_password
    finally:
        session.close()


def test_no_response_contains_password_fields(client: TestClient) -> None:
    register_body = _register(client).json()
    token = _login(client, "ana@correo.com", "Lectura2026").json()["access_token"]
    me_body = client.get(ME_URL, headers={"Authorization": f"Bearer {token}"}).json()

    for body in (register_body, me_body):
        assert "password" not in body
        assert "hashed_password" not in body


# ---------------------------------------------------------------- Login


def test_login_success_returns_token(client: TestClient) -> None:
    _register(client)
    response = _login(client, "ana@correo.com", "Lectura2026")
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["expires_in"] == 3600
    assert isinstance(body["access_token"], str)
    assert body["access_token"]


def test_login_wrong_credentials_returns_401_with_same_message(client: TestClient) -> None:
    _register(client)
    wrong_password = _login(client, "ana@correo.com", "clave-mala1")
    unknown_email = _login(client, "nadie@correo.com", "Lectura2026")

    assert wrong_password.status_code == 401
    assert unknown_email.status_code == 401
    assert wrong_password.json()["detail"] == "Email o contraseña incorrectos"
    assert unknown_email.json()["detail"] == "Email o contraseña incorrectos"


def test_login_disabled_account_returns_403(client: TestClient) -> None:
    _register(client)
    session_gen = _db_session()
    session = next(session_gen)
    try:
        user = session.query(User).filter_by(email="ana@correo.com").one()
        user.is_active = False
        session.commit()
    finally:
        session.close()

    response = _login(client, "ana@correo.com", "Lectura2026")
    assert response.status_code == 403
    assert response.json()["detail"] == "La cuenta está desactivada"


# ---------------------------------------------------------------- Perfil


def test_me_returns_profile_with_valid_token(client: TestClient) -> None:
    _register(client)
    token = _login(client, "ana@correo.com", "Lectura2026").json()["access_token"]

    response = client.get(ME_URL, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "ana@correo.com"
    assert body["full_name"] == "Ana López"
    assert body["role"] == Role.reader.value
    assert body["is_active"] is True


def test_me_without_or_expired_token_returns_401(client: TestClient) -> None:
    _register(client)
    sin_token = client.get(ME_URL)
    assert sin_token.status_code == 401
    assert sin_token.json()["detail"] == "No autenticado"

    expirado = jwt.encode(
        {"sub": "1", "exp": datetime.now(UTC) - timedelta(minutes=1)},
        settings.JWT_SECRET,
        algorithm="HS256",
    )
    vencido = client.get(ME_URL, headers={"Authorization": f"Bearer {expirado}"})
    assert vencido.status_code == 401
    assert vencido.json()["detail"] == "No autenticado"


# --------------------------------------------------------- Admin inicial


def test_initial_admin_created_on_startup(client: TestClient) -> None:
    session_gen = _db_session()
    session = next(session_gen)
    try:
        admin = session.query(User).filter_by(email=settings.ADMIN_EMAIL).one()
        assert admin.role == Role.admin
        assert admin.is_active is True
        assert admin.hashed_password.startswith("$argon2")
    finally:
        session.close()


def test_admin_not_duplicated_on_restarted_api(client: TestClient) -> None:
    session_gen = _db_session()
    session = next(session_gen)
    try:
        assert ensure_initial_admin(session) is None
        assert session.query(User).filter(User.role == Role.admin).count() == 1
    finally:
        session.close()


def test_initial_admin_can_login_via_api(client: TestClient) -> None:
    # BR-8 + PRODUCT.md §7: ADMIN_EMAIL de ejemplo es admin@library.local (dominio
    # special-use que email-validator bloquea); el login de la API debe aceptarlo.
    login = _login(client, settings.ADMIN_EMAIL, settings.ADMIN_PASSWORD)
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    me = client.get(ME_URL, headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == settings.ADMIN_EMAIL
    assert me.json()["role"] == Role.admin.value


def test_register_and_me_accept_special_use_domain(client: TestClient) -> None:
    email = "ana.b@biblioteca.local"
    created = _register(client, email=email)
    assert created.status_code == 201, created.text
    token = _login(client, email, "Lectura2026").json()["access_token"]
    me = client.get(ME_URL, headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == email


def test_register_rejects_malformed_email(client: TestClient) -> None:
    response = _register(client, email="notanemail")
    assert response.status_code == 422
