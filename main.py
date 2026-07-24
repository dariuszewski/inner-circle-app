import enum
import pathlib
from typing import Annotated

from fastapi import (
    FastAPI,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, computed_field

UPLOAD_DIRECTORY = pathlib.Path("uploads")
UPLOAD_DIRECTORY.mkdir(exist_ok=True)

BASE_MEDIA_URL = "http://127.0.0.1:8000/media"

app = FastAPI()

app.mount(
    "/media",
    StaticFiles(directory=UPLOAD_DIRECTORY),
    name="media",
)


class MediaType(enum.StrEnum):
    image = "image"
    video = "video"


def get_media_type(raw_media_type: str | None) -> MediaType:
    if raw_media_type is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file has no content type",
        )

    if raw_media_type.startswith("image/"):
        return MediaType.image

    if raw_media_type.startswith("video/"):
        return MediaType.video

    raise HTTPException(
        status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
        detail="Only image and video files are supported",
    )


class MediaItem(BaseModel):
    id: int
    name: str
    description: str | None = None
    location: str | None = None
    media_type: MediaType

    @computed_field
    def media_url(self) -> str:
        return f"{BASE_MEDIA_URL}/{self.name}"


collection: list[MediaItem] = []


@app.post(
    "/items/",
    status_code=status.HTTP_201_CREATED,
)
async def create_item(
    file: Annotated[UploadFile, File()],
    description: Annotated[
        str | None,
        Form(min_length=10, max_length=100),
    ] = None,
    location: Annotated[
        str | None,
        Form(min_length=3, max_length=100),
    ] = None,
) -> MediaItem:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file has no filename",
        )

    filename = pathlib.Path(file.filename).name
    file_path = UPLOAD_DIRECTORY / filename

    try:
        with file_path.open("wb") as destination:
            while chunk := await file.read(1024 * 1024):
                destination.write(chunk)
    finally:
        await file.close()

    item = MediaItem(
        id=len(collection) + 1,
        name=filename,
        description=description,
        location=location,
        media_type=get_media_type(file.content_type),
    )

    collection.append(item)
    return item
