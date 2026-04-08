# backend/app/routes/users.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from datetime import timedelta
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional

from .. import schemas
from ..database import get_db
from ..models import User as UserModel, Role as RoleModel
from ..auth import (
    get_password_hash,
    verify_password,
    MAX_BCRYPT_PASSWORD_BYTES,
    create_access_token,
)
from ..dependencies import get_current_user, admin_required
from ..config import ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/users", tags=["Users"])


# =========================
# REQUEST MODEL
# =========================
class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    role_name: Optional[str] = None
    role_id: Optional[int] = None


# =========================
# REGISTER USER (ADMIN ONLY)
# =========================
@router.post("/register", response_model=schemas.User)
async def register_user(
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db),
    _: UserModel = Depends(admin_required),
):
    """
    Admin creates a new user.
    Supports role_id or role_name.
    Always returns user WITH role (important for frontend).
    """

    # 🔒 Password length check (bcrypt safe)
    if len(payload.password.encode("utf-8")) > MAX_BCRYPT_PASSWORD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password too long (max {MAX_BCRYPT_PASSWORD_BYTES} bytes).",
        )

    # =========================
    # RESOLVE ROLE
    # =========================
    resolved_role_id = None

    if payload.role_id:
        role = await db.get(RoleModel, int(payload.role_id))
        if not role:
            raise HTTPException(status_code=400, detail="Invalid role_id")
        resolved_role_id = role.id

    elif payload.role_name:
        result = await db.execute(
            select(RoleModel).where(RoleModel.name == payload.role_name)
        )
        db_role = result.scalar_one_or_none()

        if not db_role:
            db_role = RoleModel(name=payload.role_name)
            db.add(db_role)
            await db.commit()
            await db.refresh(db_role)

        resolved_role_id = db_role.id

    # =========================
    # CREATE USER
    # =========================
    hashed_password = get_password_hash(payload.password)

    new_user = UserModel(
        username=payload.username,
        email=payload.email,
        hashed_password=hashed_password,
        role_id=resolved_role_id,
    )

    db.add(new_user)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=400,
            detail="User with this username or email already exists",
        )

    # ✅ IMPORTANT: RETURN USER WITH ROLE
    result = await db.execute(
        select(UserModel)
        .options(selectinload(UserModel.role))
        .where(UserModel.id == new_user.id)
    )

    return result.scalar_one()


# =========================
# LOGIN
# =========================
@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """
    Login user and return JWT token.
    Rejects inactive users.
    """

    result = await db.execute(
        select(UserModel).where(UserModel.username == form_data.username)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not getattr(user, "is_active", True):
        raise HTTPException(status_code=400, detail="User account is deactivated")

    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


# =========================
# CURRENT USER
# =========================
@router.get("/me", response_model=schemas.User)
async def read_current_user(
    current_user: UserModel = Depends(get_current_user),
):
    """
    Returns authenticated user WITH role.
    """
    return current_user