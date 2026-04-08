# backend/app/routes/roles.py
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from ..database import get_db
from ..models import Role as RoleModel

router = APIRouter(prefix="/roles", tags=["Roles"])


@router.get("", status_code=status.HTTP_200_OK)
async def list_roles(db: AsyncSession = Depends(get_db)):
    """
    Return list of roles in a simple shape: [{ id, name }, ...]
    Frontend uses this to populate the Role dropdown.
    """
    result = await db.execute(select(RoleModel))
    roles = result.scalars().all()
    return [{"id": r.id, "name": r.name} for r in roles]