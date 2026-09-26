import pathlib
from typing import Annotated
from uuid import uuid4

from aiobotocore.client import AioBaseClient
from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Response,
    UploadFile,
    status,
)
from pydantic import WithJsonSchema
from sqlalchemy import func, select
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
from schemas import CommentCreate, MediaRetrieve, MediaRetrieveDetailed, ReactionCreate
from storage import get_storage
from utils.auth import get_current_user
from utils.media import get_media_type, get_upload_file_size

router = APIRouter(
    prefix="/media",
    tags=["media"],
)


@router.get("/media-object/{collection_id:int}/{filename:str}")
async def get_media_object(
    collection_id: int,
    filename: str,
    current_user: Annotated[User, Depends(get_current_user)],
    s3: Annotated[AioBaseClient, Depends(get_storage)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:

    print(current_user)

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
            detail="Collection not found or access denied.",
        )

    try:
        response = await s3.get_object(
            Bucket=settings.storage_bucket_collections,
            Key=f"{collection_id}/{filename}",
        )
    except s3.exceptions.NoSuchKey as e:
        raise HTTPException(
            status_code=404,
            detail="Media not found",
        ) from e

    content = await response["Body"].read()

    return Response(
        content=content,
        media_type=response.get(
            "ContentType",
            "application/octet-stream",
        ),
    )


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
            status_code=status.HTTP_400_BAD_REQUEST,
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
    s3: Annotated[AioBaseClient, Depends(get_storage)],
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

    file_sizes = []
    for file in files:
        file_size = file.size
        if file_size is None:
            file_size = await get_upload_file_size(file)
        file_sizes.append(file_size)

    oversized_file = next(
        (size for size in file_sizes if size > settings.max_upload_size_bytes),
        None,
    )
    if oversized_file is not None:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=(
                f"Each file must be no larger than "
                f"{settings.max_upload_size_bytes} bytes."
            ),
        )

    current_storage: int = await db.scalar(
        select(func.coalesce(func.sum(Media.file_size), 0)).where(
            Media.uploaded_by_id == current_user.id
        )
    )
    if current_storage is None:
        current_storage = 0
    requested_storage = sum(file_sizes) or 0
    if current_storage + requested_storage > settings.max_data_storage_per_user_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=(
                "The upload would exceed your maximum data storage limit of "
                f"{settings.max_data_storage_per_user_bytes} bytes."
            ),
        )

    media_objs = []
    for file, file_size in zip(files, file_sizes, strict=True):
        media_type = await get_media_type(file.content_type)

        extension = pathlib.Path(file.filename or "").suffix.lower()
        file_name = f"{uuid4()}{extension}"

        try:
            await s3.put_object(
                Bucket=settings.storage_bucket_collections,
                Key=f"{collection_id}/{file_name}",
                Body=await file.read(),
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload file to storage: {str(e)}",
            ) from e

        media_obj = Media(
            file_path=file_name,
            file_size=file_size,
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
    s3: Annotated[AioBaseClient, Depends(get_storage)],
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
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Media not found or access denied.",
        )

    try:
        await s3.delete_object(
            Bucket=settings.storage_bucket_collections,
            Key=f"{media.collection_id}/{media.file_path}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file from storage: {str(e)}",
        ) from e

    await db.delete(media)
    await db.commit()


@router.post("/comment/{media_id}", status_code=status.HTTP_201_CREATED)
async def comment_media(
    media_id: int,
    comment_data: CommentCreate,
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
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Media not found or access denied.",
        )

    comment_obj = Comment(
        media_id=media_id,
        author_id=current_user.id,
        content=comment_data.content,
    )

    db.add(comment_obj)
    await db.commit()


@router.delete("/comment/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    stmt = (
        select(Comment)
        .join(
            Media,
            Media.id == Comment.media_id,
        )
        .join(
            UserCollection,
            UserCollection.collection_id == Media.collection_id,
        )
        .where(
            Comment.id == comment_id,
            UserCollection.user_id == current_user.id,
        )
    )

    comment = await db.scalar(stmt)

    if comment is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Comment not found or access denied.",
        )

    await db.delete(comment)
    await db.commit()


@router.post("/react/{media_id}", status_code=status.HTTP_201_CREATED)
async def react_to_media(
    media_id: int,
    reaction_data: ReactionCreate,
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
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Media not found or access denied.",
        )

    reaction_obj = Reaction(
        media_id=media_id,
        user_id=current_user.id,
        type=reaction_data.type,
    )

    db.add(reaction_obj)
    await db.commit()


@router.delete("/react/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_reaction_from_media(
    media_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    stmt = (
        select(Reaction)
        .join(
            Media,
            Media.id == Reaction.media_id,
        )
        .join(
            UserCollection,
            UserCollection.collection_id == Media.collection_id,
        )
        .where(
            Reaction.media_id == media_id,
            Reaction.user_id == current_user.id,
            UserCollection.user_id == current_user.id,
        )
    )

    reaction = await db.scalar(stmt)

    if reaction is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reaction not found or access denied.",
        )

    await db.delete(reaction)
    await db.commit()
