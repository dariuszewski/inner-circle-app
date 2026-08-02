import pytest
from fastapi.testclient import TestClient

from main import app


@pytest.fixture
def client() -> TestClient:
    """Fixture to provide a TestClient instance"""
    return TestClient(app)


def test_root_endpoint(client: TestClient) -> None:
    """Test that the / endpoint is working"""
    response = client.get("/")
    assert response.status_code == 200
