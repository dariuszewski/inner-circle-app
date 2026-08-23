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
