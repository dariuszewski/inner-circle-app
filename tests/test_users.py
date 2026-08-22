import os
from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from models import (
    Collection,
    User,
    UserCollection,
    UserRole,
    VerificationToken,
    VerificationTokenPurpose,
)
from tests.conftest import (
    auth_header,
    create_test_superuser,
    create_test_user,
    login_user,
)
from utils.auth import get_password_hash


@pytest.mark.anyio
@pytest.mark.parametrize(
    ("username", "email", "password", "expected_status"),
    [
        (None, None, None, 401),
        (
            os.environ["SUPERUSER_USERNAME"],
            os.environ["SUPERUSER_EMAIL"],
            os.environ["SUPERUSER_PASSWORD"],
            200,
        ),
        ("regular_user", "regular@example.com", "StrongPass123!", 200),
    ],
)
async def test_get_users_responses(
    client: AsyncClient,
    db_session: AsyncSession,
    username: str | None,
    email: str | None,
    password: str | None,
    expected_status: int,
) -> None:
    headers = {}

    if username == os.environ["SUPERUSER_USERNAME"]:
        assert password is not None
        await create_test_superuser(db_session)
        token = await login_user(client, username, password)
        headers = auth_header(token["access_token"])
    elif username is not None:
        assert email is not None
        assert password is not None
        await create_test_user(client, username, email, password)
        token = await login_user(client, username, password)
        headers = auth_header(token["access_token"])

    response = await client.get("/users", headers=headers)

    assert response.status_code == expected_status


