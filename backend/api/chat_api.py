from fastapi import APIRouter
from pydantic import BaseModel
from utils.chat import generate


router = APIRouter()
class ChatRequest(BaseModel):
    message: str
    user_id: str
    role: str

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    print(f"Received message from user {request.user_id}: {request.message}")
    response_data = generate(request.user_id, request.message)
    # response_data is a dict with 'nextQuestion' and 'previewForm'
    
    return {
        "user_id": request.user_id,
        "message": response_data
    }