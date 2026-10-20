from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.user import Role, User
from app.schemas.book import BookCreate, BookRead, BookUpdate, PaginatedBooksResponse
from app.services.book_service import book_service

router = APIRouter(prefix="/books", tags=["books"])


@router.get("", response_model=PaginatedBooksResponse)
def list_books(
    q: str | None = None,
    genre: str | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaginatedBooksResponse:
    return book_service.search_books(db, q=q, genre=genre, page=page, size=size)


@router.get("/genres", response_model=list[str])
def list_genres(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[str]:
    return book_service.get_genres(db)


@router.post("", response_model=BookRead, status_code=status.HTTP_201_CREATED)
def create_book(
    book_in: BookCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.librarian, Role.admin)),
) -> BookRead:
    return book_service.create_book(db, book_in, current_user.id)


@router.get("/{book_id}", response_model=BookRead)
def get_book(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BookRead:
    return book_service.get_book_by_id(db, book_id)


@router.put("/{book_id}", response_model=BookRead)
def update_book(
    book_id: int,
    book_in: BookUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.librarian, Role.admin)),
) -> BookRead:
    return book_service.update_book(db, book_id, book_in)


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.librarian, Role.admin)),
) -> None:
    book_service.delete_book(db, book_id)
