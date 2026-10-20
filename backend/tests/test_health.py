from fastapi.testclient import TestClient


def test_health_check_returns_200_and_status_ok(client: TestClient) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_nonexistent_route_returns_404(client: TestClient) -> None:
    response = client.get("/api/no-existe")
    assert response.status_code == 404
