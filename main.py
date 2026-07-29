import logging
import os
import pathlib
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Annotated, Any

from fastapi import (
    Cookie,
    FastAPI,
    Header,
    Request,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import or_, select

from database import AsyncSessionLocal, engine
from models import Base, User
from routes.collections import router as collection_router
from routes.media import router as media_router
from routes.users import router as user_router
from utils.auth import get_password_hash

SUPERUSER_USERNAME = os.getenv("SUPERUSER_USERNAME")
SUPERUSER_EMAIL = os.getenv("SUPERUSER_EMAIL")
SUPERUSER_PASSWORD = os.getenv("SUPERUSER_PASSWORD", "supersecretpassword")

UPLOAD_DIRECTORY: pathlib.Path = pathlib.Path("uploads")
BASE_MEDIA_URL: str = "http://127.0.0.1:8000/media"
UPLOAD_DIRECTORY.mkdir(exist_ok=True)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal.begin() as db:
        result = await db.execute(
            select(User).where(
                or_(
                    User.username == SUPERUSER_USERNAME,
                    User.email == SUPERUSER_EMAIL,
                )
            )
        )
        superuser = result.scalar_one_or_none()

        if superuser is None:
            db.add(
                User(
                    username=SUPERUSER_USERNAME,
                    email=SUPERUSER_EMAIL,
                    hashed_password=get_password_hash(SUPERUSER_PASSWORD),
                    is_active=True,
                    is_superuser=True,
                )
            )

    try:
        yield
    finally:
        await engine.dispose()


app = FastAPI(lifespan=lifespan)
app.include_router(user_router)
app.include_router(collection_router)
app.include_router(media_router)

app.mount(
    "/media",
    StaticFiles(directory=UPLOAD_DIRECTORY),
    name="media",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    filename="requests.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)

logger: logging.Logger = logging.getLogger("requests")


@app.middleware("http")
async def log_requests(request: Request, call_next: Any) -> Any:
    response = await call_next(request)

    logger.info(
        "%s %s status=%s",
        request.method,
        request.url.path,
        response.status_code,
    )

    return response


class Ad(BaseModel):
    id: int
    company: str
    location: str


ads: list[Ad] = [
    Ad(id=1, company="Company A", location="loc1"),
    Ad(id=2, company="Company B", location="loc2"),
    Ad(id=3, company="Company C", location="loc3"),
]


@app.get("/ads/")
async def get_ads(
    last_viewed_location: Annotated[str | None, Cookie()] = None,
) -> Ad | None:
    if last_viewed_location is None:
        return ads[0]
    for ad in ads:
        if ad.location == last_viewed_location:
            return ad
    return ads[0]


@app.get("/")
async def read_root(
    accept_language: Annotated[str | None, Header()] = None,
) -> dict:
    if accept_language and accept_language.startswith("pl"):
        return {"message": "Witaj, Świecie!"}

    return {"message": "Hello, World!"}
