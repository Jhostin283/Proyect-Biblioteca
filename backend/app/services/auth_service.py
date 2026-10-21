from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password, verify_password
from app.models.user import Role, User
from app.repositories.user_repository import UserRepository


class EmailAlreadyRegisteredError(Exception):
    """BR-1: el email ya existe."""


class InvalidCredentialsError(Exception):
    """Credenciales incorrectas (email inexistente o contraseña errónea)."""


class AccountDisabledError(Exception):
    """BR-6: la cuenta existe pero está desactivada."""


# Hash fijo de referencia: el login con un email inexistente verifica contra
# este valor para que tarde lo mismo que con un email real (evita enumerar usuarios).
_DUMMY_HASH = hash_password("dummy-password-for-timing")


def register(db: Session, *, email: str, full_name: str, password: str) -> User:
    """BR-1 y BR-5: crea un usuario con hash argon2 y rol reader fijo."""
    repo = UserRepository(db)
    if repo.get_by_email(email) is not None:
        raise EmailAlreadyRegisteredError(email)

    user = User(
        email=email,
        full_name=full_name,
        hashed_password=hash_password(password),
        role=Role.reader,
        is_active=True,
    )
    try:
        return repo.add(user)
    except IntegrityError as exc:
        # Carrera entre el SELECT y el INSERT: el unique de email ya lo cubrió
        raise EmailAlreadyRegisteredError(email) from exc


def authenticate(db: Session, *, email: str, password: str) -> User:
    """Devuelve el usuario si las credenciales son válidas y la cuenta está activa."""
    repo = UserRepository(db)
    user = repo.get_by_email(email)

    if user is None:
        verify_password(password, _DUMMY_HASH)
        raise InvalidCredentialsError(email)

    if not verify_password(password, user.hashed_password):
        raise InvalidCredentialsError(email)

    if not user.is_active:
        raise AccountDisabledError(email)

    return user


def ensure_initial_admin(db: Session) -> User | None:
    """BR-8: al arrancar, crea el admin inicial solo si no existe ningún admin."""
    repo = UserRepository(db)
    if repo.exists_admin():
        return None

    admin = User(
        email=settings.ADMIN_EMAIL,
        full_name="Administrador",
        hashed_password=hash_password(settings.ADMIN_PASSWORD),
        role=Role.admin,
        is_active=True,
    )
    try:
        return repo.add(admin)
    except IntegrityError:
        # Otro proceso creó el admin a la vez: la condición era "si no existe ninguno"
        db.rollback()
        return None
