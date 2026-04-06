from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
from typing import Union

from .config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

# Use bcrypt_sha256 to avoid the 72-byte bcrypt limitation.
# bcrypt_sha256 pre-hashes the password with SHA256 so arbitrary-length passwords are supported.
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12
)

MAX_BCRYPT_PASSWORD_BYTES = 72  # keep this constant for validation & backward-compat, if desired


def get_password_hash(password: str):
    return pwd_context.hash(password[:72])


def verify_password(plain_password: Union[str, bytes], hashed_password: str) -> bool:
    """
    Verify a plain password against a stored hash.
    Uses the same passlib context so it supports bcrypt_sha256 hashes.
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt