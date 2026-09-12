import pathlib
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Annotated, Any

from fastapi import (
    FastAPI,
    Header,
    HTTPException,
    Request,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from config import settings
from database import AsyncSessionLocal, engine
from models import Base
from routes.collections import router as collection_router
from routes.media import router as media_router
from routes.users import router as user_router
from utils.bootstrap import ensure_superuser
from utils.logging_config import logger, request_id_context

pathlib.Path(settings.upload_directory).mkdir(exist_ok=True)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal.begin() as db:
        await ensure_superuser(db)

    try:
        yield
    finally:
        await engine.dispose()


app = FastAPI(
    lifespan=lifespan,
    title=settings.app_title,
    version=settings.app_version,
    description=settings.app_description,
)
app.include_router(user_router, prefix="/api")
app.include_router(collection_router, prefix="/api")
app.include_router(media_router, prefix="/api")

app.mount(
    settings.uploads_mount_path,
    StaticFiles(directory=settings.upload_directory),
    name="uploads",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)


@app.middleware("http")
async def add_request_id(request: Request, call_next: Any) -> Any:
    request_id = str(uuid.uuid4())
    token = request_id_context.set(request_id)

    try:
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        logger.info(
            "%s %s status=%s",
            request.method,
            request.url.path,
            response.status_code,
        )
        return response
    finally:
        request_id_context.reset(token)


@app.get("/api/")
async def read_root(
    accept_language: Annotated[str | None, Header()] = None,
) -> dict:
    if accept_language and accept_language.startswith("pl"):
        return {"message": "Witaj, Świecie!"}

    return {"message": "Hello, World!"}


frontend_dist = pathlib.Path(__file__).parent / "frontend" / "dist"

if frontend_dist.exists():

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str) -> FileResponse:
        if (
            full_path.startswith("api")
            or full_path.startswith("docs")
            or full_path.startswith("redoc")
            or full_path.startswith("openapi.json")
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Not Found"
            )

        file_path = frontend_dist / full_path
        if full_path and file_path.is_file():
            return FileResponse(file_path)

        return FileResponse(frontend_dist / "index.html")
else:

    @app.get("/")
    async def read_root_fallback() -> dict:
        return {"message": "Hello, World!"}
