import pytest
from fastapi.testclient import TestClient

from main import app


@pytest.fixture
def sync_client() -> TestClient:
    """Fixture to provide a TestClient instance"""
    return TestClient(app)


def test_root_endpoint(sync_client: TestClient) -> None:
    """Test that the / endpoint is working"""
    response = sync_client.get("/")
    assert response.status_code == 200
