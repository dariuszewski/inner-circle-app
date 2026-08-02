from hashlib import sha256
from secrets import token_urlsafe


def generate_invitation_token() -> tuple[str, str]:
    raw_token = token_urlsafe(32)
    token_hash = sha256(raw_token.encode("utf-8")).hexdigest()
    return raw_token, token_hash


def hash_invitation_token(raw_token: str) -> str:
    return sha256(raw_token.encode("utf-8")).hexdigest()
