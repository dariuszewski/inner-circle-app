import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from tests.conftest import auth_header, create_test_user, login_user


@pytest.mark.anyio
async def test_upload_and_retrieve_media(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    # Create a test user and log in
    user = await create_test_user(
        client,
        username="passive_user",
        email="passive_user@example.com",
        password="StrongPass123!",
    )

    # Login as the active user
    token = await login_user(client, user["username"], "StrongPass123!")
    headers = auth_header(token["access_token"])

    # Create a collection for the user
    collection_response = await client.post(
        "/collections",
        json={"name": "Test Collection", "description": "A test collection."},
        headers=headers,
    )

    # Assert that user can't upload to a bad collection
    media_response = await client.post(
        "/media",
        params={"collection_id": 9999},
        files=[
            ("files", ("photo1.jpg", b"fake-image-data", "image/jpeg")),
            ("files", ("photo2.png", b"more-fake-data", "image/png")),
        ],
        headers=headers,
    )
    assert media_response.status_code == 400

    # Assert that user can upload media to the collection
    media_response = await client.post(
        "/media",
        params={"collection_id": collection_response.json()["id"]},
        files=[
            ("files", ("photo1.jpg", b"fake-image-data", "image/jpeg")),
            ("files", ("photo2.png", b"more-fake-data", "image/png")),
        ],
        headers=headers,
    )
    assert media_response.status_code == 201

    # Assert that user can retrieve the uploaded media
    media_id = media_response.json()[0]["id"]
    retrieve_response = await client.get(f"/media/{media_id}", headers=headers)
    assert retrieve_response.status_code == 200

    # Assert 400 if media not found or user doesn't have access
    bad_retrieve_response = await client.get("/media/9999", headers=headers)
    assert bad_retrieve_response.status_code == 400

    # Assert user can delete media
    delete_response = await client.delete(f"/media/{media_id}", headers=headers)
    assert delete_response.status_code == 204

    # Assert 400 if user tries to delete media they don't have access to
    bad_delete_response = await client.delete("/media/9999", headers=headers)
    assert bad_delete_response.status_code == 400


@pytest.mark.anyio
async def test_comment_and_reactions(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    # Create a test user and log in
    user = await create_test_user(
        client,
        username="passive_user",
        email="passive_user@example.com",
        password="StrongPass123!",
    )

    # Login as the active user
    token = await login_user(client, user["username"], "StrongPass123!")
    headers = auth_header(token["access_token"])

    # Create a collection for the user
    collection_response = await client.post(
        "/collections",
        json={"name": "Test Collection", "description": "A test collection."},
        headers=headers,
    )
    media_response = await client.post(
        "/media",
        params={"collection_id": collection_response.json()["id"]},
        files=[
            ("files", ("photo1.jpg", b"fake-image-data", "image/jpeg")),
            ("files", ("photo2.png", b"more-fake-data", "image/png")),
        ],
        headers=headers,
    )

    # Assert that user can comment on the media
    media_id = media_response.json()[0]["id"]
    comment_response = await client.post(
        f"/media/comment/{media_id}",
        json={"content": "This is a test comment."},
        headers=headers,
    )
    assert comment_response.status_code == 201

    # Assert that user can react to the media
    reaction_response = await client.post(
        f"/media/react/{media_id}",
        json={"type": "like"},
        headers=headers,
    )
    assert reaction_response.status_code == 201

    # Assert that comment and reaction is visible when retrieving media
    retrieve_response = await client.get(f"/media/{media_id}", headers=headers)
    assert retrieve_response.status_code == 200
    assert (
        retrieve_response.json()["comments"][0]["content"] == "This is a test comment."
    )
    assert retrieve_response.json()["reactions"][0]["type"] == "like"

    # Assert that user can delete their comment and reaction
    comment_id = 1
    delete_comment_response = await client.delete(
        f"/media/comment/{comment_id}", headers=headers
    )
    assert delete_comment_response.status_code == 204
    reaction_id = 1
    delete_reaction_response = await client.delete(
        f"/media/react/{reaction_id}", headers=headers
    )
    assert delete_reaction_response.status_code == 204

    # Assert that comment and reaction is no longer visible when retrieving media
    retrieve_response_after_delete = await client.get(
        f"/media/{media_id}", headers=headers
    )
    assert retrieve_response_after_delete.status_code == 200
    assert len(retrieve_response_after_delete.json()["comments"]) == 0
    assert len(retrieve_response_after_delete.json()["reactions"]) == 0

    # Assert 400 if reaction or comment not found
    bad_delete_comment_response = await client.delete(
        "/media/comment/9999", headers=headers
    )
    assert bad_delete_comment_response.status_code == 400
    bad_delete_reaction_response = await client.delete(
        "/media/react/9999", headers=headers
    )
    assert bad_delete_reaction_response.status_code == 400


@pytest.mark.anyio
async def test_comment_and_reaction_access_control(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    # Create two test users and log in
    user1 = await create_test_user(
        client,
        username="user1",
        email="user1@example.com",
        password="password123",
    )
    user2 = await create_test_user(
        client,
        username="user2",
        email="user2@example.com",
        password="password123",
    )
    # Login as user1
    token1 = await login_user(client, user1["username"], "password123")
    headers1 = auth_header(token1["access_token"])

    # Create a collection for user1
    collection_response = await client.post(
        "/collections",
        json={"name": "User1 Collection", "description": "A test collection."},
        headers=headers1,
    )

    # Upload media to the collection
    media_response = await client.post(
        "/media",
        params={"collection_id": collection_response.json()["id"]},
        files=[
            ("files", ("photo1.jpg", b"fake-image-data", "image/jpeg")),
        ],
        headers=headers1,
    )

    # Login as user2
    token2 = await login_user(client, user2["username"], "password123")
    headers2 = auth_header(token2["access_token"])

    # Assert that user2 cannot comment on user1's media
    media_id = media_response.json()[0]["id"]
    comment_response = await client.post(
        f"/media/comment/{media_id}",
        json={"content": "This is a test comment."},
        headers=headers2,
    )
    assert comment_response.status_code == 400

    # Assert that user2 cannot react to user1's media
    reaction_response = await client.post(
        f"/media/react/{media_id}",
        json={"type": "like"},
        headers=headers2,
    )
    assert reaction_response.status_code == 400
