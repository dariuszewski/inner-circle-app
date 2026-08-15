import pathlib
from typing import Annotated
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from pydantic import WithJsonSchema
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from config import settings
from database import get_db
from models import (
    Collection,
    Comment,
    Media,
    Reaction,
    User,
    UserCollection,
)
from schemas import MediaRetrieve, MediaRetrieveDetailed, ReactionCreate
from utils.auth import get_current_user
from utils.media import get_media_type, upload_file

router = APIRouter(
    prefix="/media",
    tags=["media"],
)

UPLOAD_DIRECTORY: pathlib.Path = pathlib.Path(settings.upload_directory)


@router.get("/{media_id}")
async def get_media(
    media_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> MediaRetrieveDetailed:
    stmt = (
        select(Media)
        .options(
            selectinload(Media.uploaded_by),
            selectinload(Media.comments).selectinload(Comment.author),
            selectinload(Media.reactions).selectinload(Reaction.user),
        )
        .where(
            Media.id == media_id,
            Media.collection_id.in_(
                select(UserCollection.collection_id).where(
                    UserCollection.user_id == current_user.id
                )
            ),
        )
    )

    media = await db.scalar(stmt)

    if media is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found or access denied.",
        )
    return MediaRetrieveDetailed.model_validate(media)


@router.post("", status_code=status.HTTP_201_CREATED)
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
        media_type = await get_media_type(file.content_type)

        extension = pathlib.Path(file.filename or "").suffix.lower()
        file_name = f"{uuid4()}{extension}"

        file_path = UPLOAD_DIRECTORY / file_name

        await upload_file(file, file_path)

        media_obj = Media(
            file_path=file_name,
            media_type=media_type,
            uploaded_by_id=current_user.id,
            collection_id=collection_id,
        )

        db.add(media_obj)
        await db.commit()
        await db.refresh(media_obj, attribute_names=["uploaded_by"])

        media_objs.append(media_obj)

    response = [MediaRetrieve.model_validate(media_obj) for media_obj in media_objs]

    return response


@router.delete("/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_media(
    media_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    stmt = (
        select(Media)
        .join(
            UserCollection,
            UserCollection.collection_id == Media.collection_id,
        )
        .where(
            Media.id == media_id,
            UserCollection.user_id == current_user.id,
        )
    )

    media = await db.scalar(stmt)

    if media is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found or access denied.",
        )

    stored_path = pathlib.Path(media.file_path)
    if not stored_path.is_absolute() and (
        len(stored_path.parts) == 0 or stored_path.parts[0] != UPLOAD_DIRECTORY.name
    ):
        file_path = UPLOAD_DIRECTORY / stored_path
    else:
        file_path = stored_path

    await db.delete(media)
    await db.commit()

    file_path.unlink(missing_ok=True)


@router.post("/comment/{media_id}", status_code=status.HTTP_201_CREATED)
async def comment_media(
    media_id: int,
    comment: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    stmt = (
        select(Media)
        .join(
            UserCollection,
            UserCollection.collection_id == Media.collection_id,
        )
        .where(
            Media.id == media_id,
            UserCollection.user_id == current_user.id,
        )
    )

    media = await db.scalar(stmt)

    if media is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found or access denied.",
        )

    comment_obj = Comment(
        media_id=media_id,
        author_id=current_user.id,
        content=comment,
    )

    db.add(comment_obj)
    await db.commit()


@router.post("/react/{media_id}", status_code=status.HTTP_201_CREATED)
async def react_to_media(
    media_id: int,
    reaction_data: Annotated[
        ReactionCreate,
        Query(description="The type of reaction to add"),
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    stmt = (
        select(Media)
        .join(
            UserCollection,
            UserCollection.collection_id == Media.collection_id,
        )
        .where(
            Media.id == media_id,
            UserCollection.user_id == current_user.id,
        )
    )

    media = await db.scalar(stmt)

    if media is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found or access denied.",
        )

    reaction_obj = Reaction(
        media_id=media_id,
        user_id=current_user.id,
        type=reaction_data.type,
    )

    db.add(reaction_obj)
    await db.commit()
