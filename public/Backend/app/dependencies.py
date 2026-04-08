# backend/app/dependencies.py
from fastapi import Depends, HTTPException, status
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select

from .database import get_db
from .models import User as UserModel
from .config import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials"
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))

    except JWTError:
        raise credentials_exception

    result = await db.execute(
        select(UserModel)
        .options(selectinload(UserModel.role))  # prevents MissingGreenlet
        .where(UserModel.id == user_id)
    )

    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    # Reject inactive users (treat as invalid credentials)
    if not getattr(user, "is_active", True):
        raise credentials_exception

    return user


async def admin_required(current_user: UserModel = Depends(get_current_user)):

    if not current_user.role or current_user.role.name != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin privileges required"
        )

    return current_user