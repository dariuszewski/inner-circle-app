import pathlib

from fastapi import HTTPException, UploadFile, status

from models import MediaType


def get_media_type(raw_media_type: str | None) -> str:
    if raw_media_type is None:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE)

    if raw_media_type.startswith("image/"):
        return MediaType.IMAGE
    elif raw_media_type.startswith("video/"):
        return MediaType.VIDEO
    else:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE)


async def upload_file(file: UploadFile, file_path: pathlib.Path) -> pathlib.Path:

    try:
        with file_path.open("wb") as destination:
            while chunk := await file.read(1024 * 1024):
                destination.write(chunk)
        return file_path
    finally:
        await file.close()
