from datetime import UTC, datetime, timedelta

import jwt
import pytest

from app.core.config import settings
from app.core.security import create_access_token, decode_token, hash_password, verify_password


def test_hash_password_roundtrip_argon2() -> None:
    hashed = hash_password("Lectura2026")
    assert hashed.startswith("$argon2")
    assert verify_password("Lectura2026", hashed)


def test_hash_password_does_not_contain_plain_password() -> None:
    assert "Lectura2026" not in hash_password("Lectura2026")


def test_hash_password_uses_random_salt() -> None:
    assert hash_password("Lectura2026") != hash_password("Lectura2026")


def test_verify_password_rejects_wrong_password() -> None:
    hashed = hash_password("Lectura2026")
    assert not verify_password("clave-distinta", hashed)


def test_access_token_roundtrip_returns_user_id() -> None:
    token = create_access_token(42)
    assert decode_token(token) == 42


def test_expired_token_is_rejected() -> None:
    token = jwt.encode(
        {"sub": "1", "exp": datetime.now(UTC) - timedelta(minutes=1)},
        settings.JWT_SECRET,
        algorithm="HS256",
    )
    with pytest.raises(jwt.ExpiredSignatureError):
        decode_token(token)


def test_token_signed_with_another_key_is_rejected() -> None:
    token = jwt.encode(
        {"sub": "1", "exp": datetime.now(UTC) + timedelta(minutes=5)},
        "otra-clave-secreta-completamente-distinta",
        algorithm="HS256",
    )
    with pytest.raises(jwt.InvalidTokenError):
        decode_token(token)
