import os
import urllib.request
from typing import Dict, Any, List
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task"
MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "assets", "face_landmarker.task")


class FaceMeshService:
    """
    MediaPipe Face Mesh (FaceLandmarker) service for:
    - Eye blink detection using Blendshapes & Eye Aspect Ratio
    - Multi-person bounding box area ranking and primary subject weighting
    - Expression & eye openness scoring
    """

    def __init__(self):
        self._ensure_model_downloaded()
        self.detector = None
        self._init_detector()

    def _ensure_model_downloaded(self):
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        if not os.path.exists(MODEL_PATH) or os.path.getsize(MODEL_PATH) < 1000000:
            print(f"Downloading MediaPipe FaceLandmarker model to {MODEL_PATH}...")
            urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
            print("MediaPipe FaceLandmarker model download complete.")

    def _init_detector(self):
        try:
            base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
            options = vision.FaceLandmarkerOptions(
                base_options=base_options,
                output_face_blendshapes=True,
                output_facial_transformation_matrixes=True,
                num_faces=8,
                min_face_detection_confidence=0.4,
                min_face_presence_confidence=0.4,
                min_tracking_confidence=0.4,
            )
            self.detector = vision.FaceLandmarker.create_from_options(options)
        except Exception as e:
            print(f"Warning: Failed to initialize MediaPipe FaceLandmarker: {e}")
            self.detector = None

    def analyze_faces(self, bgr_image: np.ndarray) -> Dict[str, Any]:
        """
        Analyzes faces in the image for eye blink/closure and overall face quality.
        Returns face_score, is_eyes_closed, num_faces, and details.
        """
        if self.detector is None or bgr_image is None or bgr_image.size == 0:
            return {
                "has_face": False,
                "num_faces": 0,
                "face_score": 0.85,
                "is_eyes_closed": False,
                "filter_reason": None,
                "faces": [],
            }

        try:
            rgb_image = np.ascontiguousarray(bgr_image[:, :, ::-1])
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)
            result = self.detector.detect(mp_image)

            num_faces = len(result.face_landmarks) if result.face_landmarks else 0
            if num_faces == 0:
                # No face detected (landscape, scenery, or distant photo)
                return {
                    "has_face": False,
                    "num_faces": 0,
                    "face_score": 0.85,
                    "is_eyes_closed": False,
                    "filter_reason": None,
                    "faces": [],
                }

            face_details = []

            for i in range(num_faces):
                landmarks = result.face_landmarks[i]
                # Calculate bounding box area in normalized coordinates
                xs = [lm.x for lm in landmarks]
                ys = [lm.y for lm in landmarks]
                min_x, max_x = min(xs), max(xs)
                min_y, max_y = min(ys), max(ys)
                bbox_area = max(0.0, (max_x - min_x) * (max_y - min_y))

                # Extract blendshapes
                blink_left = 0.0
                blink_right = 0.0
                if result.face_blendshapes and i < len(result.face_blendshapes):
                    blendshape_map = {b.category_name: b.score for b in result.face_blendshapes[i]}
                    blink_left = blendshape_map.get("eyeBlinkLeft", 0.0)
                    blink_right = blendshape_map.get("eyeBlinkRight", 0.0)

                avg_blink = (blink_left + blink_right) / 2.0
                is_closed = blink_left > 0.55 and blink_right > 0.55 or avg_blink > 0.60
                eye_open_score = max(0.0, 1.0 - avg_blink)

                face_details.append({
                    "index": i,
                    "bbox_area": bbox_area,
                    "blink_left": blink_left,
                    "blink_right": blink_right,
                    "is_eyes_closed": is_closed,
                    "eye_open_score": eye_open_score,
                })

            # Sort faces by bounding box area (largest face = primary subject)
            face_details.sort(key=lambda f: f["bbox_area"], reverse=True)

            # Assign multi-person weights: Primary face receives top priority
            if num_faces == 1:
                weights = [1.0]
            elif num_faces == 2:
                weights = [0.7, 0.3]
            else:
                remaining_weight = 0.15 / (num_faces - 2) if num_faces > 2 else 0.0
                weights = [0.6, 0.25] + [remaining_weight] * (num_faces - 2)

            weighted_face_score = sum(f["eye_open_score"] * w for f, w in zip(face_details, weights))
            
            # If primary face has closed eyes, trigger hard filter
            primary_face = face_details[0]
            is_primary_closed = primary_face["is_eyes_closed"]
            any_closed = any(f["is_eyes_closed"] for f in face_details[:2])

            filter_reason = None
            if is_primary_closed:
                filter_reason = "눈 감음 감지 (주요 인물)"
            elif any_closed:
                filter_reason = "눈 감음 감지 (동반 인물)"

            return {
                "has_face": True,
                "num_faces": num_faces,
                "face_score": round(float(weighted_face_score), 4),
                "is_eyes_closed": is_primary_closed or (num_faces == 1 and any_closed),
                "filter_reason": filter_reason,
                "faces": face_details,
            }

        except Exception as e:
            print(f"Error during face mesh detection: {e}")
            return {
                "has_face": False,
                "num_faces": 0,
                "face_score": 0.85,
                "is_eyes_closed": False,
                "filter_reason": None,
                "faces": [],
            }
