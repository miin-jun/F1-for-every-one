import json
import re
from datetime import datetime
from typing import Any, Callable

from schemas import Citation
from src.crawling import ergast, openf1


def build_round_tool_properties() -> dict[str, Any]:
    return {
        "query": {"type": "string", "description": "The user's question."},
        "year": {"type": "integer", "description": "Season year, for example 2024."},
        "round": {"type": "integer", "description": "Round number in the season, for example 3."},
    }


EXTERNAL_API_TOOLS = [
    {
        "type": "function",
        "name": "get_live_race",
        "description": (
            "Fetch current or latest F1 race context from OpenF1, including race position, "
            "race control messages, championship snapshots, and meeting data."
        ),
        "parameters": {
            "type": "object",
            "properties": {},
            "additionalProperties": False,
        },
    },
    {
        "type": "function",
        "name": "get_driver_standings",
        "description": "Fetch F1 driver championship standings for a season from Jolpica/Ergast.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "The user's question."},
                "year": {"type": "integer", "description": "Season year, for example 2024."},
            },
            "required": ["query"],
            "additionalProperties": False,
        },
    },
    {
        "type": "function",
        "name": "get_constructor_standings",
        "description": "Fetch F1 constructor championship standings for a season from Jolpica/Ergast.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "The user's question."},
                "year": {"type": "integer", "description": "Season year, for example 2024."},
            },
            "required": ["query"],
            "additionalProperties": False,
        },
    },
    {
        "type": "function",
        "name": "get_season_schedule",
        "description": "Fetch the race schedule/calendar for an F1 season from Jolpica/Ergast.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "The user's question."},
                "year": {"type": "integer", "description": "Season year, for example 2024."},
            },
            "required": ["query"],
            "additionalProperties": False,
        },
    },
    {
        "type": "function",
        "name": "get_race_results",
        "description": "Fetch race results for a specific F1 season round from Jolpica/Ergast.",
        "parameters": {
            "type": "object",
            "properties": build_round_tool_properties(),
            "required": ["query"],
            "additionalProperties": False,
        },
    },
    {
        "type": "function",
        "name": "get_qualifying_results",
        "description": "Fetch qualifying results for a specific F1 season round from Jolpica/Ergast.",
        "parameters": {
            "type": "object",
            "properties": build_round_tool_properties(),
            "required": ["query"],
            "additionalProperties": False,
        },
    },
    {
        "type": "function",
        "name": "get_sprint_results",
        "description": "Fetch sprint results for a specific F1 season round from Jolpica/Ergast.",
        "parameters": {
            "type": "object",
            "properties": build_round_tool_properties(),
            "required": ["query"],
            "additionalProperties": False,
        },
    },
    {
        "type": "function",
        "name": "get_pit_stops",
        "description": "Fetch pit stop records for a specific F1 season round from Jolpica/Ergast.",
        "parameters": {
            "type": "object",
            "properties": build_round_tool_properties(),
            "required": ["query"],
            "additionalProperties": False,
        },
    },
    {
        "type": "function",
        "name": "get_lap_times",
        "description": "Fetch lap timing records for a specific F1 season round from Jolpica/Ergast.",
        "parameters": {
            "type": "object",
            "properties": build_round_tool_properties(),
            "required": ["query"],
            "additionalProperties": False,
        },
    },
]


async def build_external_api_context(query: str) -> tuple[str, list[str]]:
    """질문 키워드로 필요한 외부 API를 미리 골라 context를 조합한다."""
    tool_names = route_external_tools(query)
    contexts: list[str] = []

    for tool_name in tool_names:
        result = await run_external_api_tool(tool_name, {"query": query}, query)
        contexts.append(format_context_block(f"{tool_name} result", result))

    if not contexts:
        contexts.append(
            "외부 API 조회가 필요한 질문으로 판단되지 않았습니다. "
            "일반적인 F1 개념 설명은 모델의 기본 지식과 RAG를 우선 사용하세요."
        )

    return "\n\n".join(contexts), tool_names


async def run_external_api_tool(
    tool_name: str,
    arguments: dict[str, Any],
    fallback_query: str,
) -> dict[str, Any]:
    query = str(arguments.get("query") or fallback_query)
    year = parse_year(arguments.get("year"), query)
    round_number = parse_round(arguments.get("round"), query)

    handlers: dict[str, Callable[[], Any]] = {
        "get_live_race": lambda: get_live_race_context(),
        "get_driver_standings": lambda: get_driver_standings_context(year),
        "get_constructor_standings": lambda: get_constructor_standings_context(year),
        "get_season_schedule": lambda: get_season_schedule_context(year),
        "get_race_results": lambda: get_round_context("get_race_results", year, round_number, ergast.get_results),
        "get_qualifying_results": lambda: get_round_context(
            "get_qualifying_results",
            year,
            round_number,
            ergast.get_qualifying,
        ),
        "get_sprint_results": lambda: get_round_context("get_sprint_results", year, round_number, ergast.get_sprint),
        "get_pit_stops": lambda: get_round_context("get_pit_stops", year, round_number, ergast.get_pitstops),
        "get_lap_times": lambda: get_round_context("get_lap_times", year, round_number, ergast.get_laps),
    }

    handler = handlers.get(tool_name)
    if handler is None:
        return {
            "tool": tool_name,
            "error": "unknown_external_api_tool",
        }

    try:
        return sanitize(await maybe_await(handler()))
    except Exception as error:
        return {
            "tool": tool_name,
            "error": f"{tool_name} failed",
            "detail": str(error),
        }


