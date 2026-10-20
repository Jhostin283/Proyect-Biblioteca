from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.book import Book
from app.repositories.book_repository import book_repo
from app.schemas.book import BookCreate, BookUpdate


class BookService:
    def create_book(self, db: Session, book_in: BookCreate, user_id: int) -> Book:
        existing = book_repo.get_by_isbn(db, book_in.isbn)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El ISBN ya está registrado",
            )

        book = Book(
            isbn=book_in.isbn,
            title=book_in.title,
            author=book_in.author,
            genre=book_in.genre,
            publication_year=book_in.publication_year,
            description=book_in.description,
            created_by=user_id,
        )
        return book_repo.create(db, book)

    def get_book_by_id(self, db: Session, book_id: int) -> Book:
        book = book_repo.get_by_id(db, book_id)
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Libro no encontrado",
            )
        return book

    def update_book(self, db: Session, book_id: int, book_in: BookUpdate) -> Book:
        book = self.get_book_by_id(db, book_id)

        if book_in.isbn and book_in.isbn != book.isbn:
            existing = book_repo.get_by_isbn(db, book_in.isbn)
            if existing and existing.id != book_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="El ISBN ya está registrado",
                )

        update_data = book_in.model_dump(exclude_unset=True)
        return book_repo.update(db, book, update_data)

    def delete_book(self, db: Session, book_id: int) -> None:
        book = self.get_book_by_id(db, book_id)
        book_repo.delete(db, book)

    def search_books(
        self,
        db: Session,
        q: str | None = None,
        genre: str | None = None,
        page: int = 1,
        size: int = 10,
    ) -> dict:
        items, total = book_repo.list_books(db, q=q, genre=genre, page=page, size=size)
        return {
            "items": items,
            "total": total,
            "page": page,
            "size": size,
        }

    def get_genres(self, db: Session) -> list[str]:
        return book_repo.get_genres(db)


book_service = BookService()
