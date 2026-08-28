from fastapi import APIRouter
from ...models.schemas import FeedbackRequest, FeedbackResponse

router = APIRouter()


@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(request: FeedbackRequest):
    """
    Saves user confirmation choices (Winner vs Losers) and zoom attention coordinates
    into the database for continuous pairwise model training.
    """
    # Log feedback & zoom attention details
    print(f"[Feedback Received] Group: {request.group_id}")
    print(f"  - Winner Image: {request.winner_image_id}")
    print(f"  - Loser Images: {request.loser_image_ids}")
    print(f"  - User Modified AI Pick: {request.is_user_modified}")
    if request.zoom_attention:
        print(f"  - Zoom Attention Hint: x={request.zoom_attention.x}, y={request.zoom_attention.y}, scale={request.zoom_attention.scale}")

    # (In production, write directly to PostgreSQL / Supabase)

    return FeedbackResponse(
        success=True,
        message="Feedback and pairwise dataset entry saved successfully.",
    )
