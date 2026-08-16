from collections.abc import AsyncGenerator
from typing import Any

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import StaticPool

from config import settings
from models import Base


def build_engine(database_url: str | None = None) -> AsyncEngine:
    database_url = database_url or settings.effective_database_url
    engine_kwargs: dict[str, Any] = {"echo": settings.debug}

    if settings.is_test_environment:
        engine_kwargs["connect_args"] = {"check_same_thread": False}
        engine_kwargs["poolclass"] = StaticPool

    return create_async_engine(database_url, **engine_kwargs)


engine = build_engine()

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as db:
        yield db


__all__ = ["Base", "build_engine", "engine", "AsyncSessionLocal", "get_db"]
