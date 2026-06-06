import json
import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from utils.chat import generate, generate_stream, generate_roadmap

logger = logging.getLogger(__name__)
router = APIRouter()


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=8000)
    user_id: str = Field(..., min_length=1, max_length=128)
    role: str = "user"


class RoadmapRequest(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=128)
    scenario: str = Field(..., min_length=1, max_length=64)


@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """Standard (non-streaming) chat endpoint."""
    logger.info("Chat request from user %s", request.user_id)
    try:
        reply = generate(request.user_id, request.message)
    except Exception as exc:
        logger.exception("Error generating response")
        raise HTTPException(status_code=500, detail=str(exc))
    return {"user_id": request.user_id, "message": reply}


@router.post("/chat/stream")
async def chat_stream_endpoint(request: ChatRequest):
    """
    Streaming chat endpoint — returns text/event-stream (SSE).

    Events:
      data: {"token": "..."}  — incremental text token
      data: [DONE]            — stream finished
    """
    logger.info("Stream request from user %s", request.user_id)

    def sse_generator():
        try:
            for token in generate_stream(request.user_id, request.message):
                payload = json.dumps({"token": token}, ensure_ascii=False)
                yield f"data: {payload}\n\n"
        except Exception as exc:
            logger.exception("Streaming error")
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        sse_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.post("/roadmap")
async def roadmap_endpoint(request: RoadmapRequest):
    """
    Generate an AI-personalised roadmap for a user's scenario based on
    their conversation history.
    """
    logger.info("Roadmap request: user=%s scenario=%s", request.user_id, request.scenario)
    try:
        raw = generate_roadmap(request.user_id, request.scenario)
        cleaned = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        data = {"steps": [], "raw": raw}
    except Exception as exc:
        logger.exception("Error generating roadmap")
        raise HTTPException(status_code=500, detail=str(exc))
    return {"user_id": request.user_id, "scenario": request.scenario, **data}
