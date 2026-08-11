import uuid

from fastapi.testclient import TestClient

from main import app


def test_register_user_creates_account() -> None:
    unique = uuid.uuid4().hex[:8]
    username = f"alice_user_{unique}"
    email = f"alice_{unique}@example.com"

    with TestClient(app) as client:
        response = client.post(
            "/users/register",
            json={
                "username": username,
                "email": email,
                "password": "StrongPass123!",
            },
        )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == username
    assert "id" in data
    assert "created_at" in data


def test_login_returns_access_and_refresh_tokens() -> None:
    unique = uuid.uuid4().hex[:8]
    username = f"bob_user_{unique}"
    email = f"bob_{unique}@example.com"

    with TestClient(app) as client:
        client.post(
            "/users/register",
            json={
                "username": username,
                "email": email,
                "password": "StrongPass123!",
            },
        )

        response = client.post(
            "/users/token",
            data={"username": username, "password": "StrongPass123!"},
        )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_get_me_requires_valid_access_token() -> None:
    with TestClient(app) as client:
        response = client.get("/users/me")
    assert response.status_code == 401


def test_get_users_requires_superuser() -> None:
    with TestClient(app) as client:
        response = client.get("/users")
    assert response.status_code == 401
