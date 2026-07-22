import enum

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class MediaType(enum.Enum):
    image = "image"
    video = "video"


class MediaItem(BaseModel):
    id: int
    name: str
    description: str
    media_type: MediaType


collection: list[MediaItem] = [
    MediaItem(
        id=1, name="Item 1", description="This is item 1", media_type=MediaType.image
    ),
    MediaItem(
        id=2, name="Item 2", description="This is item 2", media_type=MediaType.video
    ),
    MediaItem(
        id=3, name="Item 3", description="This is item 3", media_type=MediaType.video
    ),
    MediaItem(
        id=4, name="Item 4", description="This is item 4", media_type=MediaType.image
    ),
    MediaItem(
        id=5, name="Item 5", description="This is item 5", media_type=MediaType.video
    ),
]


@app.post("/items/")
async def create_item(item: MediaItem) -> MediaItem:
    collection.append(item)
    return item


@app.put("/items/{item_id}")
async def update_item(item_id: int, updated_item: MediaItem) -> dict:
    for item in collection:
        if item.id == item_id:
            item.name = updated_item.name
            item.description = updated_item.description
            item.media_type = updated_item.media_type
            item_dict = item.model_dump()
            item_dict.update({"updated_at": "now"})
            return item_dict
    return {"message": "item not found."}


@app.get("/items/")
async def get_items(skip: int = 0, limit: int = 5) -> list[MediaItem]:
    return collection[skip : skip + limit]


@app.get("/items/{item_id}")
async def get_item(item_id: int) -> MediaItem | dict:
    for item in collection:
        if item.id == item_id:
            return item
    return {"message": "item not found."}


@app.get("/")
async def read_root() -> dict:
    return {"message": "Hello, World!"}
