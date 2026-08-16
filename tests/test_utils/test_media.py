import io
import pathlib

import pytest
from fastapi import HTTPException, UploadFile, status

from models import MediaType
from utils.media import get_media_type, upload_file


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("raw_media_type", "expected"),
    [
        ("image/png", MediaType.IMAGE),
        ("video/mp4", MediaType.VIDEO),
    ],
)
async def test_get_media_type_accepts_supported_types(
    raw_media_type: str,
    expected: str,
) -> None:
    assert await get_media_type(raw_media_type) == expected


@pytest.mark.asyncio
@pytest.mark.parametrize("raw_media_type", [None, "application/pdf", "text/plain"])
async def test_get_media_type_rejects_unsupported_types(
    raw_media_type: str | None,
) -> None:
    with pytest.raises(HTTPException) as exc_info:
        await get_media_type(raw_media_type)

    assert exc_info.value.status_code == status.HTTP_415_UNSUPPORTED_MEDIA_TYPE


class FakeUploadFile(UploadFile):
    def __init__(self, chunks: list[bytes]) -> None:
        super().__init__(
            file=io.BytesIO(b"".join(chunks)),
            filename="fake.bin",
            headers=None,
        )


@pytest.mark.asyncio
async def test_upload_file_writes_bytes_and_closes_stream(
    tmp_path: pathlib.Path,
) -> None:
    fake_file = FakeUploadFile([b"hello ", b"world", b""])
    file_path = tmp_path / "uploaded.bin"

    result = await upload_file(fake_file, file_path)

    assert result == file_path
    assert file_path.read_bytes() == b"hello world"
