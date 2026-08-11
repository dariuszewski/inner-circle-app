from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Body, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import RefreshToken, User
from schemas import (
    LogoutRequest,
    RefreshTokenRequest,
    Token,
    UserCreate,
    UserRetrievePrivate,
    UserRetrievePublic,
)
from utils.auth import (
    create_access_token,
    create_refresh_token,
    get_current_user,
    get_password_hash,
    hash_token,
    invalidate_refresh_token,
    invalidate_refresh_token_family,
    is_refresh_token_family_reused,
    is_refresh_token_valid,
    oauth2_scheme,
    verify_password,
)
from utils.email import send_welcome_email

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
    background_tasks: BackgroundTasks,
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

    # start a background task to send a welcome email to the new user
    background_tasks.add_task(send_welcome_email, new_user.email, new_user.username)

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
    refresh_token_raw, refresh_token_hash, family_id, expires_at = (
        create_refresh_token()
    )

    refresh_token = RefreshToken(
        user_id=user.id,
        family_id=family_id,
        token_hash=refresh_token_hash,
        expires_at=expires_at,
    )
    db.add(refresh_token)
    await db.commit()

    return Token(
        access_token=access_token,
        refresh_token=refresh_token_raw,
        token_type="bearer",
    )


@router.post("/refresh")
async def refresh_access_token(
    db: Annotated[AsyncSession, Depends(get_db)],
    refresh_request: Annotated[RefreshTokenRequest, Body()],
) -> Token:
    provided_token = refresh_request.refresh_token
    token_hash = hash_token(provided_token)

    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    refresh_token_record: RefreshToken | None = result.scalar_one_or_none()

    if not refresh_token_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token.",
        )

    if not is_refresh_token_valid(refresh_token_record):
        invalidate_refresh_token(refresh_token_record)
        await db.commit()
        if (
            refresh_token_record.revoked_at is not None
            and refresh_token_record.expires_at <= datetime.now(UTC)
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has expired.",
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked.",
        )

    sibling_tokens_result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.family_id == refresh_token_record.family_id
        )
    )
    sibling_tokens = sibling_tokens_result.scalars().all()
    if is_refresh_token_family_reused(sibling_tokens, refresh_token_record.id):
        now = datetime.now(UTC)
        invalidate_refresh_token_family(sibling_tokens, now)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token reuse detected; family invalidated.",
        )

    user = await db.get(User, refresh_token_record.user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists or is inactive.",
        )

    invalidate_refresh_token(refresh_token_record)

    new_access_token = create_access_token(data={"sub": str(user.id)})
    new_refresh_token_raw, new_refresh_token_hash, family_id, new_expires_at = (
        create_refresh_token(family_id=refresh_token_record.family_id)
    )

    new_refresh_token = RefreshToken(
        user_id=user.id,
        family_id=family_id,
        token_hash=new_refresh_token_hash,
        expires_at=new_expires_at,
    )
    db.add(new_refresh_token)
    await db.commit()

    return Token(
        access_token=new_access_token,
        refresh_token=new_refresh_token_raw,
        token_type="bearer",
    )


@router.post("/logout")
async def logout_user(
    db: Annotated[AsyncSession, Depends(get_db)],
    logout_request: Annotated[LogoutRequest, Body()],
) -> dict[str, str]:
    provided_token = logout_request.refresh_token
    token_hash = hash_token(provided_token)

    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    refresh_token_record: RefreshToken | None = result.scalar_one_or_none()

    if refresh_token_record is None:
        return {"detail": "Refresh token already invalid or not found."}

    if logout_request.all_sessions:
        family_result = await db.execute(
            select(RefreshToken).where(
                RefreshToken.family_id == refresh_token_record.family_id
            )
        )
        family_tokens = family_result.scalars().all()
        invalidate_refresh_token_family(family_tokens)
    else:
        invalidate_refresh_token(refresh_token_record)

    await db.commit()
    return {"detail": "Refresh token revoked."}


@router.get("/token")
async def get_token(token: Annotated[str, Depends(oauth2_scheme)]) -> dict:
    return {"token": token}


@router.get("/me")
async def get_users_me(
    current_user: Annotated[UserRetrievePrivate, Depends(get_current_user)],
) -> UserRetrievePrivate:
    return UserRetrievePrivate.model_validate(current_user)
