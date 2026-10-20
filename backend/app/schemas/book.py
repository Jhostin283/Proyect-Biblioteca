from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class BookBase(BaseModel):
    isbn: str = Field(..., description="ISBN de 10 o 13 dígitos")
    title: str = Field(..., min_length=1, max_length=200)
    author: str = Field(..., min_length=1, max_length=120)
    genre: str = Field(..., min_length=1, max_length=60)
    publication_year: int
    description: str | None = None

    @field_validator("isbn")
    @classmethod
    def validate_isbn(cls, v: str) -> str:
        cleaned = v.strip().replace("-", "")
        if not (len(cleaned) in (10, 13) and cleaned.isdigit()):
            raise ValueError("El ISBN debe tener 10 o 13 dígitos")
        return cleaned

    @field_validator("publication_year")
    @classmethod
    def validate_year(cls, v: int) -> int:
        current_year = datetime.now().year
        if v < 1450 or v > current_year:
            raise ValueError("El año de publicación no es válido")
        return v


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    isbn: str | None = None
    title: str | None = Field(None, min_length=1, max_length=200)
    author: str | None = Field(None, min_length=1, max_length=120)
    genre: str | None = Field(None, min_length=1, max_length=60)
    publication_year: int | None = None
    description: str | None = None

    @field_validator("isbn")
    @classmethod
    def validate_isbn(cls, v: str | None) -> str | None:
        if v is None:
            return None
        cleaned = v.strip().replace("-", "")
        if not (len(cleaned) in (10, 13) and cleaned.isdigit()):
            raise ValueError("El ISBN debe tener 10 o 13 dígitos")
        return cleaned

    @field_validator("publication_year")
    @classmethod
    def validate_year(cls, v: int | None) -> int | None:
        if v is None:
            return None
        current_year = datetime.now().year
        if v < 1450 or v > current_year:
            raise ValueError("El año de publicación no es válido")
        return v


class BookRead(BookBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
