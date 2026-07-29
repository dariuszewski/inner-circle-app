from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import DateTime, Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
    relationship,
)


class Base(DeclarativeBase):
    pass


class MediaType(StrEnum):
    IMAGE = "image"
    VIDEO = "video"


class ReactionType(StrEnum):
    LIKE = "like"
    LOVE = "love"
    HAHA = "haha"
    WOW = "wow"
    SAD = "sad"
    ANGRY = "angry"


class UserCollectionRole(StrEnum):
    CONTRIBUTOR = "contributor"
    MODERATOR = "moderator"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    username: Mapped[str] = mapped_column(
        String(30),
        unique=True,
        nullable=False,
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
    )
    hashed_password: Mapped[str] = mapped_column(
        String(256),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
    )
    is_active: Mapped[bool] = mapped_column(
        default=True,
        nullable=False,
    )
    is_superuser: Mapped[bool] = mapped_column(
        default=False,
        nullable=False,
    )

    owned_collections: Mapped[list["Collection"]] = relationship(
        back_populates="created_by",
        passive_deletes=True,
    )

    collection_memberships: Mapped[list["UserCollection"]] = relationship(
        back_populates="user",
        passive_deletes=True,
    )

    uploaded_media: Mapped[list["Media"]] = relationship(
        back_populates="uploaded_by",
        passive_deletes=True,
    )
    comments: Mapped[list["Comment"]] = relationship(
        back_populates="author",
        passive_deletes=True,
    )
    reactions: Mapped[list["Reaction"]] = relationship(
        back_populates="user",
        passive_deletes=True,
    )


class Collection(Base):
    __tablename__ = "collections"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
    )

    created_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    created_by: Mapped["User | None"] = relationship(
        back_populates="owned_collections",
    )

    collection_memberships: Mapped[list["UserCollection"]] = relationship(
        back_populates="collection",
        passive_deletes=True,
    )

    media: Mapped[list["Media"]] = relationship(
        back_populates="collection",
        passive_deletes=True,
    )


class UserCollection(Base):
    __tablename__ = "user_collections"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    collection_id: Mapped[int] = mapped_column(
        ForeignKey("collections.id", ondelete="CASCADE"),
        primary_key=True,
    )

    user_role: Mapped[UserCollectionRole] = mapped_column(
        Enum(
            UserCollectionRole,
            name="user_collection_role",
            values_callable=lambda enum_class: [member.value for member in enum_class],
        ),
        nullable=False,
        default=UserCollectionRole.CONTRIBUTOR,
    )

    user: Mapped["User"] = relationship(
        back_populates="collection_memberships",
    )
    collection: Mapped["Collection"] = relationship(
        back_populates="collection_memberships",
    )


class Media(Base):
    __tablename__ = "media"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )
    file_path: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    file_size: Mapped[int | None] = mapped_column(
        nullable=True,
    )
    media_type: Mapped[MediaType] = mapped_column(
        Enum(
            MediaType,
            name="media_type",
            values_callable=lambda enum_class: [member.value for member in enum_class],
        ),
        nullable=False,
    )
    duration: Mapped[int | None] = mapped_column(
        nullable=True,
    )
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
    )

    uploaded_by_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    collection_id: Mapped[int] = mapped_column(
        ForeignKey("collections.id", ondelete="CASCADE"),
        nullable=False,
    )

    uploaded_by: Mapped["User"] = relationship(
        back_populates="uploaded_media",
    )
    collection: Mapped["Collection"] = relationship(
        back_populates="media",
    )
    comments: Mapped[list["Comment"]] = relationship(
        back_populates="media",
        passive_deletes=True,
    )
    reactions: Mapped[list["Reaction"]] = relationship(
        back_populates="media",
        passive_deletes=True,
    )


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )
    content: Mapped[str] = mapped_column(
        String(1000),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
    )

    media_id: Mapped[int] = mapped_column(
        ForeignKey("media.id", ondelete="CASCADE"),
        nullable=False,
    )
    author_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    media: Mapped["Media"] = relationship(
        back_populates="comments",
    )
    author: Mapped["User | None"] = relationship(
        back_populates="comments",
    )


class Reaction(Base):
    __tablename__ = "reactions"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "media_id",
            name="uq_user_media_reaction",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )
    type: Mapped[ReactionType] = mapped_column(
        Enum(
            ReactionType,
            name="reaction_type",
            values_callable=lambda enum_class: [member.value for member in enum_class],
        ),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
    )

    media_id: Mapped[int] = mapped_column(
        ForeignKey("media.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    media: Mapped["Media"] = relationship(
        back_populates="reactions",
    )
    user: Mapped["User"] = relationship(
        back_populates="reactions",
    )
