from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models import Collection, CollectionInvitation, UserCollection, UserCollectionRole
from schemas import (
    CollectionCreate,
    CollectionRetrieve,
    CollectionRetrieveDetailed,
    MediaRetrieve,
    UserRetrievePrivate,
    UserRetrievePublic,
)
from utils.auth import get_current_user
from utils.invitations import generate_invitation_token, hash_invitation_token

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
            detail="Collection not found or access denied.",
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


@router.post("", status_code=status.HTTP_201_CREATED)
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


@router.post("/invitation/{collection_id}", status_code=status.HTTP_201_CREATED)
async def post_create_invitation(
    collection_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[UserRetrievePrivate, Depends(get_current_user)],
) -> dict[str, str]:

    stmt = select(UserCollection).where(
        UserCollection.collection_id == collection_id,
        UserCollection.user_id == current_user.id,
    )
    result = await db.execute(stmt)
    user_collection = result.scalar_one_or_none()

    if user_collection is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Collection not found or access denied.",
        )

    raw_token, token_hash = generate_invitation_token()

    new_invitation = CollectionInvitation(
        collection_id=collection_id,
        token_hash=token_hash,
    )
    db.add(new_invitation)
    await db.commit()
    await db.refresh(new_invitation)

    return {"invitation_token": raw_token}


@router.put("/accept-invitation/{token}", status_code=status.HTTP_200_OK)
async def accept_invitation(
    token: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[UserRetrievePrivate, Depends(get_current_user)],
) -> dict[str, str]:

    token_hash = hash_invitation_token(token)

    stmt = select(CollectionInvitation).where(
        CollectionInvitation.token_hash == token_hash,
        CollectionInvitation.valid_until > datetime.now(UTC),
    )
    result = await db.execute(stmt)
    invitation = result.scalar_one_or_none()

    if invitation is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired invitation token.",
        )

    user_collection = UserCollection(
        collection_id=invitation.collection_id,
        user_id=current_user.id,
        user_role=UserCollectionRole.CONTRIBUTOR,
    )
    db.add(user_collection)

    await db.commit()
    await db.refresh(user_collection)

    return {"message": "Invitation accepted successfully."}
