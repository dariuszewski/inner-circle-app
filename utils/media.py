from fastapi import HTTPException, UploadFile, status

from models import MediaType


async def get_upload_file_size(file: UploadFile) -> int:
    size = 0
    try:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
    finally:
        await file.seek(0)
    return size


async def get_media_type(raw_media_type: str | None) -> str:
    if raw_media_type is None:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE)

    if raw_media_type.startswith("image/"):
        return MediaType.IMAGE
    elif raw_media_type.startswith("video/"):
        return MediaType.VIDEO
    else:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE)
