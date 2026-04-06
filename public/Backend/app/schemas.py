from pydantic import BaseModel, EmailStr, constr, validator, ConfigDict
from typing import Optional, Annotated

MAX_BCRYPT_PASSWORD_BYTES = 72


# -------------------------------
# Role Schemas
# -------------------------------
class RoleBase(BaseModel):
    name: str


class RoleCreate(RoleBase):
    pass


class Role(RoleBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# -------------------------------
# User Schemas
# -------------------------------
class UserBase(BaseModel):
    username: str
    email: EmailStr
    role_id: Optional[int] = None


class UserCreate(UserBase):
    password: Annotated[str, constr(min_length=6)]

    @validator("password")
    def password_must_fit_bcrypt(cls, v: str) -> str:
        if len(v.encode("utf-8")) > MAX_BCRYPT_PASSWORD_BYTES:
            raise ValueError(
                f"Password too long: must be at most {MAX_BCRYPT_PASSWORD_BYTES} bytes when UTF-8 encoded."
            )
        return v


class User(UserBase):
    id: int
    is_active: bool
    role: Optional[Role] = None

    model_config = ConfigDict(from_attributes=True)