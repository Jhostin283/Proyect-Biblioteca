from fastapi import APIRouter, Depends

from app.api.deps import require_roles
from app.models.user import Role

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", dependencies=[Depends(require_roles(Role.admin))])
def list_users() -> dict[str, object]:
    return {"items": [], "total": 0, "page": 1, "size": 10}
