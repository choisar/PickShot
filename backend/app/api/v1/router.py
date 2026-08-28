from fastapi import APIRouter
from .curate import router as curate_router
from .stream import router as stream_router
from .feedback import router as feedback_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(curate_router, tags=["Curation"])
api_v1_router.include_router(stream_router, tags=["Streaming"])
api_v1_router.include_router(feedback_router, tags=["Feedback & Dataset"])
