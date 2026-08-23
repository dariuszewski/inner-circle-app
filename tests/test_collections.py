import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from tests.conftest import (
    add_user_to_collection_members,
    auth_header,
    create_test_user,
    login_user,
)


@pytest.mark.anyio
async def test_get_collections_and_filters(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    # Create a test users
    user_active = await create_test_user(
        client,
        username="active_user",
        email="active_user@example.com",
        password="StrongPass123!",
    )

    user_passive = await create_test_user(
        client,
        username="passive_user",
        email="passive_user@example.com",
        password="StrongPass123!",
    )

    # Login as the active user
    token = await login_user(client, user_active["username"], "StrongPass123!")
    headers = auth_header(token["access_token"])

    # Create collections by active user
    collection1 = await client.post(
        "/collections", json={"name": "1st Collection"}, headers=headers
    )
    await client.post("/collections", json={"name": "2nd Collection"}, headers=headers)

    # Add the passive user to collection1
    await add_user_to_collection_members(
        db_session, user_passive["id"], collection1.json()["id"]
    )

    # Assert that the active user can retrieve all collections
    response = await client.get("/collections", headers=headers)
    assert response.status_code == 200
    assert len(response.json()["items"]) == 2
    assert response.json()["total_items"] == 2

    # Assert that the active user can filter collections by name
    response = await client.get("/collections?collection_name=1st", headers=headers)
    assert len(response.json()["items"]) == 1
    assert response.json()["total_items"] == 1

    # Assert that the active user can filter collections by member username
    response = await client.get(
        "/collections?collection_member=passive", headers=headers
    )
    print(response.json())
    assert len(response.json()["items"]) == 1
    assert response.json()["total_items"] == 1

    # Assert that the active user can filter collections by name and member username
    response = await client.get(
        "/collections?collection_name=1st&collection_member=passive", headers=headers
    )
    assert len(response.json()["items"]) == 1
    assert response.json()["total_items"] == 1


@pytest.mark.anyio
async def test_create_collection(client: AsyncClient) -> None:
    # Create a test user
    user = await create_test_user(
        client,
        username="test_user",
        email="test_user@example.com",
        password="StrongPass123!",
    )
    # Login as the test user
    token = await login_user(client, user["username"], "StrongPass123!")
    headers = auth_header(token["access_token"])

    # Create a collection
    response = await client.post(
        "/collections", json={"name": "Test Collection"}, headers=headers
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Test Collection"

    # assert collection is retrieved by id
    collection_id = response.json()["id"]
    response = await client.get(f"/collections/{collection_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Test Collection"