@pytest.mark.anyio
async def test_get_users_regular_user_only_sees_shared_collection_members(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    user_a = await create_test_user(
        client, "user_a", "user_a@example.com", "StrongPass123!"
    )
    user_b = await create_test_user(
        client, "user_b", "user_b@example.com", "StrongPass123!"
    )
    await create_test_user(client, "user_c", "user_c@example.com", "StrongPass123!")

    collection = Collection(name="Shared collection")
    db_session.add(collection)
    await db_session.commit()
    await db_session.refresh(collection)

    db_session.add_all(
        [
            UserCollection(user_id=user_a["id"], collection_id=collection.id),
            UserCollection(user_id=user_b["id"], collection_id=collection.id),
        ]
    )
    await db_session.commit()

    token = await login_user(client, "user_a", "StrongPass123!")
    headers = auth_header(token["access_token"])

    response = await client.get("/users", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["total_items"] == 1
    assert [user["username"] for user in body["items"]] == ["user_b"]


@pytest.mark.anyio
async def test_get_user_allows_shared_collection_members_only(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    user_a = await create_test_user(
        client, "user_a", "user_a@example.com", "StrongPass123!"
    )
    user_b = await create_test_user(
        client, "user_b", "user_b@example.com", "StrongPass123!"
    )
    user_c = await create_test_user(
        client, "user_c", "user_c@example.com", "StrongPass123!"
    )

    collection = Collection(name="Shared collection")
    db_session.add(collection)
    await db_session.commit()
    await db_session.refresh(collection)

    db_session.add_all(
        [
            UserCollection(user_id=user_a["id"], collection_id=collection.id),
            UserCollection(user_id=user_b["id"], collection_id=collection.id),
        ]
    )
    await db_session.commit()

    token = await login_user(client, "user_a", "StrongPass123!")
    headers = auth_header(token["access_token"])

    own_response = await client.get(f"/users/{user_a['id']}", headers=headers)
    assert own_response.status_code == 200

    shared_response = await client.get(f"/users/{user_b['id']}", headers=headers)
    assert shared_response.status_code == 200

    unshared_response = await client.get(f"/users/{user_c['id']}", headers=headers)
    assert unshared_response.status_code == 403


@pytest.mark.anyio
async def test_regular_user_must_verify_before_accessing_protected_endpoints(
    client: AsyncClient,
) -> None:
    register_response = await client.post(
        "/users/register",
        json={
            "username": "unverified_user",
            "email": "unverified_user@example.com",
            "password": "StrongPass123!",
        },
    )
    assert register_response.status_code == 201
    verification_link = register_response.json()["verification_link"]
    verification_token = verification_link.rsplit("/", 1)[-1]

    token = await login_user(client, "unverified_user", "StrongPass123!")
    headers = auth_header(token["access_token"])

    blocked_response = await client.get("/users/me", headers=headers)
    assert blocked_response.status_code == 403

    verify_response = await client.get(f"/users/verify/{verification_token}")
    assert verify_response.status_code == 200

    me_response = await client.get("/users/me", headers=headers)
    assert me_response.status_code == 200
    body = me_response.json()
    assert body["is_verified"] is True
    assert body["user_role"] == "regular"


@pytest.mark.anyio
async def test_demo_user_registration_skips_verification(
    client: AsyncClient,
) -> None:
    register_response = await client.post(
        "/users/register",
        json={"username": "demo_user", "password": "StrongPass123!"},
    )
    assert register_response.status_code == 201

    token = await login_user(client, "demo_user", "StrongPass123!")
    headers = auth_header(token["access_token"])

    me_response = await client.get("/users/me", headers=headers)
    assert me_response.status_code == 200
    body = me_response.json()
    assert body["is_verified"] is False
    assert body["user_role"] == "demo"


@pytest.mark.anyio
async def test_demo_user_can_register_email_and_verify_it(
    client: AsyncClient,
) -> None:
    register_response = await client.post(
        "/users/register",
        json={"username": "upgrading_demo", "password": "StrongPass123!"},
    )
    assert register_response.status_code == 201

    token = await login_user(client, "upgrading_demo", "StrongPass123!")
    headers = auth_header(token["access_token"])

    email_response = await client.patch(
        "/users/elevate-demo",
        json={"email": "upgrading_demo@example.com"},
        headers=headers,
    )
    assert email_response.status_code == 200
    verification_token = email_response.json()["verification_link"].rsplit("/", 1)[-1]

    still_demo_response = await client.get("/users/me", headers=headers)
    assert still_demo_response.status_code == 200
    assert still_demo_response.json()["user_role"] == "demo"
    assert still_demo_response.json()["is_verified"] is False

    verify_response = await client.get(f"/users/verify/{verification_token}")
    assert verify_response.status_code == 200

    me_response = await client.get("/users/me", headers=headers)
    assert me_response.status_code == 200
    body = me_response.json()
    assert body["user_role"] == "regular"
    assert body["is_verified"] is True
    assert body["email"] == "upgrading_demo@example.com"


@pytest.mark.anyio
async def test_regular_user_cannot_register_demo_email(
    client: AsyncClient,
) -> None:
    await create_test_user(
        client, "already_regular", "already_regular@example.com", "StrongPass123!"
    )
    token = await login_user(client, "already_regular", "StrongPass123!")
    headers = auth_header(token["access_token"])

    response = await client.patch(
        "/users/elevate-demo",
        json={"email": "new_email@example.com"},
        headers=headers,
    )
    assert response.status_code == 400


@pytest.mark.anyio
async def test_expired_demo_user_loses_access_but_keeps_me_endpoint(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    register_response = await client.post(
        "/users/register",
        json={"username": "expired_demo", "password": "StrongPass123!"},
    )
    assert register_response.status_code == 201

    token = await login_user(client, "expired_demo", "StrongPass123!")
    headers = auth_header(token["access_token"])

    result = await db_session.execute(
        select(User).where(User.username == "expired_demo")
    )
    demo_user = result.scalar_one()
    demo_user.created_at = datetime.now(UTC) - timedelta(
        days=settings.demo_allowed_days + 1
    )
    await db_session.commit()

    me_response = await client.get("/users/me", headers=headers)
    assert me_response.status_code == 200

    users_response = await client.get("/users", headers=headers)
    assert users_response.status_code == 403


@pytest.mark.anyio
async def test_regular_user_normal_registration_flow(
    client: AsyncClient,
) -> None:
    register_response = await client.post(
        "/users/register",
        json={
            "username": "flow_user",
            "email": "flow_user@example.com",
            "password": "StrongPass123!",
        },
    )
    assert register_response.status_code == 201
    verification_link = register_response.json()["verification_link"]
    verification_token = verification_link.rsplit("/", 1)[-1]

    verify_response = await client.get(f"/users/verify/{verification_token}")
    assert verify_response.status_code == 200

    token = await login_user(client, "flow_user", "StrongPass123!")
    headers = auth_header(token["access_token"])

    me_response = await client.get("/users/me", headers=headers)
    assert me_response.status_code == 200
    body = me_response.json()
    assert body["username"] == "flow_user"
    assert body["email"] == "flow_user@example.com"
    assert body["is_verified"] is True
    assert body["user_role"] == "regular"


@pytest.mark.anyio
@pytest.mark.parametrize(
    (
        "username",
        "email",
        "seed_conflict",
        "expected_status",
        "expected_detail",
        "expect_link",
    ),
    [
        (
            "new_user",
            "new_user@example.com",
            False,
            201,
            "Registration successful. Please verify your account.",
            True,
        ),
        (
            "new_demo_user",
            None,
            False,
            201,
            "Successfully registered as a demo user.",
            False,
        ),
        (
            "race_user",
            "race_user@example.com",
            True,
            409,
            "Username or email already exists.",
            False,
        ),
    ],
)
async def test_register_responses(
    client: AsyncClient,
    db_session: AsyncSession,
    username: str,
    email: str | None,
    seed_conflict: bool,
    expected_status: int,
    expected_detail: str,
    expect_link: bool,
) -> None:
    if seed_conflict:
        assert email is not None
        db_session.add(
            User(
                username=username,
                email=email,
                hashed_password=get_password_hash("StrongPass123!"),
            )
        )
        await db_session.commit()

    payload: dict[str, str] = {"username": username, "password": "StrongPass123!"}
    if email is not None:
        payload["email"] = email

    response = await client.post("/users/register", json=payload)

    assert response.status_code == expected_status
    body = response.json()
    assert body["detail"] == expected_detail
    if expected_status != 201:
        return
    if expect_link:
        assert body["verification_link"] is not None
        assert body["verification_link"].startswith(
            f"{settings.base_url}/users/verify/"
        )
    else:
        assert body["verification_link"] is None


@pytest.mark.anyio
async def test_register_demo_email_existing_email_returns_409(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    existing_user = User(
        username="email_owner",
        email="taken@example.com",
        hashed_password=get_password_hash("StrongPass123!"),
        is_verified=True,
    )
    db_session.add(existing_user)
    await db_session.commit()

    register_response = await client.post(
        "/users/register",
        json={"username": "race_demo", "password": "StrongPass123!"},
    )
    assert register_response.status_code == 201

    token = await login_user(client, "race_demo", "StrongPass123!")
    headers = auth_header(token["access_token"])

    response = await client.patch(
        "/users/elevate-demo",
        json={"email": "taken@example.com"},
        headers=headers,
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Email already in use."


@pytest.mark.anyio
async def test_verify_registration_invalid_token_returns_400(
    client: AsyncClient,
) -> None:
    response = await client.get("/users/verify/not-a-real-token")

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid or expired verification link."


@pytest.mark.anyio
async def test_update_user(client: AsyncClient) -> None:
    await create_test_user(client, "user", "user@example.com", "StrongPass123!")
    token = await login_user(client, "user", "StrongPass123!")
    headers = auth_header(token["access_token"])

    await client.patch(
        "/users/update", json={"username": "updated_user"}, headers=headers
    )

    me_response = await client.get("/users/me", headers=headers)

    assert me_response.json()["username"] == "updated_user"


@pytest.mark.anyio
async def test_change_email_same_as_current_email(client: AsyncClient) -> None:
    await create_test_user(
        client, "email_user", "email_user@example.com", "StrongPass123!"
    )
    token = await login_user(client, "email_user", "StrongPass123!")
    headers = auth_header(token["access_token"])

    response = await client.post(
        "/users/change-email",
        json={"email": "email_user@example.com"},
        headers=headers,
    )

    assert response.status_code == 400
    assert (
        response.json()["detail"]
        == "New email cannot be the same as the current email."
    )


@pytest.mark.anyio
async def test_change_email_happy_path(client: AsyncClient) -> None:
    await create_test_user(
        client, "email_user2", "email_user2@example.com", "StrongPass123!"
    )
    token = await login_user(client, "email_user2", "StrongPass123!")
    headers = auth_header(token["access_token"])

    response = await client.post(
        "/users/change-email",
        json={"email": "new_email_user2@example.com"},
        headers=headers,
    )

    assert response.status_code == 200
    verification_link = response.json()["verification_link"]

    verify_response = await client.get(verification_link)
    assert verify_response.status_code == 200
    assert verify_response.json()["detail"] == "Email changed successfully."

    me_response = await client.get("/users/me", headers=headers)
    assert me_response.json()["email"] == "new_email_user2@example.com"


@pytest.mark.anyio
async def test_request_password_reset_user_not_found_returns_404(
    client: AsyncClient,
) -> None:
    response = await client.post(
        "/users/reset-password", json={"email": "nobody@example.com"}
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "No user found with the provided email."


@pytest.mark.anyio
async def test_request_password_reset_happy_path(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    await create_test_user(
        client, "reset_user", "reset_user@example.com", "StrongPass123!"
    )

    response = await client.post(
        "/users/reset-password", json={"email": "RESET_USER@example.com"}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["detail"] == "Password reset link generated."
    assert body["verification_link"].startswith(
        f"{settings.base_url}/users/reset-password/"
    )

    token = await db_session.scalar(
        select(VerificationToken).where(
            VerificationToken.purpose == VerificationTokenPurpose.PASSWORD_RESET
        )
    )
    assert token is not None
    assert token.current_email == "reset_user@example.com"


@pytest.mark.anyio
async def test_verify_registration_token_cannot_be_reused(
    client: AsyncClient,
) -> None:
    register_response = await client.post(
        "/users/register",
        json={
            "username": "verify_reuse_user",
            "email": "verify_reuse_user@example.com",
            "password": "StrongPass123!",
        },
    )
    verification_link = register_response.json()["verification_link"]

    first_verify = await client.get(verification_link)
    assert first_verify.status_code == 200
    assert first_verify.json()["detail"] == "Account verified successfully."

    second_verify = await client.get(verification_link)
    assert second_verify.status_code == 400
    assert second_verify.json()["detail"] == "Invalid or expired verification link."


@pytest.mark.anyio
async def test_verify_demo_elevation_happy_path(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    register_response = await client.post(
        "/users/register", json={"username": "demo_user", "password": "StrongPass123!"}
    )
    assert register_response.status_code == 201

    token = await login_user(client, "demo_user", "StrongPass123!")
    headers = auth_header(token["access_token"])

    elevate_response = await client.patch(
        "/users/elevate-demo",
        json={"email": "elevated_demo_user@example.com"},
        headers=headers,
    )
    assert elevate_response.status_code == 200
    verification_link = elevate_response.json()["verification_link"]

    verify_response = await client.get(verification_link)
    assert verify_response.status_code == 200
    assert verify_response.json()["detail"] == "Account elevated successfully."

    user = await db_session.scalar(select(User).where(User.username == "demo_user"))
    assert user is not None
    assert user.is_verified is True
    assert user.email == "elevated_demo_user@example.com"
    assert user.user_role == UserRole.REGULAR


@pytest.mark.anyio
async def test_verify_email_change_token_cannot_be_reused(
    client: AsyncClient,
) -> None:
    await create_test_user(
        client, "email_reuse_user", "email_reuse_user@example.com", "StrongPass123!"
    )
    token = await login_user(client, "email_reuse_user", "StrongPass123!")
    headers = auth_header(token["access_token"])

    change_response = await client.post(
        "/users/change-email",
        json={"email": "new_email_reuse_user@example.com"},
        headers=headers,
    )
    verification_link = change_response.json()["verification_link"]

    first_verify = await client.get(verification_link)
    assert first_verify.status_code == 200

    second_verify = await client.get(verification_link)
    assert second_verify.status_code == 400
    assert second_verify.json()["detail"] == "Invalid or expired verification link."


@pytest.mark.anyio
async def test_verify_password_reset_happy_path(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    await create_test_user(
        client, "reset_verify_user", "reset_verify_user@example.com", "StrongPass123!"
    )

    reset_response = await client.post(
        "/users/reset-password", json={"email": "reset_verify_user@example.com"}
    )
    assert reset_response.status_code == 200

    # the reset-password endpoint doesn't collect a new password yet, so the
    # pending token's future_password_hash is set directly for this test
    new_password_hash = get_password_hash("NewStrongPass456!")
    token = await db_session.scalar(
        select(VerificationToken).where(
            VerificationToken.purpose == VerificationTokenPurpose.PASSWORD_RESET
        )
    )
    assert token is not None
    token.future_password_hash = new_password_hash
    await db_session.commit()

    raw_token = reset_response.json()["verification_link"].rsplit("/", 1)[-1]
    verify_response = await client.get(f"/users/verify/{raw_token}")

    assert verify_response.status_code == 200
    assert verify_response.json()["detail"] == "Password reset successfully."

    old_login = await client.post(
        "/users/token",
        data={"username": "reset_verify_user", "password": "StrongPass123!"},
    )
    assert old_login.status_code == 401

    new_login = await client.post(
        "/users/token",
        data={"username": "reset_verify_user", "password": "NewStrongPass456!"},
    )
    assert new_login.status_code == 200

    await db_session.refresh(token)
    assert token.is_used is True
    assert token.future_password_hash is None


@pytest.mark.anyio
async def test_refresh_invalid_token_returns_401(
    client: AsyncClient,
) -> None:
    response = await client.post(
        "/users/refresh",
        json={"refresh_token": "not-a-real-refresh-token"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid refresh token."
