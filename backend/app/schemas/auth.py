import re

from pydantic import BaseModel, field_validator

from app.schemas.user import EmailField, UserCreate


class RegisterRequest(UserCreate):
    @field_validator("password")
    @classmethod
    def password_is_strong(cls, value: str) -> str:
        # BR-2: al menos 8 caracteres, una letra y un número (422 en la API)
        if len(value) < 8 or not re.search(r"[A-Za-z]", value) or not re.search(r"\d", value):
            raise ValueError("la contraseña necesita al menos 8 caracteres, una letra y un número")
        return value


class LoginRequest(BaseModel):
    email: EmailField
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
