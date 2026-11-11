from enum import StrEnum


class MediaSort(StrEnum):
    UPLOADED_AT_DESC = "-uploaded_at"
    UPLOADED_AT_ASC = "uploaded_at"
    POPULARITY_DESC = "-popularity_score"
    POPULARITY_ASC = "popularity_score"


class CollectionSort(StrEnum):
    CREATED_AT_DESC = "-created_at"
    CREATED_AT_ASC = "created_at"
    LAST_ACTIVITY_DESC = "-last_activity"
    LAST_ACTIVITY_ASC = "last_activity"
    NUMBER_ITEMS_DESC = "-number_items"
    NUMBER_ITEMS_ASC = "number_items"
    NUMBER_MEMBERS_DESC = "-number_members"
    NUMBER_MEMBERS_ASC = "number_members"
    NAME_DESC = "-name"
    NAME_ASC = "name"
