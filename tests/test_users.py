import os

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

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
        ("regular_user", "regular@example.com", "StrongPass123!", 403),
    ],
)
async def test_get_users(
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
