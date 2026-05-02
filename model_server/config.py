import sys
from pathlib import Path

current_file = Path(__file__).resolve()
model_server_dir = current_file.parent.parent.parent  # rag -> src -> model_server
sys.path.insert(0, str(model_server_dir))

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent

class Settings:
    AI_MODE: str = os.getenv("AI_MODE", "agent")
    OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4.1-nano-2025-04-14")

    VECTOR_DIR: str = os.getenv(
        "VECTOR_DIR",
        str(BASE_DIR / "vectorstore"),
    )

    # 리랭커 설정 추가 🆕
    USE_RERANKER: bool = os.getenv("USE_RERANKER", "true").lower() == "true"
    RERANKER_MODEL: str = os.getenv(
        "RERANKER_MODEL",
        "BAAI/bge-reranker-v2-m3"  # 평가 후 가장 좋은 모델로 변경 예정
    )

    VECTOR_COLLECTION_NAME: str = os.getenv(
        "VECTOR_COLLECTION_NAME",
        "f1_rules_e5",
    )

    USE_HYBRID_SEARCH: bool = os.getenv("USE_HYBRID_SEARCH", "true").lower() == "true"
    HYBRID_DENSE_K: int = int(os.getenv("HYBRID_DENSE_K", "20"))
    HYBRID_KEYWORD_K: int = int(os.getenv("HYBRID_KEYWORD_K", "20"))
    HYBRID_RRF_K: int = int(os.getenv("HYBRID_RRF_K", "60"))

    STT_MODE: str = os.getenv("STT_MODE", "mock")
    TTS_MODE: str = os.getenv("TTS_MODE", "mock")
    OPENAI_STT_MODEL: str = os.getenv("OPENAI_STT_MODEL", "mock")
    OPENAI_TTS_MODEL: str = os.getenv("OPENAI_TTS_MODEL", "mock")
    OPENAI_TTS_VOICE: str = os.getenv("OPENAI_TTS_VOICE", "mock")

    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

settings = Settings()
