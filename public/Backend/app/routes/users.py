from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from datetime import timedelta
from fastapi.security import OAuth2PasswordRequestForm

from .. import schemas, models, auth
from ..database import get_db
from ..models import User as UserModel
from ..auth import get_password_hash, verify_password, MAX_BCRYPT_PASSWORD_BYTES, create_access_token
from ..dependencies import get_current_user
from ..config import ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/register", response_model=schemas.User)
async def register_user(user: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Register new user:
    - Validate password byte-length (<= 72 bytes) before hashing.
    - Hash password safely and create user record.
    """
    # Defensive validation: ensure bcrypt won't receive >72 bytes
    if len(user.password.encode("utf-8")) > MAX_BCRYPT_PASSWORD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password too long: must be at most {MAX_BCRYPT_PASSWORD_BYTES} bytes when UTF-8 encoded.",
        )

    hashed_password = get_password_hash(user.password)

    new_user = UserModel(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role_id=user.role_id,
    )

    db.add(new_user)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with that username or email already exists.",
        ) from exc

    result = await db.execute(
        select(UserModel).options(selectinload(UserModel.role)).where(UserModel.username == user.username)
    )
    created_user = result.scalar_one()
    return created_user


@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    """
    Login endpoint using OAuth2PasswordRequestForm; returns bearer token.
    """
    result = await db.execute(select(UserModel).where(UserModel.username == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid credentials")

    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me")
async def read_current_user(current_user: UserModel = Depends(get_current_user)):
    return current_user