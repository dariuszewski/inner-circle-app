from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str


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


class MediaBase(BaseModel):
    filename: str
    filetype: str
    url: str


class MediaRetrieve(MediaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    user_id: int
    collection_id: int | None = None


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
