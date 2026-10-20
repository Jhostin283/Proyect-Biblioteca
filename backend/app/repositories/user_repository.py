from sqlalchemy import func, select
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