async def maybe_await(value: Any) -> Any:
    if hasattr(value, "__await__"):
        return await value
    return value


async def get_live_race_context() -> dict[str, Any]:
    return {
        "tool": "get_live_race",
        "source": "OpenF1",
        "context": openf1.get_live_data(mode="basic"),
    }


def get_driver_standings_context(year: int) -> dict[str, Any]:
    return {
        "tool": "get_driver_standings",
        "source": "Jolpica Ergast API",
        "year": year,
        "driver_standings": ergast.get_driver_standings(year),
    }


def get_constructor_standings_context(year: int) -> dict[str, Any]:
    return {
        "tool": "get_constructor_standings",
        "source": "Jolpica Ergast API",
        "year": year,
        "constructor_standings": ergast.get_constructor_standings(year),
    }


def get_season_schedule_context(year: int) -> dict[str, Any]:
    return {
        "tool": "get_season_schedule",
        "source": "Jolpica Ergast API",
        "year": year,
        "races": ergast.get_races(year),
    }


def get_round_context(
    tool_name: str,
    year: int,
    round_number: int | None,
    fetcher: Callable[[int, int], Any],
) -> dict[str, Any]:
    if round_number is None:
        return {
            "tool": tool_name,
            "error": "round_not_found",
            "year": year,
            "message": "질문에서 라운드 번호를 찾지 못했습니다. 예: 2024년 3라운드 결과",
        }

    return {
        "tool": tool_name,
        "source": "Jolpica Ergast API",
        "year": year,
        "round": round_number,
        "data": fetcher(year, round_number),
    }


def route_external_tools(query: str) -> list[str]:
    """질문 키워드 기반의 보조 라우터다. agent tool 선택 실패를 줄이는 용도로 쓴다."""
    q = query.lower()
    tool_names: list[str] = []

    keyword_routes = [
        ("get_live_race", ["실시간", "라이브", "현재 경기", "지금 경기", "live", "current race"]),
        ("get_driver_standings", ["드라이버 순위", "driver standing", "driver standings"]),
        ("get_constructor_standings", ["컨스트럭터", "constructor", "constructors", "팀 순위"]),
        ("get_season_schedule", ["일정", "캘린더", "calendar", "schedule"]),
        ("get_qualifying_results", ["예선", "퀄리파잉", "qualifying"]),
        ("get_sprint_results", ["스프린트", "sprint"]),
        ("get_pit_stops", ["피트스톱", "피트 스톱", "pit stop", "pit stops"]),
        ("get_lap_times", ["랩타임", "랩 타임", "lap time", "lap times", "laps"]),
        ("get_race_results", ["결과", "결승", "race result", "race results", "round"]),
    ]

    for tool_name, keywords in keyword_routes:
        if any(keyword in q for keyword in keywords):
            tool_names.append(tool_name)

    # 외부 API 미호출 시 규정 용어 검색
    if not tool_names:
        tool_names.append("search_regulations")

    return dedupe(tool_names)


def build_external_api_citations(tool_names: list[str]) -> list[Citation]:
    citations: list[Citation] = []

    for source in dedupe(get_tool_source(tool_name) for tool_name in tool_names):
        if source == "OpenF1":
            citations.append(Citation(title="OpenF1 Live Race Data", source="OpenF1"))
        elif source == "Jolpica Ergast API":
            citations.append(Citation(title="Jolpica Ergast F1 Data", source="Jolpica Ergast API"))

    return citations


def get_tool_source(tool_name: str) -> str:
    if tool_name == "get_live_race":
        return "OpenF1"
    return "Jolpica Ergast API"


def parse_year(value: Any, query: str) -> int:
    if isinstance(value, int):
        return value

    if isinstance(value, str) and value.isdigit():
        return int(value)

    match = re.search(r"20\d{2}", query)
    if match:
        return int(match.group())

    return datetime.now().year


def parse_round(value: Any, query: str) -> int | None:
    if isinstance(value, int):
        return value

    if isinstance(value, str) and value.isdigit():
        return int(value)

    q = query.lower()
    patterns = [
        r"라운드\s*(\d+)",
        r"(\d+)\s*라운드",
        r"round\s*(\d+)",
        r"round\s*#?\s*(\d+)",
    ]

    for pattern in patterns:
        match = re.search(pattern, q)
        if match:
            return int(match.group(1))

    return None


def sanitize(obj: Any) -> Any:
    if isinstance(obj, str):
        return obj.encode("utf-8", errors="ignore").decode("utf-8")

    if isinstance(obj, dict):
        return {key: sanitize(value) for key, value in obj.items()}

    if isinstance(obj, list):
        return [sanitize(item) for item in obj]

    return obj


def format_context_block(title: str, data: Any) -> str:
    try:
        body = json.dumps(
            sanitize(data),
            ensure_ascii=False,
            indent=2,
        )
    except TypeError:
        body = str(data)

    return f"""
[{title}]
{body}
"""


def dedupe(items: list[str]) -> list[str]:
    return list(dict.fromkeys(items))
