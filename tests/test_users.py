import os

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from models import Collection, UserCollection
from tests.conftest import (
    auth_header,
    create_test_superuser,
    create_test_user,
    login_user,
)


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
