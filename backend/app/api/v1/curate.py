import uuid
from fastapi import APIRouter, BackgroundTasks, HTTPException
from ...models.schemas import CurateGroupRequest, CurateResponse
from ...services.evaluation_pipeline import EvaluationPipelineService
from .stream import sse_event_queue

router = APIRouter()
pipeline = EvaluationPipelineService()


async def process_and_stream(group_req: CurateGroupRequest):
    """Background task to run evaluation pipeline and broadcast via SSE."""
    result = await pipeline.evaluate_group(group_req)
    await sse_event_queue.put({
        "type": "group_analyzed",
        "groupId": result["group_id"],
        "bestImageId": result["best_image_id"],
        "scores": {k: v.dict(by_alias=True) for k, v in result["scores"].items()},
    })


@router.post("/curate", response_model=CurateResponse)
async def curate_group(
    request: CurateGroupRequest,
    background_tasks: BackgroundTasks,
):
    """
    Receives a burst photo group chunk (<10MB) for AI best shot curation.
    """
    if not request.images:
        raise HTTPException(status_code=400, detail="Images list cannot be empty")

    task_id = f"task_{uuid.uuid4().hex[:8]}"
    background_tasks.add_task(process_and_stream, request)

    return CurateResponse(
        taskId=task_id,
        message="Group submitted for curation evaluation.",
        groupCount=len(request.images),
    )
