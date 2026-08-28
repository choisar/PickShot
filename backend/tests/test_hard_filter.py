import numpy as np
import cv2
from app.services.hard_filter import HardFilterService
from app.services.face_mesh import FaceMeshService


def test_hard_filter_blur_detection():
    service = HardFilterService(blur_threshold=50.0)
    
    # Sharp image with sharp checkerboard pattern
    sharp_img = np.zeros((200, 200, 3), dtype=np.uint8)
    sharp_img[::20, :, :] = 255
    sharp_img[:, ::20, :] = 255
    sharp_res = service.evaluate_image(sharp_img)
    assert sharp_res["sharpness"] > 50.0
    assert sharp_res["is_blurred"] is False

    # Heavy Gaussian blurred image
    blurred_img = cv2.GaussianBlur(sharp_img, (35, 35), 0)
    blur_res = service.evaluate_image(blurred_img)
    assert blur_res["sharpness"] < 50.0
    assert blur_res["is_blurred"] is True
    assert blur_res["is_hard_filtered"] is True
    assert "흔들림/블러 감지" in blur_res["filter_reason"]


def test_face_mesh_service_empty_and_dummy():
    face_service = FaceMeshService()
    # Dummy black image with no face
    dummy_img = np.zeros((300, 300, 3), dtype=np.uint8)
    res = face_service.analyze_faces(dummy_img)
    assert res["has_face"] is False
    assert res["num_faces"] == 0
    assert res["is_eyes_closed"] is False
