# backend/app/routes/admin.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import User as UserModel, Role as RoleModel
from ..schemas import User as UserSchema, RoleCreate
from ..dependencies import admin_required

router = APIRouter(prefix="/admin", tags=["Admin"])


# ✅ GET USERS (WITH ROLE)
@router.get("/users", response_model=list[UserSchema])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: UserModel = Depends(admin_required)
):
    result = await db.execute(
        select(UserModel).options(selectinload(UserModel.role))
    )
    return result.scalars().all()


# ✅ ACTIVATE USER (FIXED)
@router.patch("/users/{user_id}/activate", response_model=UserSchema)
async def activate_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: UserModel = Depends(admin_required)
):
    user = await db.get(UserModel, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = True
    await db.commit()

    # ✅ IMPORTANT: Reload WITH ROLE
    result = await db.execute(
        select(UserModel)
        .options(selectinload(UserModel.role))
        .where(UserModel.id == user_id)
    )
    return result.scalar_one()


# ✅ DEACTIVATE USER (FIXED)
@router.patch("/users/{user_id}/deactivate", response_model=UserSchema)
async def deactivate_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: UserModel = Depends(admin_required)
):
    user = await db.get(UserModel, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = False
    await db.commit()

    # ✅ IMPORTANT: Reload WITH ROLE
    result = await db.execute(
        select(UserModel)
        .options(selectinload(UserModel.role))
        .where(UserModel.id == user_id)
    )
    return result.scalar_one()


# ✅ UPDATE ROLE (FIXED)
@router.patch("/users/{user_id}/role", response_model=UserSchema)
async def assign_role(
    user_id: int,
    role: RoleCreate,
    db: AsyncSession = Depends(get_db),
    _: UserModel = Depends(admin_required)
):
    user = await db.get(UserModel, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    result = await db.execute(
        select(RoleModel).where(RoleModel.name == role.name)
    )
    db_role = result.scalar_one_or_none()

    if not db_role:
        db_role = RoleModel(name=role.name)
        db.add(db_role)
        await db.commit()
        await db.refresh(db_role)

    user.role_id = db_role.id
    await db.commit()

    # ✅ RETURN UPDATED USER WITH ROLE
    result = await db.execute(
        select(UserModel)
        .options(selectinload(UserModel.role))
        .where(UserModel.id == user_id)
    )
    return result.scalar_one()