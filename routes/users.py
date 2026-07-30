from typing import Annotated

from fastapi import APIRouter, Body, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User
from schemas import Token, UserCreate, UserRetrievePrivate, UserRetrievePublic
from utils.auth import (
    create_access_token,
    get_current_user,
    get_password_hash,
    oauth2_scheme,
    verify_password,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
async def get_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[UserRetrievePrivate, Depends(get_current_user)],
) -> list[UserRetrievePublic]:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource.",
        )
    query = await db.execute(select(User))
    users = query.scalars().all()
    return [UserRetrievePublic.model_validate(user) for user in users]


@router.get("/{user_id:int}")
async def get_user(
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[UserRetrievePrivate, Depends(get_current_user)],
) -> UserRetrievePublic | None:
    if not current_user.is_superuser and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource.",
        )
    query = await db.execute(select(User).where(User.id == user_id))
    user = query.scalar_one_or_none()
    return UserRetrievePublic.model_validate(user)


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def create_user(
    db: Annotated[AsyncSession, Depends(get_db)],
    user_create: Annotated[UserCreate, Body()],
) -> UserRetrievePublic:
    existing_user = await db.scalar(
        select(User).where(
            or_(
                func.lower(User.username) == user_create.username.strip(),
                func.lower(User.email) == user_create.email.lower(),
            )
        )
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username or email already exists.",
        )

    new_user = User(
        username=user_create.username,
        email=user_create.email.lower(),
        hashed_password=get_password_hash(user_create.password),
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return UserRetrievePublic.model_validate(new_user)


@router.post("/token")
async def login_for_access_token(
    db: Annotated[AsyncSession, Depends(get_db)],
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    result = await db.execute(
        select(User).where(func.lower(User.username) == func.lower(form_data.username))
    )
    user: User | None = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password.",
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=access_token, token_type="bearer")


@router.get("/token")
async def get_token(token: Annotated[str, Depends(oauth2_scheme)]) -> dict:
    return {"token": token}


@router.get("/me")
async def get_users_me(
    current_user: Annotated[UserRetrievePrivate, Depends(get_current_user)],
) -> UserRetrievePrivate:
    return UserRetrievePrivate.model_validate(current_user)
