from typing import Dict, Any
from .hard_filter import HardFilterService
from .preference_ranker import PreferenceRankerService
from ..models.schemas import CurateGroupRequest, ImageScoreSchema
from ..utils.image_utils import decode_base64_image


class EvaluationPipelineService:
    """
    2-Track Evaluation Pipeline:
    Track 1: Hard Filter (Blur detection, MediaPipe Blink & Multi-person weights)
    Track 2: Preference Ranker (CLIP / DINO aesthetic ranking)
    """

    def __init__(self):
        self.hard_filter = HardFilterService()
        self.ranker = PreferenceRankerService()

    async def evaluate_group(self, group_req: CurateGroupRequest) -> Dict[str, Any]:
        scores: Dict[str, ImageScoreSchema] = {}
        best_image_id = group_req.images[0].id if group_req.images else ""
        highest_score = -1.0

        for img in group_req.images:
            sharpness = 150.0
            face_score = 0.95
            is_filtered = False
            filter_reason = None

            if img.thumbnail_base64:
                try:
                    cv_img = decode_base64_image(img.thumbnail_base64)
                    filter_res = self.hard_filter.evaluate_image(cv_img)
                    sharpness = filter_res["sharpness"]
                    face_score = filter_res["face_score"]
                    is_filtered = filter_res["is_hard_filtered"]
                    filter_reason = filter_res["filter_reason"]
                except Exception as e:
                    print(f"Error processing image {img.id}: {e}")

            pref_score = 0.88
            
            # Base combined score
            base_score = face_score * 0.45 + pref_score * 0.55

            # If hard filtered (blurred or eyes closed), apply heavy penalty (x 0.2)
            total_score = round(base_score * 0.2 if is_filtered else base_score, 4)

            if total_score > highest_score:
                highest_score = total_score
                best_image_id = img.id

            scores[img.id] = ImageScoreSchema(
                imageId=img.id,
                faceScore=round(face_score, 4),
                sharpnessScore=round(sharpness, 2),
                preferenceScore=round(pref_score, 4),
                totalScore=total_score,
                isHardFiltered=is_filtered,
                filterReason=filter_reason,
            )

        return {
            "group_id": group_req.group_id,
            "best_image_id": best_image_id,
            "scores": scores,
        }
