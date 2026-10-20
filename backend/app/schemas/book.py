from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BookBase(BaseModel):
    isbn: str = Field(..., min_length=10, max_length=13)
    title: str = Field(..., min_length=1, max_length=200)
    author: str = Field(..., min_length=1, max_length=120)
    genre: str = Field(..., min_length=1, max_length=60)
    publication_year: int
    description: str | None = None


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    isbn: str | None = Field(None, min_length=10, max_length=13)
    title: str | None = Field(None, min_length=1, max_length=200)
    author: str | None = Field(None, min_length=1, max_length=120)
    genre: str | None = Field(None, min_length=1, max_length=60)
    publication_year: int | None = None
    description: str | None = None


class BookRead(BookBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
