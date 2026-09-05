import asyncio
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException

from models import RefreshToken, User, UserRole
from schemas import UserRetrievePrivate
from utils.auth import (
    create_access_token,
    create_refresh_token,
    generate_family_id,
    get_current_user,
    get_password_hash,
    hash_token,
    invalidate_refresh_token_family,
    is_refresh_token_expired,
    is_refresh_token_family_reused,
    is_refresh_token_valid,
    verify_access_token,
    verify_password,
    verify_refresh_token,
)


def test_get_password_hash_and_verify_password_hash() -> None:
    hashed = get_password_hash("password123")

    assert verify_password("password123", hashed) is True
    assert verify_password("wrongpassword", hashed) is False


def test_verify_refresh_token_checks_hash_and_expiry() -> None:
    raw = "refresh-token-123"
    token_hash = hash_token(raw)
    valid_expiry = datetime.now(UTC) + timedelta(days=1)

    assert verify_refresh_token(raw, token_hash, valid_expiry) is True
    assert verify_refresh_token(raw, "wrong-hash", valid_expiry) is False

    expired = datetime.now(UTC) - timedelta(minutes=1)
    assert verify_refresh_token(raw, token_hash, expired) is False


def test_generate_family_id_is_unique() -> None:
    assert generate_family_id() != generate_family_id()


def test_create_refresh_token_and_verify() -> None:
    raw_token, token_hash, _, expires_at = create_refresh_token()
    assert verify_refresh_token(raw_token, token_hash, expires_at) is True


def test_create_refresh_token_with_custom_family_id() -> None:
    custom_family_id = "custom-family-id"
    raw_token, token_hash, family_id, expires_at = create_refresh_token(
        family_id=custom_family_id
    )
    assert family_id == custom_family_id
    assert verify_refresh_token(raw_token, token_hash, expires_at) is True


@pytest.mark.parametrize(
    ("expires_at", "expected"),
    [
        (datetime.now(UTC) - timedelta(seconds=1), True),
        (datetime.now(UTC) + timedelta(minutes=5), False),
    ],
)
def test_is_refresh_token_expired(
    expires_at: datetime,
    expected: bool,
) -> None:
    assert is_refresh_token_expired(expires_at) is expected


@pytest.mark.parametrize(
    "expires_at",
    [
        datetime.now(UTC) - timedelta(seconds=1),
        (datetime.now(UTC) - timedelta(seconds=1)).replace(tzinfo=None),
    ],
)
def test_is_refresh_token_expired_handles_aware_and_naive_datetimes(
    expires_at: datetime,
) -> None:
    assert is_refresh_token_expired(expires_at) is True


def test_invalidate_refresh_token_family() -> None:
    token_record_1 = RefreshToken(
        user_id=1,
        family_id="family-id",
        token_hash="token-hash",
        expires_at=datetime.now(UTC) + timedelta(days=1),
        revoked_at=None,
        replaced_at=None,
    )
    token_record_2 = RefreshToken(
        user_id=1,
        family_id="family-id",
        token_hash="token-hash",
        expires_at=datetime.now(UTC) + timedelta(days=1),
        revoked_at=None,
        replaced_at=None,
    )
    token_records = [token_record_1, token_record_2]
    now = datetime.now(UTC)

    invalidate_refresh_token_family(token_records, now=now)

    assert token_record_1.revoked_at == now
    assert token_record_1.replaced_at == now
    assert token_record_2.revoked_at == now
    assert token_record_2.replaced_at == now


