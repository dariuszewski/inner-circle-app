import pathlib
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Annotated, Any

from aiobotocore.client import AioBaseClient
from fastapi import (
    Depends,
    FastAPI,
    Header,
    HTTPException,
    Request,
    Response,
    UploadFile,
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
from storage import get_storage
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

# TBD - static files to be remvoed entirely and replaced by s3
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


# TBD - s3 endpoints to be removed eventually


@app.post("/api/create_bucket")
async def create_bucket(
    bucket_name: str, s3: Annotated[AioBaseClient, Depends(get_storage)]
) -> dict:
    await s3.create_bucket(Bucket=bucket_name)

    return {"message": f"Bucket '{bucket_name}' created successfully."}


@app.get("/api/list_buckets")
async def list_buckets(s3: Annotated[AioBaseClient, Depends(get_storage)]) -> dict:
    response = await s3.list_buckets()
    print(response)
    return {"buckets": response}


@app.get("/api/get_bucket")
async def get_bucket(
    bucket_name: str, s3: Annotated[AioBaseClient, Depends(get_storage)]
) -> dict:
    response = await s3.head_bucket(Bucket=bucket_name)
    return {"exists": response["ResponseMetadata"]["HTTPStatusCode"] == 200}


@app.post("/api/upload_file")
async def upload_file(
    bucket_name: str,
    file: UploadFile,
    s3: Annotated[AioBaseClient, Depends(get_storage)],
) -> dict:
    await s3.put_object(Bucket=bucket_name, Key=file.filename, Body=await file.read())
    return {"message": f"File '{file.filename}' uploaded successfully."}


@app.get("/api/files/{bucket_name}/{file_name}")
async def get_file(
    bucket_name: str,
    file_name: str,
    s3: Annotated[AioBaseClient, Depends(get_storage)],
) -> Response:
    response = await s3.get_object(
        Bucket=bucket_name,
        Key=file_name,
    )

    content = await response["Body"].read()

    return Response(
        content=content,
        media_type=response.get("ContentType", "application/octet-stream"),
    )


@app.delete("/api/delete_bucket")
async def delete_bucket(
    bucket_name: str, s3: Annotated[AioBaseClient, Depends(get_storage)]
) -> dict:
    await s3.delete_bucket(Bucket=bucket_name)
    return {"message": f"Bucket '{bucket_name}' deleted successfully."}


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
