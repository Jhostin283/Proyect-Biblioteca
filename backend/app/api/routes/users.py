from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.database import get_db
from app.models.user import Role, User
from app.schemas.user import PaginatedUsersResponse, UserRead, UserUpdate
from app.services.user_service import (
    SelfDeactivationError,
    SelfRoleRemovalError,
    UserNotFoundError,
    user_service,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=PaginatedUsersResponse)
def list_users(
    q: str | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.admin)),
) -> PaginatedUsersResponse:
    return user_service.list_users(db, q=q, page=page, size=size)


@router.patch("/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.admin)),
) -> UserRead:
    try:
        return user_service.update_user(db, user_id, payload, current_user.id)
    except UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        ) from None
    except SelfRoleRemovalError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No puedes quitarte tu propio rol de administrador",
        ) from None
    except SelfDeactivationError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No puedes desactivar tu propia cuenta",
        ) from None
