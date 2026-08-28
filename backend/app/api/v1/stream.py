import asyncio
import json
from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse

router = APIRouter()

# Global in-memory event queue for SSE broadcasting
sse_event_queue: asyncio.Queue = asyncio.Queue()


@router.get("/stream")
async def stream_events(request: Request):
    """
    SSE stream endpoint to push analyzed group results and best pick recommendations.
    """
    async def event_generator():
        while True:
            # Check if client disconnected
            if await request.is_disconnected():
                break

            try:
                # Wait for next event or send heartbeat
                data = await asyncio.wait_for(sse_event_queue.get(), timeout=15.0)
                yield {
                    "event": "message",
                    "data": json.dumps(data),
                }
            except asyncio.TimeoutError:
                # Heartbeat ping
                yield {
                    "event": "ping",
                    "data": json.dumps({"type": "ping"}),
                }

    return EventSourceResponse(event_generator())
