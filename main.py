import enum
import json
import pathlib
from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import (
    Body,
    Cookie,
    Depends,
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
from fastapi.encoders import jsonable_encoder
from fastapi.security import OAuth2PasswordBearer
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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


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


class MediaItemUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    location: str | None = None
    media_type: str | None = None
    media_url: str | None = None


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
    disabled: bool | None = None


class UserOut(UserBase):
    pass


def fake_decode_token(token: str) -> UserIn | None:
    user = UserIn(
        username=token + "fakedecoded",
        password="notarealpassword",
        email="user@example.com",
        full_name="John Doe",
    )
    return user


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> UserIn:
    user = fake_decode_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def get_database() -> AsyncIterator[dict]:
    try:
        with open("fake_database.json", encoding="utf-8") as database:
            data = json.load(database)
            yield data
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reading from database: {exc}",
        ) from exc
    finally:
        database.close()


async def get_collection() -> AsyncIterator[list[dict]]:
    try:
        with open("fake_database.json", encoding="utf-8") as database:
            collection = json.load(database)["collections"][0]["media"]
            yield collection
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reading from database: {exc}",
        ) from exc
    finally:
        database.close()


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


@app.get("/token")
async def get_token(token: Annotated[str, Depends(oauth2_scheme)]) -> dict:
    return {"token": token}


@app.get("/users/me", response_model=UserIn)
async def read_users_me(
    current_user: Annotated[UserIn, Depends(get_current_user)],
) -> UserIn:
    return current_user


@app.post(
    "/items/",
    status_code=status.HTTP_201_CREATED,
)
async def create_item(
    file: Annotated[UploadFile, File()],
    database: Annotated[dict, Depends(get_database)],
    collection: Annotated[list[dict], Depends(get_collection)],
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

    collection.append(jsonable_encoder(item))

    database["collections"][0]["media"] = collection
    with open("fake_database.json", "w", encoding="utf-8") as database_file:
        json.dump(database, database_file, indent=4)

    return item


@app.put("/items/{item_id}")
async def update_item(
    item_id: int,
    item_update: MediaItemUpdate,
    collection: Annotated[list[dict], Depends(get_collection)],
    database: Annotated[dict, Depends(get_database)],
) -> MediaItem:
    for index, stored_item_data in enumerate(collection):
        if stored_item_data["id"] == item_id:
            stored_item_model = MediaItem(**stored_item_data)
            update_data = item_update.model_dump(exclude_unset=True)
            updated_item = stored_item_model.model_copy(update=update_data)
            collection[index] = jsonable_encoder(updated_item)
            database["collections"][0]["media"] = collection
            with open("fake_database.json", "w", encoding="utf-8") as database_file:
                json.dump(database, database_file, indent=4)
            return updated_item

    raise HTTPException(status_code=404, detail="Item not found")


@app.get("/items/")
async def get_items(
    pagination: Annotated[PaginationParams, Query()],
    collection: Annotated[list[dict], Depends(get_collection)],
) -> list[MediaItem]:
    return [
        MediaItem(**item)
        for item in collection[pagination.skip : pagination.skip + pagination.limit]
    ]


@app.get("/items/{item_id}")
async def get_item(
    item_id: Annotated[int, Path(ge=1, description="The ID of the item to retrieve")],
    response: Response,
    collection: Annotated[list[dict], Depends(get_collection)],
) -> dict:
    for item in collection:
        if item["id"] == item_id:
            response.set_cookie(key="last_viewed_location", value=str(item["location"]))
            response.headers["X-Item-Name"] = item["name"]
            return item
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")


@app.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: int,
    collection: Annotated[list[dict], Depends(get_collection)],
    database: Annotated[dict, Depends(get_database)],
) -> Response:
    for item in collection:
        if item["id"] == item_id:
            collection.remove(item)
            database["collections"][0]["media"] = collection
            with open("fake_database.json", "w", encoding="utf-8") as database_file:
                json.dump(database, database_file, indent=4)
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
