import json
from typing import Any

from openai import OpenAI

from config import Settings
from prompts import F1_SYSTEM_PROMPT
from schemas import ChatRequest, ChatResponse, Citation
from src.rag.retriever import search_regulations
from src.services.ex_api_service import (
    EXTERNAL_API_TOOLS,
    build_external_api_citations,
    format_context_block,
    route_external_tools,
    run_external_api_tool,
)

client = OpenAI(api_key=Settings.OPENAI_API_KEY)

SEARCH_REGULATIONS_TOOL = {
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
}

AGENT_TOOLS = [
    SEARCH_REGULATIONS_TOOL,
    *EXTERNAL_API_TOOLS,
]


def build_agent_tools(query: str) -> list[dict[str, Any]]:
    """질문 키워드로 외부 API 후보를 좁혀 agent의 tool 선택 부담을 줄인다."""
    routed_tool_names = set(route_external_tools(query))

    if not routed_tool_names:
        return AGENT_TOOLS

    routed_external_tools = [
        tool
        for tool in EXTERNAL_API_TOOLS
        if tool["name"] in routed_tool_names
    ]

    return [
        SEARCH_REGULATIONS_TOOL,
        *routed_external_tools,
    ]


def get_tool_names(tools: list[dict[str, Any]]) -> list[str]:
    return [tool["name"] for tool in tools]


async def create_chat_answer(
    request: ChatRequest,
    debug: bool = False,
) -> ChatResponse:
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


async def generate_agent_answer(request: ChatRequest) -> tuple[str, list[str], dict[str, Any]]:
    tools = build_agent_tools(request.message)
    response = client.responses.create(
        model=Settings.OPENAI_MODEL,
        instructions=F1_SYSTEM_PROMPT,
        input=build_input_messages(request),
        tools=tools,
        tool_choice="auto",
    )

    tools_used: list[str] = []
    tool_outputs = []
    debug_info: dict[str, Any] = {
        "available_tools": get_tool_names(tools),
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
) -> list[dict[str, str]]:
    input_messages = []

    for item in request.history:
        input_messages.append(
            {
                "role": item.role,
                "content": item.content,
            }
        )

    input_messages.append(
        {
            "role": "user",
            "content": request.message,
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

    external_result = await run_external_api_tool(tool_name, arguments, query)
    if external_result.get("error") != "unknown_external_api_tool":
        return {
            "tool": tool_name,
            "context": format_context_block(
                f"{tool_name} result",
                external_result,
            ),
        }

    return {
        "tool": tool_name,
        "error": "Unknown tool",
    }


def build_citations(tool_names: list[str]) -> list[Citation]:
    citations: list[Citation] = []
    external_tool_names: list[str] = []

    for tool_name in tool_names:
        if tool_name == "search_regulations":
            citations.append(
                Citation(
                    title="F1 Regulations RAG",
                    source="rag",
                )
            )
        else:
            external_tool_names.append(tool_name)

    citations.extend(build_external_api_citations(external_tool_names))
    return citations


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
