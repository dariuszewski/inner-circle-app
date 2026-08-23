from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import CollectionInvitation
from tests.conftest import (
    add_user_to_collection_members,
    auth_header,
    create_test_user,
    login_user,
)
from utils.invitations import hash_invitation_token


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


@pytest.mark.anyio
async def test_get_detailed_collection(
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

    # Create a collection by active user
    collection_response = await client.post(
        "/collections", json={"name": "Test Collection"}, headers=headers
    )

    # Create media mocks
    media_response = await client.post(
        "/media",
        params={"collection_id": collection_response.json()["id"]},
        files=[
            ("files", ("photo1.jpg", b"fake-image-data", "image/jpeg")),
            ("files", ("photo2.png", b"more-fake-data", "image/png")),
        ],
        headers=headers,
    )

    # Set the cover image for the collection
    media_id = media_response.json()[0]["id"]
    await client.put(
        f"/collections/{collection_response.json()['id']}",
        json={"cover_image_id": media_id},
        headers=headers,
    )

    # Add the passive user to the collection members
    await add_user_to_collection_members(
        db_session, user_passive["id"], collection_response.json()["id"]
    )

    # get collection by id and assert the details
    response = await client.get(
        f"/collections/{collection_response.json()['id']}", headers=headers
    )
    assert response.status_code == 200

    assert response.json()["name"] == "Test Collection"
    assert response.json()["created_by"]["username"] == "active_user"
    assert response.json()["cover_image"]["id"] == media_id
    assert len(response.json()["members"]) == 2
    assert response.json()["members_count"] == 2
    assert len(response.json()["media"]) == 2
    assert response.json()["total_items"] == 2

    # Assert that pagination works correctly
    response = await client.get(
        f"/collections/{collection_response.json()['id']}?page=1&per_page=1",
        headers=headers,
    )
    assert response.status_code == 200
    assert len(response.json()["media"]) == 1
    assert response.json()["total_items"] == 2

    # Assert that the second page returns the second media item
    response = await client.get(
        f"/collections/{collection_response.json()['id']}?page=2&per_page=1",
        headers=headers,
    )
    assert response.status_code == 200
    assert len(response.json()["media"]) == 1

    # Assert that requesting a page beyond the available pages returns an empty list
    response = await client.get(
        f"/collections/{collection_response.json()['id']}?page=3&per_page=1",
        headers=headers,
    )
    assert response.status_code == 200
    assert len(response.json()["media"]) == 0

    # Assert that requesting bad collection returns 400
    response = await client.get("/collections/9999", headers=headers)
    assert response.status_code == 400

    # Assert that updating bad collection returns 400
    response = await client.put(
        "/collections/9999", json={"name": "Updated Name"}, headers=headers
    )
    assert response.status_code == 400


@pytest.mark.anyio
async def test_invitation_acceptance_leave_collection(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    # Create a test users
    owner = await create_test_user(
        client,
        username="active_user",
        email="active_user@example.com",
        password="StrongPass123!",
    )

    user = await create_test_user(
        client,
        username="passive_user",
        email="passive_user@example.com",
        password="StrongPass123!",
    )

    # Login as the active user
    token = await login_user(client, owner["username"], "StrongPass123!")
    headers = auth_header(token["access_token"])

    # Create a collection by active user
    collection_response = await client.post(
        "/collections", json={"name": "Test Collection"}, headers=headers
    )

    # Create invitation for the passive user
    invitation_response = await client.post(
        f"/collections/create-invitation/{collection_response.json()['id']}",
        headers=headers,
    )

    # Login as the passive user
    token = await login_user(client, user["username"], "StrongPass123!")
    headers = auth_header(token["access_token"])

    # Accept the invitation
    response = await client.put(
        f"/collections/accept-invitation/{
            invitation_response.json()['invitation_token']
        }",
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Invitation accepted successfully."

    # Assert that the passive user is now a member of the collection
    response = await client.get(
        f"/collections/{collection_response.json()['id']}", headers=headers
    )
    assert response.status_code == 200
    assert len(response.json()["members"]) == 2

    # Assert that the passive user can create an invitation link
    response = await client.post(
        f"/collections/create-invitation/{collection_response.json()['id']}",
        headers=headers,
    )
    assert response.status_code == 201

    # Leave the collection
    response = await client.delete(
        f"/collections/leave-collection/{collection_response.json()['id']}",
        headers=headers,
    )
    assert response.status_code == 200

    # Assert that the passive user is no longer a member of the collection
    response = await client.get(
        f"/collections/{collection_response.json()['id']}", headers=headers
    )
    assert response.status_code == 400

    # Assert that the passive user cannot leave the collection again
    response = await client.delete(
        f"/collections/leave-collection/{collection_response.json()['id']}",
        headers=headers,
    )
    assert response.status_code == 400

    # Assert that the passive user cannot create an invitation link after leaving
    response = await client.post(
        f"/collections/create-invitation/{collection_response.json()['id']}",
        headers=headers,
    )
    assert response.status_code == 400


@pytest.mark.anyio
async def test_expired_invitation_link(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    # Create a test users
    owner = await create_test_user(
        client,
        username="active_user",
        email="active_user@example.com",
        password="StrongPass123!",
    )

    user = await create_test_user(
        client,
        username="passive_user",
        email="passive_user@example.com",
        password="StrongPass123!",
    )

    # Login as the active user
    token = await login_user(client, owner["username"], "StrongPass123!")
    headers = auth_header(token["access_token"])

    # Create a collection by active user
    collection_response = await client.post(
        "/collections", json={"name": "Test Collection"}, headers=headers
    )

    # Create invitation for the passive user
    invitation_response = await client.post(
        f"/collections/create-invitation/{collection_response.json()['id']}",
        headers=headers,
    )

    # Expire the token
    invitation_query = await db_session.execute(
        select(CollectionInvitation).where(
            CollectionInvitation.token_hash
            == hash_invitation_token(invitation_response.json()["invitation_token"])
        )
    )
    invitation = invitation_query.scalar_one()
    invitation.valid_until = datetime.now(UTC) - timedelta(seconds=1)
    await db_session.commit()
    await db_session.refresh(invitation)

    # Login as the passive user
    token = await login_user(client, user["username"], "StrongPass123!")
    headers = auth_header(token["access_token"])

    # Attempt to accept the expired invitation
    response = await client.put(
        f"/collections/accept-invitation/{
            invitation_response.json()['invitation_token']
        }",
        headers=headers,
    )
    assert response.status_code == 400
