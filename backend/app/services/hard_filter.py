from typing import Dict, Any
import numpy as np
from ..utils.image_utils import compute_laplacian_variance
from .face_mesh import FaceMeshService


class HardFilterService:
    """
    Hard Filter track:
    - OpenCV Laplacian Variance for blur detection
    - MediaPipe Face Mesh for eye blink/closure and expression quality
    - Multi-person weighting: Applies penalties based on top 1-2 bounding box primary subjects
    """

    def __init__(self, blur_threshold: float = 80.0):
        self.blur_threshold = blur_threshold
        self.face_mesh = FaceMeshService()

    def evaluate_image(self, bgr_image: np.ndarray) -> Dict[str, Any]:
        sharpness = compute_laplacian_variance(bgr_image)
        is_blurred = sharpness < self.blur_threshold

        face_result = self.face_mesh.analyze_faces(bgr_image)
        face_score = face_result["face_score"]
        is_eyes_closed = face_result["is_eyes_closed"]

        # Determine overall hard filter status and reason
        is_filtered = False
        reasons = []

        if is_blurred:
            is_filtered = True
            reasons.append(f"흔들림/블러 감지 (선명도: {sharpness:.1f})")

        if is_eyes_closed:
            is_filtered = True
            reasons.append(face_result.get("filter_reason") or "눈 감음 감지")

        filter_reason = " & ".join(reasons) if is_filtered else None

        return {
            "sharpness": round(float(sharpness), 2),
            "face_score": face_score,
            "has_face": face_result["has_face"],
            "num_faces": face_result["num_faces"],
            "is_eyes_closed": is_eyes_closed,
            "is_blurred": is_blurred,
            "is_hard_filtered": is_filtered,
            "filter_reason": filter_reason,
            "face_details": face_result.get("faces", []),
        }
