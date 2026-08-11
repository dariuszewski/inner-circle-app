import hashlib
import os
from collections.abc import Iterable
from datetime import UTC, datetime, timedelta
from secrets import token_urlsafe
from typing import Annotated

import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pwdlib import PasswordHash
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import RefreshToken, User
from schemas import UserRetrievePrivate

load_dotenv()

SECRET_KEY = os.environ["SECRET_KEY"]
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

password_hash = PasswordHash.recommended()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/token")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return password_hash.hash(password)


def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def generate_family_id() -> str:
    return token_urlsafe(24)


def create_refresh_token(
    family_id: str | None = None,
    expires_delta: int | None = None,
) -> tuple[str, str, str, datetime]:
    raw_token = token_urlsafe(32)
    token_hash = hash_token(raw_token)
    active_family_id = family_id or generate_family_id()
    if expires_delta is not None:
        expires_at = datetime.now(UTC) + timedelta(days=expires_delta)
    else:
        expires_at = datetime.now(UTC) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    return raw_token, token_hash, active_family_id, expires_at


def _normalize_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def is_refresh_token_expired(expires_at: datetime) -> bool:
    return _normalize_datetime(datetime.now(UTC)) >= _normalize_datetime(expires_at)


def verify_refresh_token(
    token: str,
    token_hash: str,
    expires_at: datetime | None = None,
) -> bool:
    if expires_at is not None and is_refresh_token_expired(expires_at):
        return False
    return hash_token(token) == token_hash


def invalidate_refresh_token(
    token_record: RefreshToken,
    now: datetime | None = None,
) -> None:
    current_time = now or datetime.now(UTC)
    token_record.revoked_at = current_time
    token_record.replaced_at = current_time


def invalidate_refresh_token_family(
    token_records: Iterable[RefreshToken],
    now: datetime | None = None,
) -> None:
    current_time = now or datetime.now(UTC)
    for token_record in token_records:
        token_record.revoked_at = current_time
        token_record.replaced_at = current_time


def is_refresh_token_valid(
    token_record: RefreshToken,
    now: datetime | None = None,
) -> bool:
    current_time = _normalize_datetime(now or datetime.now(UTC))
    if token_record.revoked_at is not None:
        return False
    return _normalize_datetime(token_record.expires_at) >= current_time


def is_refresh_token_family_reused(
    token_records: Iterable[RefreshToken],
    current_token_id: int,
) -> bool:
    return any(
        token_record.id != current_token_id
        and (
            token_record.revoked_at is not None or token_record.replaced_at is not None
        )
        for token_record in token_records
    )


def create_access_token(data: dict, expires_delta: int | None = None) -> str:
    to_encode = data.copy()
    if expires_delta is not None:
        expire = datetime.now(UTC) + timedelta(minutes=expires_delta)
    else:
        expire = datetime.now(UTC) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_access_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            options={"require": ["exp", "sub"]},
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserRetrievePrivate:
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    subject = payload.get("sub")
    if subject is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        user_id = int(subject)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None

    user = await db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return UserRetrievePrivate.model_validate(user)
