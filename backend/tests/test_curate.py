from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_curate_endpoint_structure():
    payload = {
        "groupId": "test_grp_1",
        "images": [
            {"id": "img_1", "filename": "photo_1.jpg"},
            {"id": "img_2", "filename": "photo_2.jpg"},
        ],
    }
    response = client.post("/api/v1/curate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "taskId" in data
    assert data["groupCount"] == 2


def test_feedback_endpoint_structure():
    payload = {
        "groupId": "test_grp_1",
        "winnerImageId": "img_1",
        "loserImageIds": ["img_2"],
        "isUserModified": False,
        "zoomAttention": {
            "x": 45.5,
            "y": 60.2,
            "scale": 2.5,
        },
    }
    response = client.post("/api/v1/feedback", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
