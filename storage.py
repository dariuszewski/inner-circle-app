from collections.abc import AsyncGenerator

import aioboto3
from aiobotocore.client import AioBaseClient

from config import settings


def build_session() -> aioboto3.Session:
    return aioboto3.Session()


session = build_session()


async def get_storage() -> AsyncGenerator[AioBaseClient, None]:
    async with session.client(
        "s3",
        endpoint_url=settings.storage_url,
        aws_access_key_id=settings.storage_access_key,
        aws_secret_access_key=settings.storage_secret_key,
        region_name="us-east-1",
    ) as client:
        yield client


__all__ = [
    "build_session",
    "get_storage",
    "session",
]
