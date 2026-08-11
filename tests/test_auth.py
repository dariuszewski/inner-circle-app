from datetime import UTC, datetime, timedelta

from utils.auth import (
    create_access_token,
    create_refresh_token,
    generate_family_id,
    get_password_hash,
    hash_token,
    invalidate_refresh_token,
    invalidate_refresh_token_family,
    is_refresh_token_expired,
    is_refresh_token_family_reused,
    is_refresh_token_valid,
    verify_access_token,
    verify_password,
    verify_refresh_token,
)


def test_hash_token_is_stable() -> None:
    raw = "super-secret-token"
    assert hash_token(raw) == hash_token(raw)
    assert hash_token(raw) != raw


def test_generate_family_id_is_unique() -> None:
    first = generate_family_id()
    second = generate_family_id()
    assert first
    assert second
    assert first != second


def test_create_refresh_token_returns_expiry_and_family() -> None:
    raw, hashed, family_id, expires_at = create_refresh_token()
    assert raw
    assert hashed
    assert family_id
    assert expires_at > datetime.now(UTC)


def test_verify_refresh_token_checks_hash_and_expiry() -> None:
    raw, hashed, family_id, expires_at = create_refresh_token()
    assert verify_refresh_token(raw, hashed, expires_at) is True
    expired = datetime.now(UTC) - timedelta(minutes=1)
    assert verify_refresh_token(raw, hashed, expired) is False
    assert verify_refresh_token(raw, "wronghash", expires_at) is False


def test_is_refresh_token_valid_and_expired_helpers() -> None:
    raw, hashed, family_id, expires_at = create_refresh_token()
    assert (
        is_refresh_token_valid(
            type("TokenRecord", (), {"revoked_at": None, "expires_at": expires_at})()
        )
        is True
    )
    expired_record = type(
        "TokenRecord",
        (),
        {"revoked_at": None, "expires_at": datetime.now(UTC) - timedelta(minutes=1)},
    )()
    assert is_refresh_token_valid(expired_record) is False

    revoked_record = type(
        "TokenRecord",
        (),
        {
            "revoked_at": datetime.now(UTC),
            "expires_at": datetime.now(UTC) + timedelta(days=1),
        },
    )()
    assert is_refresh_token_valid(revoked_record) is False
    assert is_refresh_token_expired(expires_at) is False
    assert is_refresh_token_expired(datetime.now(UTC) - timedelta(minutes=1)) is True


def test_is_refresh_token_valid_handles_naive_datetimes() -> None:
    token_record = type(
        "TokenRecord",
        (),
        {"revoked_at": None, "expires_at": datetime.now() + timedelta(minutes=10)},
    )()

    assert is_refresh_token_valid(token_record) is True


def test_invalidate_helpers_mark_records_revoked() -> None:
    current_time = datetime.now(UTC)
    token_record = type(
        "TokenRecord",
        (),
        {"revoked_at": None, "replaced_at": None},
    )()
    invalidate_refresh_token(token_record)
    assert token_record.revoked_at is not None
    assert token_record.replaced_at is not None

    family_records = [
        type("TokenRecord", (), {"revoked_at": None, "replaced_at": None})(),
        type("TokenRecord", (), {"revoked_at": None, "replaced_at": None})(),
    ]
    invalidate_refresh_token_family(family_records, current_time)
    assert all(record.revoked_at == current_time for record in family_records)
    assert all(record.replaced_at == current_time for record in family_records)


def test_is_refresh_token_family_reused_detects_rotated_family() -> None:
    current = type(
        "TokenRecord", (), {"id": 1, "revoked_at": None, "replaced_at": None}
    )()
    rotated = type(
        "TokenRecord",
        (),
        {"id": 2, "revoked_at": datetime.now(UTC), "replaced_at": datetime.now(UTC)},
    )()
    assert is_refresh_token_family_reused([current, rotated], current.id) is True
    assert is_refresh_token_family_reused([current], current.id) is False


def test_create_access_token_and_verify_access_token_round_trip() -> None:
    payload = {"sub": "42"}
    token = create_access_token(payload)
    decoded = verify_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == "42"

    expired = create_access_token(payload, expires_delta=0)
    assert verify_access_token(expired) is None


def test_verify_password_uses_password_hash() -> None:
    hashed = get_password_hash("password123")
    assert verify_password("password123", hashed) is True
    assert verify_password("wrongpassword", hashed) is False
