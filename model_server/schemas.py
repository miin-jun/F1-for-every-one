from typing import Literal
from pydantic import BaseModel, Field

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class Citation(BaseModel):
    title: str
    source: str | None = None
    chunk_id: str | None = None
    page: int | None = None

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    session_id: str | None = None
    history: list[ChatMessage] = []

class ChatResponse(BaseModel):
    answer: str
    mode: Literal["mock", "openai", "rag", "agent"]
    tool_used: bool = False
    citations: list[Citation] = []
    metadata: dict = {}