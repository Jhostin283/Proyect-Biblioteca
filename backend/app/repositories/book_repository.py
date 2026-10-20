from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.book import Book


class BookRepository:
    def get_by_id(self, db: Session, book_id: int) -> Book | None:
        return db.get(Book, book_id)

    def get_by_isbn(self, db: Session, isbn: str) -> Book | None:
        stmt = select(Book).where(Book.isbn == isbn)
        return db.scalars(stmt).first()

    def create(self, db: Session, book: Book) -> Book:
        db.add(book)
        db.commit()
        db.refresh(book)
        return book

    def update(self, db: Session, book: Book, data: dict) -> Book:
        for field, value in data.items():
            if value is not None:
                setattr(book, field, value)
        db.commit()
        db.refresh(book)
        return book

    def delete(self, db: Session, book: Book) -> None:
        db.delete(book)
        db.commit()


book_repo = BookRepository()
