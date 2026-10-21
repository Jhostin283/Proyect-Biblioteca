from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.user import Role, User


class UserRepository:
    """Única capa que consulta la tabla users."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_email(self, email: str) -> User | None:
        return self.db.scalar(select(User).where(User.email == email))

    def get_by_id(self, user_id: int) -> User | None:
        return self.db.get(User, user_id)

    def exists_admin(self) -> bool:
        query = select(func.count()).select_from(User).where(User.role == Role.admin)
        return bool(self.db.scalar(query))

    def add(self, user: User) -> User:
        self.db.add(user)
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise
        self.db.refresh(user)
        return user

    def list_users(
        self,
        q: str | None = None,
        page: int = 1,
        size: int = 10,
    ) -> tuple[list[User], int]:
        stmt = select(User)
        count_stmt = select(func.count(User.id))

        if q:
            term = f"%{q.strip()}%"
            filter_q = or_(User.email.ilike(term), User.full_name.ilike(term))
            stmt = stmt.where(filter_q)
            count_stmt = count_stmt.where(filter_q)

        total = self.db.scalar(count_stmt) or 0
        stmt = stmt.order_by(User.id.asc()).offset((page - 1) * size).limit(size)
        return list(self.db.scalars(stmt).all()), total

    def update(self, user: User, data: dict) -> User:
        for field, value in data.items():
            if value is not None:
                setattr(user, field, value)
        self.db.commit()
        self.db.refresh(user)
        return user
