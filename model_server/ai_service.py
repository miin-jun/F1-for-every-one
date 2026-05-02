import json
from typing import Any

from openai import OpenAI

from config import Settings
from prompts import F1_SYSTEM_PROMPT
from schemas import ChatRequest, ChatResponse, Citation
from src.rag.retriever import search_regulations, search_regulations_with_debug
from src.services.ex_api_service import (
    format_context_block,
    get_live_race_context,
    get_past_race_context,
    get_round_race_context,
)

client = OpenAI(api_key=Settings.OPENAI_API_KEY)

AGENT_TOOLS = [
    {
        "type": "function",
        "name": "search_regulations",
        "description": (
            "Search the local F1 RAG knowledge base for FIA regulations, penalties, flags, "
            "technical/sporting/financial rules, tire rules, DRS, pit lane, safety car, "
            "F1 glossary, history, circuits, steward decisions, and related evidence."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The user's F1 question or a focused search query.",
                },
            },
            "required": ["query"],
            "additionalProperties": False,
        },
    },
    {
        "type": "function",
        "name": "get_live_race",
        "description": "Fetch current or live F1 race/session context from OpenF1.",
        "parameters": {
            "type": "object",
            "properties": {},
            "additionalProperties": False,
        },
    },
    {
        "type": "function",
        "name": "get_past_race",
        "description": (
            "Fetch F1 season-level historical data such as driver standings, constructor "
            "standings, championship information, and season records."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The user's question, including any year if present.",
                },
            },
            "required": ["query"],
            "additionalProperties": False,
        },
    },
    {
        "type": "function",
        "name": "get_round_race",
        "description": (
            "Fetch F1 data for a specific season round or GP, including race, qualifying, "
            "sprint, or round results."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The user's question, including year and round/GP if present.",
                },
            },
            "required": ["query"],
            "additionalProperties": False,
        },
    },
]


async def create_chat_answer(
    request: ChatRequest,
    debug: bool = False,
) -> ChatResponse:
    mode = Settings.AI_MODE

    if mode == "mock":
        return create_mock_answer(request)

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
        answer, tools_used, debug_info = await generate_agent_answer(request)

        return ChatResponse(
            answer=answer,
            mode="agent",
            tool_used=len(tools_used) > 0,
            citations=build_citations(tools_used),
            metadata={
                "pipeline": "agent_tool_calling",
                "model": Settings.OPENAI_MODEL,
                "tools_used": tools_used,
                "debug": debug_info if debug else {},
            },
        )

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
    response = client.responses.create(
        model=Settings.OPENAI_MODEL,
        instructions=F1_SYSTEM_PROMPT,
        input=build_input_messages(request, context=context),
        store=False,
    )

    return response.output_text


async def generate_agent_answer(request: ChatRequest) -> tuple[str, list[str], dict[str, Any]]:
    response = client.responses.create(
        model=Settings.OPENAI_MODEL,
        instructions=F1_SYSTEM_PROMPT,
        input=build_input_messages(request),
        tools=AGENT_TOOLS,
        tool_choice="auto",
    )

    tools_used: list[str] = []
    tool_outputs = []
    debug_info: dict[str, Any] = {
        "tool_calls": [],
    }

    for item in response.output:
        if get_response_item_value(item, "type") != "function_call":
            continue

        tool_name = get_response_item_value(item, "name")
        call_id = get_response_item_value(item, "call_id")
        arguments = parse_tool_arguments(get_response_item_value(item, "arguments"))

        result = await run_agent_tool(tool_name, arguments, request.message)
        tools_used.append(tool_name)
        debug_info["tool_calls"].append(
            {
                "name": tool_name,
                "arguments": arguments,
                "result_preview": str(result)[:2000],
            }
        )
        tool_outputs.append(
            {
                "type": "function_call_output",
                "call_id": call_id,
                "output": json.dumps(result, ensure_ascii=False),
            }
        )

    if not tool_outputs:
        return response.output_text, tools_used, debug_info

    final_response = client.responses.create(
        model=Settings.OPENAI_MODEL,
        instructions=F1_SYSTEM_PROMPT,
        input=tool_outputs,
        previous_response_id=response.id,
        store=False,
    )

    return final_response.output_text, dedupe_tools(tools_used), debug_info


def build_input_messages(
    request: ChatRequest,
    context: str | None = None,
) -> list[dict[str, str]]:
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
Use the context below as the source of truth for the user's question.
Do not invent latest information, standings, numbers, or exact rules that are not in the context.

[context]
{context}

[user question]
{request.message}
"""

    input_messages.append(
        {
            "role": "user",
            "content": user_content,
        }
    )

    return input_messages


async def run_agent_tool(tool_name: str, arguments: dict, fallback_query: str):
    query = arguments.get("query") or fallback_query

    if tool_name == "search_regulations":
        return {
            "tool": "search_regulations",
            "context": search_regulations(query, k=10),
        }

    if tool_name == "get_live_race":
        return {
            "tool": "get_live_race",
            "context": format_context_block(
                "get_live_race result",
                await get_live_race_context(),
            ),
        }

    if tool_name == "get_past_race":
        return {
            "tool": "get_past_race",
            "context": format_context_block(
                "get_past_race result",
                await get_past_race_context(query),
            ),
        }

    if tool_name == "get_round_race":
        return {
            "tool": "get_round_race",
            "context": format_context_block(
                "get_round_race result",
                await get_round_race_context(query),
            ),
        }

    return {
        "tool": tool_name,
        "error": "Unknown tool",
    }


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
            "DRS는 직선 구간에서 리어 윙 플랩을 열어 공기 저항을 줄이고 "
            "차를 더 빠르게 만드는 장치입니다. 보통 추월을 돕기 위해 사용됩니다."
        )
    elif "pit" in message or "피트" in message:
        answer = (
            "피트 스톱은 경기 중 차가 피트 박스에 들어와 타이어 교체나 점검을 받는 과정입니다. "
            "전략과 순위에 큰 영향을 줍니다."
        )
    else:
        answer = "현재는 mock 응답입니다. AI_MODE를 openai, rag, agent로 바꾸면 실제 모델을 호출합니다."

    return ChatResponse(
        answer=answer,
        mode="mock",
        tool_used=False,
        citations=[],
        metadata={
            "pipeline": "mock",
        },
    )


def parse_tool_arguments(arguments) -> dict:
    if not arguments:
        return {}

    if isinstance(arguments, dict):
        return arguments

    try:
        return json.loads(arguments)
    except json.JSONDecodeError:
        return {}


def get_response_item_value(item, key):
    if isinstance(item, dict):
        return item.get(key)

    return getattr(item, key, None)


def dedupe_tools(tool_names: list[str]) -> list[str]:
    return list(dict.fromkeys(tool_names))
