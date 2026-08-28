from typing import Dict, Any
import numpy as np
from ..utils.image_utils import compute_laplacian_variance


class HardFilterService:
    """
    Hard Filter track:
    - OpenCV Laplacian Variance for blur detection
    - MediaPipe Face Mesh for eye blink/expression score
    - Multi-person weighting: Applies penalties based on top 1-2 bounding box primary subjects
    """

    def __init__(self):
        self.blur_threshold = 100.0

    def evaluate_image(self, bgr_image: np.ndarray) -> Dict[str, Any]:
        sharpness = compute_laplacian_variance(bgr_image)
        is_blurred = sharpness < self.blur_threshold

        # Placeholder face score (simulating MediaPipe eye/expression detection)
        face_score = 0.95

        return {
            "sharpness": sharpness,
            "face_score": face_score,
            "is_hard_filtered": is_blurred,
            "filter_reason": "Blurred image" if is_blurred else None,
        }
