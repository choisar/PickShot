from typing import List, Optional, Dict
from pydantic import BaseModel, Field


class CurateImageItem(BaseModel):
    id: str
    filename: str
    thumbnail_base64: Optional[str] = Field(default=None, alias="thumbnailBase64")


class CurateGroupRequest(BaseModel):
    group_id: str = Field(..., alias="groupId")
    images: List[CurateImageItem]

    class Config:
        populate_by_name = True


class ImageScoreSchema(BaseModel):
    image_id: str = Field(..., alias="imageId")
    face_score: float = Field(default=1.0, alias="faceScore")
    sharpness_score: float = Field(default=1.0, alias="sharpnessScore")
    preference_score: float = Field(default=1.0, alias="preferenceScore")
    total_score: float = Field(default=1.0, alias="totalScore")
    is_hard_filtered: bool = Field(default=False, alias="isHardFiltered")
    filter_reason: Optional[str] = Field(default=None, alias="filterReason")

    class Config:
        populate_by_name = True


class CurateResponse(BaseModel):
    task_id: str = Field(..., alias="taskId")
    message: str
    group_count: int = Field(..., alias="groupCount")

    class Config:
        populate_by_name = True


class ZoomAttentionSchema(BaseModel):
    x: float
    y: float
    scale: float


class FeedbackRequest(BaseModel):
    group_id: str = Field(..., alias="groupId")
    winner_image_id: str = Field(..., alias="winnerImageId")
    loser_image_ids: List[str] = Field(default_factory=list, alias="loserImageIds")
    is_user_modified: bool = Field(default=False, alias="isUserModified")
    zoom_attention: Optional[ZoomAttentionSchema] = Field(default=None, alias="zoomAttention")

    class Config:
        populate_by_name = True


class FeedbackResponse(BaseModel):
    success: bool
    message: str
