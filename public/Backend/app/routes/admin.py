from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from ..database import get_db
from ..models import User as UserModel, Role as RoleModel
from ..schemas import User as UserSchema, RoleCreate, Role as RoleSchema
from ..auth import get_password_hash
from ..dependencies import admin_required

router = APIRouter(prefix="/admin", tags=["Admin"])

# -------------------------------
# Create user (admin only)
# -------------------------------
@router.post("/users", response_model=UserSchema)
async def create_user(user: UserSchema, db: AsyncSession = Depends(get_db), _: UserModel = Depends(admin_required)):
    hashed_password = get_password_hash(user.hashed_password)
    db_user = UserModel(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role_id=user.role.id if user.role else None
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

# -------------------------------
# List all users
# -------------------------------
@router.get("/users", response_model=list[UserSchema])
async def list_users(db: AsyncSession = Depends(get_db), _: UserModel = Depends(admin_required)):
    result = await db.execute(select(UserModel).options(selectinload(UserModel.role)))
    users = result.scalars().all()
    return users

# -------------------------------
# Deactivate user
# -------------------------------
@router.patch("/users/{user_id}/deactivate", response_model=UserSchema)
async def deactivate_user(user_id: int, db: AsyncSession = Depends(get_db), _: UserModel = Depends(admin_required)):
    user = await db.get(UserModel, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

# -------------------------------
# Assign role
# -------------------------------
@router.patch("/users/{user_id}/role", response_model=UserSchema)
async def assign_role(user_id: int, role: RoleCreate, db: AsyncSession = Depends(get_db), _: UserModel = Depends(admin_required)):
    user = await db.get(UserModel, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get or create role
    result = await db.execute(select(RoleModel).where(RoleModel.name == role.name))
    db_role = result.scalar_one_or_none()
    if not db_role:
        db_role = RoleModel(name=role.name)
        db.add(db_role)
        await db.commit()
        await db.refresh(db_role)
    
    user.role_id = db_role.id
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user