def test_is_refresh_token_valid() -> None:
    now = datetime.now(UTC)
    valid_token = RefreshToken(
        user_id=1,
        family_id="family-id",
        token_hash="token-hash",
        expires_at=now + timedelta(days=1),
        revoked_at=None,
        replaced_at=None,
    )
    revoked_token = RefreshToken(
        user_id=1,
        family_id="family-id",
        token_hash="token-hash",
        expires_at=now + timedelta(days=1),
        revoked_at=now,
        replaced_at=None,
    )
    replaced_token = RefreshToken(
        user_id=1,
        family_id="family-id",
        token_hash="token-hash",
        expires_at=now + timedelta(days=1),
        revoked_at=None,
        replaced_at=now,
    )
    expired_token = RefreshToken(
        user_id=1,
        family_id="family-id",
        token_hash="token-hash",
        expires_at=now - timedelta(seconds=1),
        revoked_at=None,
        replaced_at=None,
    )

    assert is_refresh_token_valid(valid_token, now=now) is True
    assert is_refresh_token_valid(revoked_token, now=now) is False
    assert is_refresh_token_valid(replaced_token, now=now) is False
    assert is_refresh_token_valid(expired_token, now=now) is False


def test_is_refresh_token_family_reused() -> None:
    now = datetime.now(UTC)
    token_record_1 = RefreshToken(
        id=1,
        user_id=1,
        family_id="family-id",
        token_hash="token-hash",
        expires_at=now + timedelta(days=1),
        revoked_at=None,
        replaced_at=None,
    )
    token_record_2 = RefreshToken(
        id=2,
        user_id=1,
        family_id="family-id",
        token_hash="token-hash",
        expires_at=now + timedelta(days=1),
        revoked_at=now,
        replaced_at=now,
    )
    token_records = [token_record_1, token_record_2]

    assert (
        is_refresh_token_family_reused(
            token_records, current_token_id=token_record_1.id
        )
        is True
    )
    assert (
        is_refresh_token_family_reused(
            token_records, current_token_id=token_record_2.id
        )
        is False
    )


@pytest.mark.parametrize(
    ("data", "expires_delta", "token_override", "expected_valid"),
    [
        ({"sub": "user-123"}, None, None, True),
        ({"sub": "user-456"}, -5, None, False),
        (None, None, "not-a-valid-jwt", False),
    ],
)
def test_create_and_verify_access_token(
    data: dict[str, str] | None,
    expires_delta: int | None,
    token_override: str | None,
    expected_valid: bool,
) -> None:
    if token_override is not None:
        token = token_override
    else:
        assert data is not None
        token = create_access_token(
            data=data,
            expires_delta=expires_delta,
        )

    payload = verify_access_token(token)

    if expected_valid:
        assert payload is not None
        assert data is not None
        assert payload["sub"] == data["sub"]
    else:
        assert payload is None


@pytest.mark.parametrize(
    ("payload", "db_user", "expected_status", "expected_detail"),
    [
        (None, None, 401, "Invalid authentication credentials"),
        ({}, None, 401, "Invalid authentication credentials"),
        ({"sub": None}, None, 401, "Invalid authentication credentials"),
        ({"sub": "not-an-int"}, None, 401, "Invalid authentication credentials"),
        ({"sub": "123"}, None, 401, "User no longer exists"),
    ],
)
def test_get_current_user_errors(
    payload: dict | None,
    db_user: User | None,
    expected_status: int,
    expected_detail: str,
) -> None:
    db = AsyncMock()

    async def run_check() -> None:
        with patch(
            "utils.auth.verify_access_token",
            return_value=payload,
        ):
            if payload and payload.get("sub") == "123":
                db.get.return_value = db_user

            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(
                    token="test-token",
                    db=db,
                )

        assert exc_info.value.status_code == expected_status
        assert exc_info.value.detail == expected_detail
        assert exc_info.value.headers == {"WWW-Authenticate": "Bearer"}

    asyncio.run(run_check())


def test_get_current_user_success() -> None:
    user = User(
        id=123,
        username="testuser",
        email="testuser@example.com",
        hashed_password="hashed-password",
        created_at=datetime.now(UTC),
        is_verified=True,
        user_role=UserRole.REGULAR,
    )
    db = AsyncMock()
    db.get.return_value = user

    async def run_check() -> None:
        with patch(
            "utils.auth.verify_access_token",
            return_value={"sub": "123"},
        ):
            result = await get_current_user(
                token="test-token",
                db=db,
            )

        db.get.assert_awaited_once_with(User, 123)

        assert isinstance(result, UserRetrievePrivate)
        assert result.id == 123

    asyncio.run(run_check())
