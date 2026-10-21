from collections.abc import Generator

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.core.database import Base
from app.core.security import verify_password
from app.models.user import Role, User
from app.services.auth_service import (
    AccountDisabledError,
    EmailAlreadyRegisteredError,
    InvalidCredentialsError,
    authenticate,
    ensure_initial_admin,
    register,
)


@pytest.fixture()
def db() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)
    session = TestingSession()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


def test_register_creates_reader_with_argon2_hash(db: Session) -> None:
    user = register(db, email="ana@correo.com", full_name="Ana", password="Lectura2026")

    assert user.id is not None
    assert user.role == Role.reader
    assert user.is_active is True
    assert user.hashed_password.startswith("$argon2")
    assert "Lectura2026" not in user.hashed_password
    assert verify_password("Lectura2026", user.hashed_password)


def test_register_duplicate_email_raises(db: Session) -> None:
    register(db, email="ana@correo.com", full_name="Ana", password="Lectura2026")

    with pytest.raises(EmailAlreadyRegisteredError):
        register(db, email="ana@correo.com", full_name="Otra Ana", password="Lectura2026")


def test_authenticate_returns_user_with_correct_credentials(db: Session) -> None:
    register(db, email="ana@correo.com", full_name="Ana", password="Lectura2026")

    user = authenticate(db, email="ana@correo.com", password="Lectura2026")
    assert user.email == "ana@correo.com"


def test_authenticate_rejects_wrong_password(db: Session) -> None:
    register(db, email="ana@correo.com", full_name="Ana", password="Lectura2026")

    with pytest.raises(InvalidCredentialsError):
        authenticate(db, email="ana@correo.com", password="clave-mala1")


def test_authenticate_rejects_unknown_email(db: Session) -> None:
    register(db, email="ana@correo.com", full_name="Ana", password="Lectura2026")

    with pytest.raises(InvalidCredentialsError):
        authenticate(db, email="nadie@correo.com", password="Lectura2026")


def test_authenticate_rejects_disabled_account(db: Session) -> None:
    user = register(db, email="ana@correo.com", full_name="Ana", password="Lectura2026")
    user.is_active = False
    db.commit()

    with pytest.raises(AccountDisabledError):
        authenticate(db, email="ana@correo.com", password="Lectura2026")


def test_ensure_initial_admin_creates_admin_only_once(db: Session) -> None:
    admin = ensure_initial_admin(db)
    assert admin is not None
    assert admin.email == settings.ADMIN_EMAIL
    assert admin.role == Role.admin
    assert admin.is_active is True
    assert verify_password(settings.ADMIN_PASSWORD, admin.hashed_password)

    assert ensure_initial_admin(db) is None
    assert db.query(User).filter(User.role == Role.admin).count() == 1


def test_ensure_initial_admin_does_nothing_when_admin_exists(db: Session) -> None:
    register(db, email="ya@hay.admin", full_name="Admin", password="Lectura2026")
    existing = User(
        email="admin@existente.local",
        full_name="Admin",
        hashed_password="x",
        role=Role.admin,
        is_active=True,
    )
    db.add(existing)
    db.commit()

    assert ensure_initial_admin(db) is None
    assert db.query(User).filter(User.role == Role.admin).count() == 1
