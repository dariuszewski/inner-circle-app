from enum import StrEnum


class MediaSort(StrEnum):
    UPLOADED_AT_DESC = "-uploaded_at"
    UPLOADED_AT_ASC = "uploaded_at"
    POPULARITY_DESC = "-popularity_score"
    POPULARITY_ASC = "popularity_score"
