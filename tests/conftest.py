import os
from collections.abc import AsyncGenerator, Generator
from pathlib import Path
from typing import Any, cast

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
from models import Base, User
from utils.auth import get_password_hash

pytest_plugins = ["anyio"]


os.environ["SECRET_KEY"] = "test-secret-key-that-is-at-least-32-bytes-long"
os.environ["ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "15"
os.environ["REFRESH_TOKEN_EXPIRE_DAYS"] = "7"
os.environ["SUPERUSER_USERNAME"] = "admin"
os.environ["SUPERUSER_EMAIL"] = "admin@gmail.com"
os.environ["SUPERUSER_PASSWORD"] = "pass1234"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test.db"
os.environ["BASE_URL"] = "http://localhost:8000"
os.environ["UPLOAD_DIRECTORY"] = "uploads"
os.environ["LOG_FILE"] = "requests.log"
os.environ["LOG_MAX_BYTES"] = "1048576"
os.environ["LOG_BACKUP_COUNT"] = "3"
os.environ["DEBUG"] = "True"


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


@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

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
        is_superuser=True,
    )

    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    return user


async def create_test_user(
    client: AsyncClient, username: str, email: str, password: str
) -> dict[str, Any]:
    response = await client.post(
        "/users/register",
        json={"username": username, "email": email, "password": password},
    )
    assert response.status_code == 201
    return cast(dict[str, Any], response.json())


async def login_user(
    client: AsyncClient, username: str, password: str
) -> dict[str, Any]:
    response = await client.post(
        "/users/token",
        data={"username": username, "password": password},
    )
    assert response.status_code == 200
    return cast(dict[str, Any], response.json())


def auth_header(access_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {access_token}"}
