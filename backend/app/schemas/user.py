import re
from datetime import datetime
from typing import Annotated

from email_validator import EmailSyntaxError, validate_email
from pydantic import AfterValidator, BaseModel, ConfigDict

from app.models.user import Role

# El contrato (PRODUCT.md §7) usa dominios locales de ejemplo como admin@library.local
# para ADMIN_EMAIL. email-validator rechaza los dominios special-use (.local, .invalid)
# sin excepción posible, así que, si el fallo es de dominio y la forma local@dominio.tld
# es correcta, aceptamos el valor con el dominio en minúsculas.
_SPECIAL_USE_DOMAIN = re.compile(r"([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}")


def _validate_email(value: str) -> str:
    try:
        return validate_email(value, check_deliverability=False).email
    except EmailSyntaxError as exc:
        local, sep, domain = value.rpartition("@")
        if sep and _SPECIAL_USE_DOMAIN.fullmatch(domain):
            return f"{local}@{domain.lower()}"
        raise ValueError(str(exc)) from exc


EmailField = Annotated[str, AfterValidator(_validate_email)]


class UserBase(BaseModel):
    email: EmailField
    full_name: str


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: int
    role: Role
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
