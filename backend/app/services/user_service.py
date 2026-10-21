from sqlalchemy.orm import Session

from app.models.user import Role, User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserUpdate


class UserNotFoundError(Exception):
    """El usuario solicitado no existe."""


class SelfRoleRemovalError(Exception):
    """BR-7: un admin no puede quitarse su propio rol de administrador."""


class SelfDeactivationError(Exception):
    """BR-7: un admin no puede desactivar su propia cuenta."""


class UserService:
    def list_users(
        self,
        db: Session,
        *,
        q: str | None = None,
        page: int = 1,
        size: int = 10,
    ) -> dict:
        items, total = UserRepository(db).list_users(q=q, page=page, size=size)
        return {"items": items, "total": total, "page": page, "size": size}

    def update_user(
        self,
        db: Session,
        user_id: int,
        payload: UserUpdate,
        current_user_id: int,
    ) -> User:
        repo = UserRepository(db)
        user = repo.get_by_id(user_id)
        if user is None:
            raise UserNotFoundError(user_id)

        data = payload.model_dump(exclude_unset=True, exclude_none=True)
        if user_id == current_user_id:
            if "role" in data and data["role"] != Role.admin:
                raise SelfRoleRemovalError(user_id)
            if data.get("is_active") is False:
                raise SelfDeactivationError(user_id)

        return repo.update(user, data)


user_service = UserService()
