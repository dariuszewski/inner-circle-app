import os
from collections.abc import AsyncGenerator, Callable, Generator
from pathlib import Path
from typing import Any, cast
from unittest.mock import AsyncMock
from urllib.parse import parse_qs, urlparse

import pytest
from httpx import AsyncClient
from httpx._transports.asgi import ASGITransport
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from database import get_db
from main import app
from models import Base, User, UserCollection, UserRole
from storage import get_storage
from utils.auth import get_password_hash

pytest_plugins = ["anyio"]

sent_token_emails: list[tuple[str, str, str]] = []


def get_sent_token(recipient: str, purpose: str) -> str:
    for email_purpose, email_recipient, email_link in reversed(sent_token_emails):
        if email_purpose == purpose and email_recipient == recipient:
            parsed_link = urlparse(email_link)
            token = parse_qs(parsed_link.fragment or parsed_link.query).get(
                "token", [None]
            )[0]
            if token is not None:
                return token
    raise AssertionError(f"No {purpose} email recorded for {recipient}.")


def get_token_from_email_link(email_link: str) -> str:
    parsed_link = urlparse(email_link)
    token = parse_qs(parsed_link.fragment or parsed_link.query).get("token", [None])[0]
    if token is None:
        raise AssertionError("Email link does not contain a token query parameter.")
    return token


os.environ["SECRET_KEY"] = "test-secret-key-that-is-at-least-32-bytes-long"
os.environ["ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "15"
os.environ["REFRESH_TOKEN_EXPIRE_DAYS"] = "7"
os.environ["SUPERUSER_USERNAME"] = "admin"
os.environ["SUPERUSER_EMAIL"] = "admin@gmail.com"
os.environ["SUPERUSER_PASSWORD"] = "pass1234"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test.db"
os.environ["BASE_URL"] = "http://localhost:8000"
os.environ["LOG_FILE"] = "requests.log"
os.environ["LOG_MAX_BYTES"] = "1048576"
os.environ["LOG_BACKUP_COUNT"] = "3"
os.environ["DEBUG"] = "True"
os.environ["DEMO_ALLOWED_DAYS"] = "7"
os.environ["MAX_UPLOAD_SIZE_BYTES"] = "10485760"
os.environ["MAX_DATA_STORAGE_PER_USER_BYTES"] = "1073741824"
os.environ["STORAGE_URL"] = "http://storage:8333"
os.environ["STORAGE_BUCKET_PROFILE_PICTURES"] = "profile-pictures"
os.environ["STORAGE_ACCESS_KEY"] = "inner_circle"
os.environ["STORAGE_SECRET_KEY"] = "inner_circle"
os.environ["STORAGE_REGION"] = "us-east-1"


@pytest.fixture(scope="session")
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_db_file() -> Generator[None, None, None]:
    yield
    for suffix in ("", "-shm", "-wal"):
        db_file = Path(f"test.db{suffix}")
        if db_file.exists():
            db_file.unlink()


@pytest.fixture(scope="session")
def test_engine() -> AsyncEngine:
    engine = create_async_engine(
        os.environ["DATABASE_URL"], poolclass=NullPool, echo=False
    )
    return engine


@pytest.fixture(scope="function")
async def setup_database(test_engine: AsyncEngine) -> AsyncGenerator[None, None]:
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await test_engine.dispose()


@pytest.fixture(scope="function")
async def db_session(
    test_engine: AsyncEngine,
    setup_database: None,
) -> AsyncGenerator[AsyncSession, None]:
    conn = await test_engine.connect()
    trans = await conn.begin()

    test_async_session = async_sessionmaker(
        bind=conn,
        class_=AsyncSession,
        expire_on_commit=False,
        join_transaction_mode="create_savepoint",
    )

    async with test_async_session() as session:
        try:
            yield session
        finally:
            await session.close()
            await trans.rollback()
            await conn.close()


@pytest.fixture
def mock_s3_client() -> AsyncMock:
    mock_client = AsyncMock()
    mock_client.put_object = AsyncMock(return_value={})
    mock_client.delete_object = AsyncMock(return_value={})
    return mock_client


@pytest.fixture(autouse=True)
def capture_emails(monkeypatch: pytest.MonkeyPatch) -> None:
    from routes import users as user_routes

    sent_token_emails.clear()

    def capture_token_email(purpose: str) -> Callable[..., None]:
        def capture(*args: object) -> None:
            recipient, email_link = args[0], args[2]
            assert isinstance(recipient, str)
            assert isinstance(email_link, str)
            sent_token_emails.append((purpose, recipient, email_link))

        return capture

    def ignore_email(*_args: object) -> None:
        return None

    monkeypatch.setattr(
        user_routes,
        "send_registration_verification_email",
        capture_token_email("verify"),
    )
    monkeypatch.setattr(
        user_routes, "send_demo_elevation_email", capture_token_email("verify")
    )
    monkeypatch.setattr(user_routes, "send_email_change_notice", ignore_email)
    monkeypatch.setattr(
        user_routes,
        "send_email_change_verification_email",
        capture_token_email("verify"),
    )
    monkeypatch.setattr(user_routes, "send_password_changed_email", ignore_email)
    monkeypatch.setattr(
        user_routes,
        "send_password_reset_email",
        capture_token_email("reset"),
    )
    monkeypatch.setattr(
        user_routes,
        "send_account_deletion_email",
        capture_token_email("verify"),
    )
    monkeypatch.setattr(user_routes, "send_welcome_email", ignore_email)


@pytest.fixture(scope="function")
async def client(
    db_session: AsyncSession, mock_s3_client: AsyncMock
) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    async def override_get_storage() -> AsyncGenerator[AsyncMock, None]:
        yield mock_s3_client

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_storage] = override_get_storage

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


async def create_test_superuser(db_session: AsyncSession) -> User:
    user = User(
        username=os.environ["SUPERUSER_USERNAME"],
        email=os.environ["SUPERUSER_EMAIL"],
        hashed_password=get_password_hash(os.environ["SUPERUSER_PASSWORD"]),
        is_verified=True,
        user_role=UserRole.ADMIN,
    )

    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    return user


async def create_test_user(
    client: AsyncClient, username: str, email: str, password: str
) -> dict[str, Any]:
    response = await client.post(
        "/api/users/register",
        json={
            "username": username,
            "email": email,
            "password": password,
            "password2": password,
        },
    )
    assert response.status_code == 201

    verification_token = get_sent_token(email, "verify")
    verify_response = await client.post(
        "/api/users/verify",
        json={"token": verification_token},
    )
    assert verify_response.status_code == 200

    login_response = await login_user(client, username, password)
    me_response = await client.get(
        "/api/users/me", headers=auth_header(login_response["access_token"])
    )
    assert me_response.status_code == 200
    return cast(dict[str, Any], me_response.json())


async def login_user(
    client: AsyncClient, username: str, password: str
) -> dict[str, Any]:
    response = await client.post(
        "/api/users/token",
        data={"username": username, "password": password},
    )
    assert response.status_code == 200
    return cast(dict[str, Any], response.json())


def auth_header(access_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {access_token}"}


async def create_test_collection(
    db_session: AsyncSession, user_id: int, name: str = "Test Collection"
) -> Any:
    from models import Collection

    collection = Collection(name=name, created_by_id=user_id)
    db_session.add(collection)
    await db_session.commit()
    await db_session.refresh(collection)
    return collection


async def add_user_to_collection_members(
    db_session: AsyncSession, user_id: int, collection_id: int
) -> None:

    user_collection = UserCollection(user_id=user_id, collection_id=collection_id)
    db_session.add(user_collection)
    await db_session.commit()
