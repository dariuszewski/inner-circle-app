from datetime import datetime
from math import ceil
from typing import Generic, TypeVar

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    HttpUrl,
    computed_field,
    model_validator,
)

from config import settings
from models import MediaType, ReactionType, UserRole

T = TypeVar("T")


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class LogoutRequest(RefreshTokenRequest):
    all_sessions: bool = False


class TokenData(BaseModel):
    username: str | None = None


class UserBase(BaseModel):
    username: str = Field(min_length=3, max_length=30)


class UserCreate(UserBase):
    email: EmailStr | None = None
    password: str = Field(min_length=8, max_length=128)
    password2: str = Field(min_length=8, max_length=128)

    @model_validator(mode="after")
    def passwords_match(self) -> "UserCreate":
        if self.password != self.password2:
            raise ValueError("Passwords do not match.")
        return self


class UserUpdateEmail(BaseModel):
    email: EmailStr


class UserRetrievePublic(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    profile_image: str | None = Field(default=None, exclude=True)

    @computed_field
    def profile_image_url(self) -> HttpUrl | None:
        if self.profile_image:
            base_url = settings.base_url
            endpoint = "/api/users/profile-image"
            blob = self.profile_image
            return HttpUrl(f"{base_url}{endpoint}/{blob}")
        else:
            return None


class UserRetrievePrivate(UserRetrievePublic):
    email: EmailStr
    is_verified: bool
    user_role: UserRole


class VerificationRequestResponse(BaseModel):
    detail: str
    verification_link: str | None = None


class ReactionBase(BaseModel):
    type: ReactionType


class ReactionCreate(ReactionBase):
    pass


class ReactionRetrieve(ReactionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user: UserRetrievePublic


class CommentBase(BaseModel):
    content: str = Field(min_length=1, max_length=1000)


class CommentCreate(CommentBase):
    pass


class CommentRetrieve(CommentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    author: UserRetrievePublic | None


class MediaBase(BaseModel):
    file_path: str
    media_type: MediaType


class MediaRetrieve(MediaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    collection_id: int
    uploaded_at: datetime
    uploaded_by: UserRetrievePublic | None

    @computed_field
    def media_url(self) -> HttpUrl:
        base_url = settings.base_url
        endpoint = "/api/media/media-object"
        collection_id = self.collection_id
        blob = self.file_path
        return HttpUrl(f"{base_url}{endpoint}/{collection_id}/{blob}")


class MediaRetrieveDetailed(MediaRetrieve):
    comments: list["CommentRetrieve"] = Field(default_factory=list)
    reactions: list["ReactionRetrieve"] = Field(default_factory=list)


class CollectionBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)


class CollectionCreate(CollectionBase):
    pass


class CollectionUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    cover_image_id: int | None = Field(
        default=None, description="ID of the cover image media"
    )


class CollectionRetrieve(CollectionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    cover_image: MediaRetrieve | None = None


class PaginatedResponse(BaseModel, Generic[T]):  # noqa
    total_items: int
    page: int
    per_page: int
    total_pages: int
    items: list[T]

    @classmethod
    def from_items(
        cls,
        items: list[T],
        *,  # next parameters must be specified as keyword arguments
        page: int,
        per_page: int,
    ) -> "PaginatedResponse[T]":
        total_items = len(items)
        total_pages = ceil(total_items / per_page) if total_items else 0
        start_index = (page - 1) * per_page
        end_index = start_index + per_page

        paginated_items = list(items[start_index:end_index])

        return cls(
            total_items=total_items,
            page=page,
            per_page=per_page,
            total_pages=total_pages,
            items=paginated_items,
        )


class CollectionRetrieveDetailed(CollectionRetrieve):
    created_by_id: int | None
    created_by: UserRetrievePublic | None
    members_count: int
    members: list[UserRetrievePublic] = Field(default_factory=list)
    total_items: int
    page: int
    per_page: int
    total_pages: int
    media: list[MediaRetrieve] = Field(default_factory=list)


class CollectionInvitationRetrieve(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    collection_id: int
    token_hash: str
    valid_until: datetime
