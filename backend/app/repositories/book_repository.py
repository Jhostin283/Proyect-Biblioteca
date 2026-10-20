from sqlalchemy import func, or_, select
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

    def list_books(
        self,
        db: Session,
        q: str | None = None,
        genre: str | None = None,
        page: int = 1,
        size: int = 10,
    ) -> tuple[list[Book], int]:
        stmt = select(Book)
        count_stmt = select(func.count(Book.id))

        if q:
            term = f"%{q.strip()}%"
            filter_q = or_(Book.title.ilike(term), Book.author.ilike(term))
            stmt = stmt.where(filter_q)
            count_stmt = count_stmt.where(filter_q)

        if genre:
            stmt = stmt.where(Book.genre == genre)
            count_stmt = count_stmt.where(Book.genre == genre)

        total = db.scalar(count_stmt) or 0

        stmt = stmt.order_by(Book.title.asc()).offset((page - 1) * size).limit(size)
        items = list(db.scalars(stmt).all())
        return items, total

    def get_genres(self, db: Session) -> list[str]:
        stmt = select(Book.genre).distinct().order_by(Book.genre.asc())
        return list(db.scalars(stmt).all())


book_repo = BookRepository()
