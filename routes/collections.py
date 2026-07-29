from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models import Collection, UserCollection, UserCollectionRole
from schemas import (
    CollectionCreate,
    CollectionRetrieve,
    CollectionRetrieveDetailed,
    MediaRetrieve,
    UserRetrievePrivate,
    UserRetrievePublic,
)
from utils.auth import get_current_user

router = APIRouter(
    prefix="/collections",
    tags=["collections"],
)


@router.get("")
async def get_collections(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[UserRetrievePrivate, Depends(get_current_user)],
) -> list[CollectionRetrieve]:

    stmt = select(Collection).where(
        Collection.id.in_(
            select(UserCollection.collection_id).where(
                UserCollection.user_id == current_user.id
            )
        )
    )
    collections = await db.scalars(stmt)

    return [CollectionRetrieve.model_validate(collection) for collection in collections]


@router.get("/{collection_id}")
async def get_collection(
    collection_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[
        UserRetrievePrivate,
        Depends(get_current_user),
    ],
) -> CollectionRetrieveDetailed:
    stmt = (
        select(Collection)
        .where(
            Collection.id == collection_id,
            Collection.id.in_(
                select(UserCollection.collection_id).where(
                    UserCollection.user_id == current_user.id
                )
            ),
        )
        .options(
            selectinload(Collection.created_by),
            selectinload(Collection.media),
            selectinload(Collection.collection_memberships).selectinload(
                UserCollection.user
            ),
        )
    )
    result = await db.execute(stmt)
    collection = result.scalar_one_or_none()

    if collection is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Collection not found or user does not have access to it.",
        )

    created_by = (
        UserRetrievePublic.model_validate(collection.created_by)
        if collection.created_by
        else None
    )
    members = [
        UserRetrievePublic.model_validate(membership.user)
        for membership in collection.collection_memberships
    ]
    media_items = [MediaRetrieve.model_validate(media) for media in collection.media]

    return CollectionRetrieveDetailed(
        id=collection.id,
        name=collection.name,
        description=collection.description,
        created_at=collection.created_at,
        created_by_id=collection.created_by_id,
        created_by=created_by,
        members=members,
        media=media_items,
    )


@router.post("")
async def create_collection(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[UserRetrievePrivate, Depends(get_current_user)],
    create_collection: Annotated[CollectionCreate, Depends()],
) -> CollectionRetrieve:
    new_collection = Collection(
        name=create_collection.name,
        description=create_collection.description,
        created_by_id=current_user.id,
    )
    db.add(new_collection)
    await db.commit()
    await db.refresh(new_collection)

    # Add the current user as a member of the new collection
    user_collection = UserCollection(
        collection_id=new_collection.id,
        user_id=current_user.id,
        user_role=UserCollectionRole.MODERATOR,
    )
    db.add(user_collection)
    await db.commit()
    await db.refresh(new_collection)

    return CollectionRetrieve.model_validate(new_collection)
