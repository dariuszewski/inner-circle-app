import uuid

from fastapi.testclient import TestClient

from main import app


def test_collection_detail_paginates_media_and_reports_counts() -> None:
    unique = uuid.uuid4().hex[:8]
    username = f"collection_user_{unique}"
    email = f"{username}@example.com"

    with TestClient(app) as client:
        register_response = client.post(
            "/users/register",
            json={
                "username": username,
                "email": email,
                "password": "StrongPass123!",
            },
        )
        assert register_response.status_code == 201

        token_response = client.post(
            "/users/token",
            data={"username": username, "password": "StrongPass123!"},
        )
        assert token_response.status_code == 200
        token = token_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        create_collection_response = client.post(
            "/collections",
            json={"name": "City photos", "description": "Trip album"},
            headers=headers,
        )
        assert create_collection_response.status_code == 201
        collection_id = create_collection_response.json()["id"]

        for index in range(3):
            upload_response = client.post(
                f"/media?collection_id={collection_id}",
                files=[
                    (
                        "files",
                        (f"photo-{index}.jpg", b"fake-image-bytes", "image/jpeg"),
                    )
                ],
                headers=headers,
            )
            assert upload_response.status_code == 201

        detail_response = client.get(
            f"/collections/{collection_id}?page=1&per_page=2",
            headers=headers,
        )

    assert detail_response.status_code == 200
    data = detail_response.json()

    assert data["members_count"] == 1
    assert data["total_items"] == 3
    assert data["page"] == 1
    assert data["per_page"] == 2
    assert data["total_pages"] == 2
    assert len(data["media"]) == 2
