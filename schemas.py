from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, computed_field

from models import MediaType, ReactionType


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
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=30)
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserRetrievePublic(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class UserRetrievePrivate(UserRetrievePublic):
    email: EmailStr
    is_active: bool
    is_superuser: bool


class ReactionBase(BaseModel):
    type: ReactionType


class ReactionCreate(ReactionBase):
    pass


class ReactionRetrieve(ReactionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user: UserRetrievePublic


class CommentBase(BaseModel):
    content: str = Field(min_length=1, max_length=500)


class CommentCreate(CommentBase):
    pass


class CommentRetrieve(CommentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    author: UserRetrievePublic


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
    def media_url(self) -> str:
        base_url = "http://localhost:8000/static/"
        normalized_path = self.file_path.replace("\\", "/").lstrip("/")
        if normalized_path.startswith("uploads/"):
            normalized_path = normalized_path.removeprefix("uploads/")
        return f"{base_url}{normalized_path}"


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


class CollectionRetrieve(CollectionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class CollectionRetrieveDetailed(CollectionRetrieve):
    created_by_id: int | None
    created_by: UserRetrievePublic | None
    members: list[UserRetrievePublic] = Field(default_factory=list)
    media: list[MediaRetrieve] = Field(default_factory=list)


class CollectionInvitationRetrieve(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    collection_id: int
    token_hash: str
    valid_until: datetime
