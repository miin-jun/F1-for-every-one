import json
import re
from datetime import datetime
from typing import Any

from schemas import Citation
from src.crawling import openf1, ergast


async def build_external_api_context(query: str) -> tuple[str, list[str]]:
    """
    사용자 질문을 보고 필요한 외부 API context를 조합

    현재 구조:
    - 실시간/현재 경기 질문 → OpenF1
    - 시즌 순위/드라이버/컨스트럭터 질문 → Ergast/Jolpica
    - 특정 라운드/GP 결과 질문 → Ergast/Jolpica
    """
    contexts: list[str] = []
    tools_used: list[str] = []

    if needs_live_race(query):
        live_context = await get_live_race_context()
        contexts.append(format_context_block("get_live_race 결과", live_context))
        tools_used.append("get_live_race")

    if needs_round_race(query):
        round_context = await get_round_race_context(query)
        contexts.append(format_context_block("get_round_race 결과", round_context))
        tools_used.append("get_round_race")

    if needs_past_race(query):
        past_context = await get_past_race_context(query)
        contexts.append(format_context_block("get_past_race 결과", past_context))
        tools_used.append("get_past_race")

    if not contexts:
        contexts.append(
            "외부 API 조회가 필요한 질문으로 판단되지 않았습니다. "
            "일반적인 F1 개념 설명은 기본 지식으로 답변하세요."
        )

    return "\n\n".join(contexts), tools_used


async def get_live_race_context() -> dict[str, Any]:
    try:
        return sanitize(openf1.get_live_data(mode="basic"))
    except Exception as error:
        return {
            "error": "get_live_race failed",
            "detail": str(error),
        }


async def get_past_race_context(query: str) -> dict[str, Any]:
    target_year = extract_year(query)

    try:
        return sanitize(
            {
                "year": target_year,
                "driver_standings": ergast.get_driver_standings(target_year),
                "constructor_standings": ergast.get_constructor_standings(target_year),
            }
        )
    except Exception as error:
        return {
            "error": "get_past_race failed",
            "year": target_year,
            "detail": str(error),
        }


async def get_round_race_context(query: str) -> dict[str, Any]:
    target_year = extract_year(query)
    target_round = extract_round(query)

    if target_round is None:
        return {
            "error": "round_not_found",
            "message": (
                "질문에서 라운드 번호를 찾을 수 없습니다. "
                "예: '2024년 3라운드 결과 알려줘'처럼 질문하면 조회할 수 있습니다."
            ),
            "year": target_year,
        }

    try:
        return sanitize(
            {
                "year": target_year,
                "round": target_round,
                "round_data": ergast.get_round_data(target_year, target_round),
            }
        )
    except Exception as error:
        return {
            "error": "get_round_race failed",
            "year": target_year,
            "round": target_round,
            "detail": str(error),
        }


def build_external_api_citations(tool_names: list[str]) -> list[Citation]:
    citations: list[Citation] = []

    for tool_name in tool_names:
        if tool_name == "get_live_race":
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


def needs_live_race(query: str) -> bool:
    q = query.lower()

    keywords = [
        "실시간",
        "라이브",
        "현재 경기",
        "지금 경기",
        "현재 레이스",
        "지금 레이스",
        "현재 세션",
        "지금 세션",
        "live",
        "current race",
        "current session",
    ]

    return any(keyword in q for keyword in keywords)


def needs_past_race(query: str) -> bool:
    q = query.lower()

    keywords = [
        "순위",
        "스탠딩",
        "standing",
        "standings",
        "챔피언십",
        "championship",
        "드라이버 순위",
        "컨스트럭터",
        "constructor",
        "constructors",
        "소속",
        "team",
        "팀",
        "시즌 기록",
    ]

    return any(keyword in q for keyword in keywords)


def needs_round_race(query: str) -> bool:
    q = query.lower()

    keywords = [
        "라운드",
        "round",
        "gp",
        "그랑프리",
        "결과",
        "우승자",
        "예선",
        "퀄리파잉",
        "qualifying",
        "스프린트",
        "sprint",
        "결승",
        "race result",
    ]

    return any(keyword in q for keyword in keywords)


def extract_year(query: str) -> int:
    match = re.search(r"20\d{2}", query)

    if match:
        return int(match.group())

    return datetime.now().year


def extract_round(query: str) -> int | None:
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