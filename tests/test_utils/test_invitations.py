from utils.invitations import generate_invitation_token, hash_invitation_token


def test_generate_invitation_token_returns_raw_and_hash() -> None:
    """A generated token should include both the raw value and its hash."""
    raw_token, token_hash = generate_invitation_token()
    assert token_hash == hash_invitation_token(raw_token)
