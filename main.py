import enum
from typing import Annotated

from fastapi import Body, Cookie, FastAPI, Path, Query, Response
from pydantic import BaseModel, Field, HttpUrl

app = FastAPI()


class MediaType(enum.Enum):
    image = "image"
    video = "video"


class MediaItem(BaseModel):
    id: int
    name: str
    description: str
    location: str | None = None
    media_type: MediaType
    media_url: HttpUrl | None = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "id": 1,
                    "name": "Item 1",
                    "description": "This is item 1",
                    "media_type": "image",
                    "media_url": "https://example.com/image1.jpg",
                }
            ]
        }
    }


class Ad(BaseModel):
    id: int
    company: str
    location: str


class PaginationParams(BaseModel):
    skip: int = Field(0, ge=0)
    limit: int = Field(5, ge=0, le=100)


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


@app.post("/items/")
async def create_item(
    item: Annotated[
        MediaItem,
        Body(
            openapi_examples={
                "normal": {
                    "summary": "A normal example",
                    "description": "A **normal** example of a media item.",
                    "value": {
                        "id": 6,
                        "name": "Item 6",
                        "description": "This is item 6",
                        "media_type": "image",
                        "media_url": "https://example.com/image6.jpg",
                    },
                },
                "error": {
                    "summary": "An error example",
                    "description": "An **error** example of a media item.",
                    "value": {
                        "id": 7,
                        "name": "",
                        "description": "This is item 7",
                        "media_type": "not a valid type",
                        "media_url": "https://example.com/video7.mp4",
                    },
                },
            }
        ),
    ],
) -> MediaItem:
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
            item_dict = item.model_dump()
            item_dict.update({"updated_by": updated_by})
            return item_dict
    return {"message": "item not found."}


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
    return {"message": "item not found."}


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
async def read_root() -> dict:
    return {"message": "Hello, World!"}
