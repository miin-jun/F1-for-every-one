from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import Settings
from schemas import ChatRequest, ChatResponse
from ai_service import create_chat_answer

app = FastAPI(
    title="F1-for-every-one Model Server",
    description="F1 chatbot model server with OpenAI API.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        Settings.FRONTEND_ORIGIN,
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "model_server",
        "ai_mode": Settings.AI_MODE,
        "stt_mode": Settings.STT_MODE,
        "tts_mode": Settings.TTS_MODE,
    }


@app.post("/ai/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        return await create_chat_answer(request)
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"AI chat error: {str(error)}",
        )
    
@app.post("/ai/chat/debug", response_model=ChatResponse)
async def chat_debug(request: ChatRequest):
    try:
        return await create_chat_answer(request, debug=True)
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"AI chat debug error: {str(error)}",
        )