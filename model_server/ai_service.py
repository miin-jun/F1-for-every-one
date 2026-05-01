from openai import OpenAI

from config import Settings
from prompts import F1_SYSTEM_PROMPT
from schemas import ChatRequest, ChatResponse, Citation
from src.services.ex_api_service import (
    build_external_api_context,
    build_external_api_citations,
)
from src.rag.retriever import search_regulations, search_regulations_with_debug
from sentence_transformers import CrossEncoder

client = OpenAI(api_key=Settings.OPENAI_API_KEY)


async def create_chat_answer(
    request: ChatRequest,
    debug: bool = False,
) -> ChatResponse:
    """
    AI_MODE: mock/openai/rag/agent
    MODE에 따라 테스트 예정
    """
    mode = Settings.AI_MODE

    if mode == "mock":
        return create_mock_answer(request)

    # 검토를 위해 응답의 근거를 현출되게 하는데 프론트에서는 안 보이게 만들어둠
    if mode == "rag":
        rag_result = search_regulations_with_debug(request.message, k=10)

        answer = await generate_openai_answer(
            request=request,
            context=rag_result["context"],
        )

        metadata = {
            "pipeline": "rag",
            "model": Settings.OPENAI_MODEL,
        }

        if debug:
            metadata.update(
                {
                    "translated_query": rag_result["translated_query"],
                    "retrieved_docs": rag_result["debug_docs"],
                    "context_preview": rag_result["context"][:3000],
                }
            )

        return ChatResponse(
            answer=answer,
            mode="rag",
            tool_used=True,
            citations=[
                Citation(
                    title="F1 Regulations RAG",
                    source="rag",
                )
            ],
            metadata=metadata,
        )

    if mode == "agent":
        context, tools_used = await build_agent_context(request.message)

        answer = await generate_openai_answer(
            request=request,
            context=context,
        )

        return ChatResponse(
            answer=answer,
            mode="agent",
            tool_used=len(tools_used) > 0,
            citations=build_citations(tools_used),
            metadata={
                "pipeline": "agent_context_injection",
                "model": Settings.OPENAI_MODEL,
                "tools_used": tools_used,
            },
        )

    # 기본값: openai
    answer = await generate_openai_answer(request=request)

    return ChatResponse(
        answer=answer,
        mode="openai",
        tool_used=False,
        citations=[],
        metadata={
            "pipeline": "openai_only",
            "model": Settings.OPENAI_MODEL,
        },
    )


async def generate_openai_answer(
    request: ChatRequest,
    context: str | None = None,
) -> str:
    input_messages = []

    for item in request.history:
        input_messages.append(
            {
                "role": item.role,
                "content": item.content,
            }
        )

    user_content = request.message

    if context:
        user_content = f"""
- 아래 context를 우선 참고하여 사용자의 질문에 답변
- context에 없는 최신 정보, 수치, 순위, 특정 규정 조항은 추측 금지

[context]
{context}

[사용자 질문]
{request.message}
"""

    input_messages.append(
        {
            "role": "user",
            "content": user_content,
        }
    )

    response = client.responses.create(
        model=Settings.OPENAI_MODEL,
        instructions=F1_SYSTEM_PROMPT,
        input=input_messages,
        store=False,
    )

    return response.output_text


async def search_regulations_context(query: str) -> str:
    return search_regulations(query, k=10)


async def build_agent_context(query: str) -> tuple[str, list[str]]:
    """
    RAG + 외부 API context 조합.
    현재는 외부 API만 연결하고, RAG는 mock context로 유지.
    """
    contexts: list[str] = []
    tools_used: list[str] = []

    # 규정/RAG 쪽
    if needs_regulation_search(query):
        rag_context = await search_regulations_context(query)
        contexts.append(f"[search_regulations 결과]\n{rag_context}")
        tools_used.append("search_regulations")

    # 외부 API
    external_context, external_tools = await build_external_api_context(query)
    contexts.append(external_context)
    tools_used.extend(external_tools)

    return "\n\n".join(contexts), tools_used


def build_citations(tool_names: list[str]) -> list[Citation]:
    citations: list[Citation] = []

    for tool_name in tool_names:
        if tool_name == "search_regulations":
            citations.append(
                Citation(
                    title="F1 Regulations RAG",
                    source="rag",
                )
            )
        elif tool_name == "get_live_race":
            citations.append(
                Citation(
                    title="OpenF1 Live Race Data",
                    source="OpenF1",
                )
            )
        elif tool_name in ["get_past_race", "get_round_race"]:
            citations.append(
                Citation(
                    title="Ergast/Jolpica F1 Historical Data",
                    source="Jolpica Ergast API",
                )
            )

    return citations


def create_mock_answer(request: ChatRequest) -> ChatResponse:
    message = request.message.lower()

    if "drs" in message:
        answer = (
            "DRS는 뒷날개 열림 장치(DRS)로, 직선 구간에서 뒷날개를 열어 공기 저항을 줄이고 "
            "더 빠르게 달릴 수 있게 하는 기능입니다. 쉽게 말하면 앞차를 추월하기 쉽도록 "
            "잠깐 속도 보너스를 주는 장치에 가깝습니다."
        )
    elif "피트" in message or "pit" in message:
        answer = (
            "피트스톱(Pit Stop)은 경기 중 차량이 정비 구역에 들어가 타이어를 교체하거나 "
            "필요한 조치를 받는 과정입니다. F1에서는 언제 피트스톱을 하느냐가 순위에 큰 영향을 줍니다."
        )
    else:
        answer = (
            "현재는 mock 응답입니다. AI_MODE=openai로 변경하면 OpenAI API를 실제 호출해 답변합니다."
        )

    return ChatResponse(
        answer=answer,
        mode="mock",
        tool_used=False,
        citations=[],
        metadata={
            "pipeline": "mock",
        },
    )


def needs_regulation_search(query: str) -> bool:
    q = query.lower()

    keywords = [
        "규정",
        "룰",
        "rule",
        "regulation",
        "페널티",
        "패널티",
        "penalty",
        "플래그",
        "flag",
        "타이어 규정",
        "drs 조건",
        "트랙 리밋",
        "track limit",
        "track limits",
        "피트레인",
        "pit lane",
    ]

    return any(keyword in q for keyword in keywords)