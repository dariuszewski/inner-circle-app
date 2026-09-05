import uuid
from datetime import UTC, datetime
from math import ceil
from typing import Annotated

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Body,
    Depends,
    HTTPException,
    Query,
    status,
)
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import exists, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db
from models import (
    RefreshToken,
    User,
    UserCollection,
    UserRole,
    VerificationToken,
    VerificationTokenPurpose,
)
from schemas import (
    LogoutRequest,
    PaginatedResponse,
    RefreshTokenRequest,
    Token,
    UserCreate,
    UserRetrievePrivate,
    UserRetrievePublic,
    UserUpdate,
    UserUpdateEmail,
    VerificationRequestResponse,
)
from utils.auth import (
    create_access_token,
    create_refresh_token,
    create_verification_token,
    get_current_active_user,
    get_current_user,
    get_password_hash,
    hash_token,
    invalidate_refresh_token,
    invalidate_refresh_token_family,
    is_refresh_token_valid,
    verify_password,
)
from utils.email import send_welcome_email

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
async def get_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[UserRetrievePrivate, Depends(get_current_active_user)],
    page: Annotated[int, Query(ge=1, description="Page number")] = 1,
    per_page: Annotated[int, Query(ge=1, le=50, description="Items per page")] = 10,
) -> PaginatedResponse[UserRetrievePublic]:
    if current_user.user_role == UserRole.ADMIN:
        users_query = select(User)
    else:
        users_query = (
            select(User)
            .join(UserCollection, UserCollection.user_id == User.id)
            .where(
                UserCollection.collection_id.in_(
                    select(UserCollection.collection_id).where(
                        UserCollection.user_id == current_user.id
                    )
                )
            )
            .where(User.id != current_user.id)
            .distinct()
        )

    total_items = (
        await db.scalar(select(func.count()).select_from(users_query.subquery())) or 0
    )

    query = await db.execute(users_query.offset((page - 1) * per_page).limit(per_page))
    users = query.scalars().all()

    return PaginatedResponse[UserRetrievePublic](
        total_items=total_items,
        page=page,
        per_page=per_page,
        total_pages=ceil(total_items / per_page) if total_items else 0,
        items=[UserRetrievePublic.model_validate(user) for user in users],
    )


@router.get("/{user_id:int}")
async def get_user(
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[UserRetrievePrivate, Depends(get_current_active_user)],
) -> UserRetrievePublic | None:
    if current_user.user_role != UserRole.ADMIN and current_user.id != user_id:
        shares_collection = await db.scalar(
            select(
                exists(
                    select(UserCollection.collection_id)
                    .where(UserCollection.user_id == user_id)
                    .where(
                        UserCollection.collection_id.in_(
                            select(UserCollection.collection_id).where(
                                UserCollection.user_id == current_user.id
                            )
                        )
                    )
                )
            )
        )
        if not shares_collection:
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
) -> VerificationRequestResponse:
    user_role = UserRole.REGULAR
    if user_create.email is None:
        user_create.email = f"demo_{uuid.uuid4().hex[:8]}@icapp.com"
        user_role = UserRole.DEMO

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
        user_role=user_role,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # demo accounts are exempt from verification, so no token/link is needed
    if user_role == UserRole.DEMO:
        return VerificationRequestResponse(
            detail="Successfully registered as a demo user."
        )

    raw_token, token_hash, expires_at = create_verification_token()
    db.add(
        VerificationToken(
            user_id=new_user.id,
            token_hash=token_hash,
            expires_at=expires_at,
            current_email=new_user.email,
            purpose=VerificationTokenPurpose.USER_REGISTRATION,
        )
    )
    await db.commit()

    # no email infra yet, so the verification link is returned directly instead of sent
    verification_link = f"{settings.base_url}/users/verify/{raw_token}"
    # start a background task to send a welcome email to the new user
    background_tasks.add_task(send_welcome_email, new_user.email, new_user.username)

    return VerificationRequestResponse(
        detail="Registration successful. Please verify your account.",
        verification_link=verification_link,
    )


@router.patch("/elevate-demo")
async def register_demo_user_as_regular(
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[UserRetrievePrivate, Depends(get_current_user)],
    email_registration: Annotated[UserUpdateEmail, Body()],
) -> VerificationRequestResponse:
    if current_user.user_role != UserRole.DEMO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only demo accounts can register a real email.",
        )

    future_email = email_registration.email.lower()
    existing_user = await db.scalar(
        select(User).where(func.lower(User.email) == future_email)
    )
    if existing_user is not None and existing_user.id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already in use.",
        )

    raw_token, token_hash, expires_at = create_verification_token()
    db.add(
        VerificationToken(
            user_id=current_user.id,
            token_hash=token_hash,
            expires_at=expires_at,
            future_email=future_email,
            purpose=VerificationTokenPurpose.DEMO_USER_ELEVATION,
        )
    )
    await db.commit()

    verification_link = f"{settings.base_url}/users/verify/{raw_token}"

    background_tasks.add_task(send_welcome_email, future_email, current_user.username)

    return VerificationRequestResponse(
        detail="Verification link generated for your new email.",
        verification_link=verification_link,
    )


@router.patch("/update")
async def update_user(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[UserRetrievePrivate, Depends(get_current_active_user)],
    user_update: Annotated[UserUpdate, Body()],
) -> UserRetrievePrivate:

    user = await db.get(User, current_user.id)
    assert user is not None

    user.username = user_update.username.strip()
    await db.commit()
    await db.refresh(user)

    return UserRetrievePrivate.model_validate(user)


