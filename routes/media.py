import pathlib
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import WithJsonSchema
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Collection, Media, User, UserCollection
from schemas import MediaRetrieve
from utils.auth import get_current_user
from utils.media import get_media_type, upload_file

router = APIRouter(
    prefix="/collections/{collection_id:int}/media",
    tags=["media"],
)

UPLOAD_DIRECTORY: pathlib.Path = pathlib.Path("uploads")
UPLOAD_DIRECTORY.mkdir(exist_ok=True)


@router.post("")
async def upload_media(
    collection_id: int,
    files: Annotated[
        list[
            Annotated[
                UploadFile,
                WithJsonSchema(
                    {
                        "type": "string",
                        "format": "binary",
                    }
                ),
            ]
        ],
        File(description="Select one or more files"),
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[MediaRetrieve]:
    # check if the user has access to the collection
    stmt = select(Collection).where(
        Collection.id == collection_id,
        Collection.id.in_(
            select(UserCollection.collection_id).where(
                UserCollection.user_id == current_user.id
            )
        ),
    )
    collection = await db.scalar(stmt)

    if collection is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Collection not found or user does not have access to it",
        )

    media_objs = []
    for file in files:
        filename = pathlib.Path(file.filename).name  # type: ignore[arg-type]
        file_path = UPLOAD_DIRECTORY / filename
        await upload_file(file, file_path)

        media_obj = Media(
            file_name=file.filename,
            media_type=get_media_type(file.content_type),
            uploaded_by_id=current_user.id,
            collection_id=collection_id,
        )
        db.add(media_obj)
        await db.commit()
        await db.refresh(media_obj)
        media_objs.append(media_obj)

    response_model = [
        MediaRetrieve.model_validate(media_obj) for media_obj in media_objs
    ]

    return response_model
