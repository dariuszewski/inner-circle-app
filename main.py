import enum
import pathlib
from typing import Annotated

from fastapi import (
    Body,
    Cookie,
    FastAPI,
    File,
    Form,
    Header,
    HTTPException,
    Path,
    Query,
    Response,
    UploadFile,
    status,
)
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field, computed_field

UPLOAD_DIRECTORY: pathlib.Path = pathlib.Path("uploads")
BASE_MEDIA_URL: str = "http://127.0.0.1:8000/media"
UPLOAD_DIRECTORY.mkdir(exist_ok=True)

app = FastAPI()
app.mount(
    "/media",
    StaticFiles(directory=UPLOAD_DIRECTORY),
    name="media",
)


class MediaType(enum.StrEnum):
    image = "image"
    video = "video"


def get_media_type(raw_media_type: str) -> str:

    if raw_media_type.startswith("image/"):
        return MediaType.image
    elif raw_media_type.startswith("video/"):
        return MediaType.video
    raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE)


class MediaItem(BaseModel):
    id: int
    name: str
    description: str
    location: str | None = None
    media_type: str

    @computed_field
    def media_url(self) -> str:
        return f"{BASE_MEDIA_URL}/{self.name}"


class Ad(BaseModel):
    id: int
    company: str
    location: str


class PaginationParams(BaseModel):
    skip: int = Field(0, ge=0)
    limit: int = Field(5, ge=0, le=100)


class UserBase(BaseModel):
    username: str


class UserIn(UserBase):
    password: str
    email: EmailStr
    full_name: str | None = None


class UserOut(UserBase):
    pass


collection: list[MediaItem] = [
    MediaItem(
        id=1,
        name="Item 1",
        description="This is item 1",
        location="loc1",
        media_type=MediaType.image,
    ),
    MediaItem(
        id=2,
        name="Item 2",
        description="This is item 2",
        location="loc2",
        media_type=MediaType.video,
    ),
    MediaItem(
        id=3,
        name="Item 3",
        description="This is item 3",
        location="loc3",
        media_type=MediaType.video,
    ),
    MediaItem(
        id=4,
        name="Item 4",
        description="This is item 4",
        location="loc4",
        media_type=MediaType.image,
    ),
    MediaItem(
        id=5,
        name="Item 5",
        description="This is item 5",
        location="loc5",
        media_type=MediaType.video,
    ),
]

ads: list[Ad] = [
    Ad(id=1, company="Company A", location="loc1"),
    Ad(id=2, company="Company B", location="loc2"),
    Ad(id=3, company="Company C", location="loc3"),
]

users: list[UserIn] = [
    UserIn(
        username="user1",
        password="password1",
        email="user@example.com",
        full_name="User One",
    )
]


@app.post(
    "/items/",
    status_code=status.HTTP_201_CREATED,
)
async def create_item(
    file: Annotated[UploadFile, File()],
    description: Annotated[
        str,
        Form(min_length=10, max_length=100),
    ],
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

    if not file.content_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file has no content type",
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


@app.put("/items/{item_id}")
async def update_item(
    item_id: int,
    updated_item: MediaItem,
    updated_by: Annotated[str | None, Body(min_length=3, examples=["user123"])] = None,
) -> dict:
    for item in collection:
        if item.id == item_id:
            item.name = updated_item.name
            item.description = updated_item.description
            item.media_type = updated_item.media_type
            item.location = updated_item.location
            item_dict = item.model_dump()
            item_dict.update({"updated_by": updated_by})
            return item_dict
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")


@app.get("/items/")
async def get_items(
    pagination: Annotated[PaginationParams, Query()],
) -> list[MediaItem]:
    return collection[pagination.skip : pagination.skip + pagination.limit]


@app.get("/items/{item_id}")
async def get_item(
    item_id: Annotated[int, Path(ge=1, description="The ID of the item to retrieve")],
    response: Response,
) -> MediaItem | dict:
    for item in collection:
        if item.id == item_id:
            response.set_cookie(key="last_viewed_location", value=str(item.location))
            response.headers["X-Item-Name"] = item.name
            return item
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")


@app.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: int) -> Response:
    for item in collection:
        if item.id == item_id:
            collection.remove(item)
            return Response(status_code=status.HTTP_204_NO_CONTENT)
    return Response(status_code=status.HTTP_404_NOT_FOUND)


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


@app.post("/users/", response_model=UserOut)
async def create_user(user: Annotated[UserIn, Body()]) -> UserOut:
    users.append(user)
    user_out = UserOut(username=user.username)
    return user_out


@app.get("/")
async def read_root(
    accept_language: Annotated[str | None, Header()] = None,
) -> dict:
    if accept_language and accept_language.startswith("pl"):
        return {"message": "Witaj, Świecie!"}

    return {"message": "Hello, World!"}