@router.post("/change-email")
async def change_user_email(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[UserRetrievePrivate, Depends(get_current_active_user)],
    email_change: Annotated[UserUpdateEmail, Body()],
) -> VerificationRequestResponse:

    user = await db.get(User, current_user.id)
    assert user is not None

    future_email = email_change.email.lower()
    current_email = user.email.lower()

    if future_email == current_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New email cannot be the same as the current email.",
        )

    raw_token, token_hash, expires_at = create_verification_token()

    token = VerificationToken(
        user_id=current_user.id,
        token_hash=token_hash,
        expires_at=expires_at,
        current_email=current_email,
        future_email=future_email,
        purpose=VerificationTokenPurpose.EMAIL_CHANGE,
    )

    db.add(token)
    await db.commit()

    verification_link = f"{settings.base_url}/users/verify/{raw_token}"

    # send email here and change response

    return VerificationRequestResponse(
        detail="Verification link generated for your new email.",
        verification_link=verification_link,
    )


@router.post("/reset-password")
async def request_password_reset(
    db: Annotated[AsyncSession, Depends(get_db)],
    email: Annotated[UserUpdateEmail, Body()],
) -> VerificationRequestResponse:
    user = await db.scalar(
        select(User).where(func.lower(User.email) == func.lower(email.email))
    )

    if user is not None:
        raw_token, token_hash, expires_at = create_verification_token()

        token = VerificationToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
            current_email=user.email,
            purpose=VerificationTokenPurpose.PASSWORD_RESET,
        )

        db.add(token)
        await db.commit()

        verification_link = f"{settings.base_url}/users/reset-password/{raw_token}"

        # send email here and change response

        return VerificationRequestResponse(
            detail="Password reset link generated.",
            verification_link=verification_link,
        )

    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No user found with the provided email.",
        )


@router.post("/account-deletion")
async def request_account_deletion(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[UserRetrievePrivate, Depends(get_current_active_user)],
) -> VerificationRequestResponse:
    user = await db.get(User, current_user.id)
    assert user is not None

    raw_token, token_hash, expires_at = create_verification_token()

    token = VerificationToken(
        user_id=current_user.id,
        token_hash=token_hash,
        expires_at=expires_at,
        current_email=user.email,
        purpose=VerificationTokenPurpose.ACCOUNT_DELETION,
    )

    db.add(token)
    await db.commit()

    verification_link = f"{settings.base_url}/users/verify/{raw_token}"

    # send email here and change response

    return VerificationRequestResponse(
        detail="Verification link generated for account deletion.",
        verification_link=verification_link,
    )


@router.get("/verify/{token}")
async def verify_verification_token(
    token: str,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, str]:
    token_hash = hash_token(token)

    result = await db.execute(
        select(VerificationToken).where(
            VerificationToken.token_hash == token_hash,
            VerificationToken.expires_at > datetime.now(UTC),
            ~VerificationToken.is_used,
        )
    )
    verification = result.scalar_one_or_none()

    if verification is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification link.",
        )

    if verification.purpose == VerificationTokenPurpose.USER_REGISTRATION:
        user = await db.get(User, verification.user_id)
        if user is not None:
            user.is_verified = True

        verification.is_used = True
        await db.commit()
        return {"detail": "Account verified successfully."}

    elif verification.purpose == VerificationTokenPurpose.DEMO_USER_ELEVATION:
        user = await db.get(User, verification.user_id)
        assert user is not None and verification.future_email is not None
        user.is_verified = True
        user.email = verification.future_email
        user.user_role = UserRole.REGULAR

        verification.is_used = True
        await db.commit()
        return {"detail": "Account elevated successfully."}

    elif verification.purpose == VerificationTokenPurpose.EMAIL_CHANGE:
        user = await db.get(User, verification.user_id)
        assert user is not None and verification.future_email is not None
        user.email = verification.future_email

        verification.is_used = True
        await db.commit()
        return {"detail": "Email changed successfully."}

    elif verification.purpose == VerificationTokenPurpose.PASSWORD_RESET:
        user = await db.get(User, verification.user_id)
        assert user is not None and verification.future_password_hash is not None
        user.hashed_password = verification.future_password_hash

        # keep record of the password reset for auditing purposes, but delete the pwhash
        verification.future_password_hash = None
        verification.is_used = True

        await db.commit()
        return {"detail": "Password reset successfully."}

    elif verification.purpose == VerificationTokenPurpose.ACCOUNT_DELETION:
        user = await db.get(User, verification.user_id)
        assert user is not None
        await db.delete(user)

        verification.is_used = True
        await db.commit()
        return {"detail": "Account deleted successfully."}
    else:
        # this code is unreachable in a normal app flow
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification purpose.",
        )


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
        # a token that was rotated out (replaced_at set) but never explicitly
        # revoked indicates someone is reusing an old, already-rotated token
        if (
            refresh_token_record.revoked_at is None
            and refresh_token_record.replaced_at is not None
        ):
            sibling_tokens_result = await db.execute(
                select(RefreshToken).where(
                    RefreshToken.family_id == refresh_token_record.family_id
                )
            )
            sibling_tokens = sibling_tokens_result.scalars().all()
            invalidate_refresh_token_family(sibling_tokens)
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token reuse detected; family invalidated.",
            )

        expires_at = refresh_token_record.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=UTC)
        is_expired = expires_at <= datetime.now(UTC)

        invalidate_refresh_token(refresh_token_record)
        await db.commit()
        if is_expired:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has expired.",
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked.",
        )

    user = await db.get(User, refresh_token_record.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists or is inactive.",
        )

    # mark as rotated (not revoked) so legitimate rotation isn't mistaken for reuse
    refresh_token_record.replaced_at = datetime.now(UTC)

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


@router.get("/me")
async def get_users_me(
    current_user: Annotated[UserRetrievePrivate, Depends(get_current_user)],
) -> UserRetrievePrivate:
    return UserRetrievePrivate.model_validate(current_user)
