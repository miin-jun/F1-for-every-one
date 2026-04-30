import os
from dotenv import load_dotenv
load_dotenv()

class Settings:
    AI_MODE: str = os.getenv("AI_MODE", "agent")
    OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4.1-nano-2025-04-14")

    STT_MODE: str = os.getenv("STT_MODE", "mock")
    TTS_MODE: str = os.getenv("TTS_MODE", "mock")
    OPENAI_STT_MODEL: str = os.getenv("OPENAI_STT_MODEL", "mock")
    OPENAI_TTS_MODEL: str = os.getenv("OPENAI_TTS_MODEL", "mock")
    OPENAI_TTS_VOICE: str = os.getenv("OPENAI_TTS_VOICE", "mock")

    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

settings = Settings()