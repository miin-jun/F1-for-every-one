'''
OpenF1
https://openf1.org/
- team radio 제외
'''

import os
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()


BASE_URL = "https://api.openf1.org/v1"

def get_api_headers():
    """OpenF1 API 인증 헤더 반환"""
    token_url = "https://api.openf1.org/token"
    payload = {
        "username": 'guswls3804@naver.com',
        "password": 'Q9a3meRtSIj59uzh'
    }
    response = requests.post(token_url, data=payload, headers={"Content-Type": "application/x-www-form-urlencoded"})
    access_token = response.json().get('access_token')
    return {"Authorization": f"Bearer {access_token}"}

API_HEADERS = get_api_headers()


def get_current_session():
    """현재 진행 중인 세션 반환 (없으면 최근 세션 반환)"""
    response = requests.get(f"{BASE_URL}/sessions", params={"session_type": "Race"}, headers=API_HEADERS)
    sessions = response.json()
    
    # ⭐ 디버깅: 응답 확인
    if not isinstance(sessions, list):
        print("에러 응답:", sessions)
        raise ValueError(f"API 에러: {sessions}")
    
    if len(sessions) == 0:
        raise ValueError("현재 진행 중이거나 과거 레이스 세션이 없습니다.")

    now = datetime.now(timezone.utc).isoformat()

    # 현재 진행 중인 세션
    live = []
    for s in sessions:
        if s['date_start'] <= now <= s['date_end']:
            live.append(s)
    if live:
        return live[0], True

    # 없으면 가장 최근 세션
    past = []
    for s in sessions:
        if s['date_start'] <= now:
            past.append(s)
    
    if not past:
        return sessions[-1], False  # 가장 마지막 세션
            
    latest = past[0]
    for s in past:
        if s['date_start'] >= latest['date_start']:
            latest = s        

    return latest, False


def get_car_data(session_key, driver_number=None):
    """차량 텔레메트리 데이터"""
    params = {"session_key": session_key}
    if driver_number:
        params["driver_number"] = driver_number
    response = requests.get(f"{BASE_URL}/car_data", params=params, headers=API_HEADERS)
    return response.json()


def get_championship_drivers(year):
    """드라이버 챔피언십 순위 반환"""
    response = requests.get(f"{BASE_URL}/championship_drivers", params={"year": year}, headers=API_HEADERS)
    return response.json()


def get_championship_teams(year):
    """컨스트럭터 챔피언십 순위 반환"""
    response = requests.get(f"{BASE_URL}/championship_teams", params={"year": year}, headers=API_HEADERS)
    return response.json()


def get_drivers(session_key):
    """드라이버 번호, 이름, 팀 정보 반환"""
    response = requests.get(f"{BASE_URL}/drivers", params={"session_key": session_key}, headers=API_HEADERS)
    return response.json()


def get_intervals(session_key):
    """드라이버 간 간격 반환"""
    response = requests.get(f"{BASE_URL}/intervals", params={"session_key": session_key}, headers=API_HEADERS)
    data = response.json()
    
    latest = {}
    for entry in data:
        dn = entry["driver_number"]
        if dn not in latest or entry["date"] > latest[dn]["date"]:
            latest[dn] = entry
    return list(latest.values())


def get_laps(session_key, driver_number=None):
    """드라이버 별 랩 기록 반환"""
    params = {"session_key": session_key}
    if driver_number:
        params["driver_number"] = driver_number
    response = requests.get(f"{BASE_URL}/laps", params=params, headers=API_HEADERS)
    return response.json()


def get_location(session_key, driver_number=None):
    """드라이버 트랙 위치 정보 반환"""
    params = {"session_key": session_key}
    if driver_number:
        params["driver_number"] = driver_number
    response = requests.get(f"{BASE_URL}/location", params=params, headers=API_HEADERS)
    return response.json()


def get_meetings(year):
    """레이스 미팅 목록 반환"""
    params = {}
    if year:
        params["year"] = year
    response = requests.get(f"{BASE_URL}/meetings", params=params, headers=API_HEADERS)
    return response.json()


def get_overtakes(session_key):
    """오버테이크 기록 반환"""
    response = requests.get(f"{BASE_URL}/overtakes", params={"session_key": session_key}, headers=API_HEADERS)
    return response.json()


def get_race_control(session_key):
    """SC, VSC, 페널티 등 레이스 컨트롤 메시지 반환"""
    response = requests.get(f"{BASE_URL}/race_control", params={"session_key": session_key}, headers=API_HEADERS)
    return response.json()


def get_position(session_key):
    """현재 드라이버 순위"""
    response = requests.get(f"{BASE_URL}/position", params={"session_key": session_key}, headers=API_HEADERS)
    data = response.json()

    latest = {}
    for entry in data:
        dn = entry["driver_number"]
        if dn not in latest or entry["date"] > latest[dn]["date"]:
            latest[dn] = entry
    return sorted(latest.values(), key=lambda x: x["position"])


def get_pit_stops(session_key):
    """피트스톱 기록 반환"""
    response = requests.get(f"{BASE_URL}/pit", params={"session_key": session_key}, headers=API_HEADERS)
    return response.json()


def get_session_result(session_key):
    """세션 최종 결과 반환"""
    response = requests.get(f"{BASE_URL}/session_result", params={"session_key": session_key}, headers=API_HEADERS)
    return response.json()


def get_starting_grid(session_key):
    """출발 그리드 순서 반환"""
    response = requests.get(f"{BASE_URL}/starting_grid", params={"session_key": session_key}, headers=API_HEADERS)
    return response.json()


def get_stints(session_key):
    """타이어 종류, 랩수 반환"""
    response = requests.get(f"{BASE_URL}/stints", params={"session_key": session_key}, headers=API_HEADERS)
    return response.json()


def get_weather(session_key):
    """날씨 정보 반환"""
    response = requests.get(f"{BASE_URL}/weather", params={"session_key": session_key}, headers=API_HEADERS)
    data = response.json()

    if data:
        return max(data, key=lambda x: x["date"])
    return None


def get_live_data(mode="basic"):
    """실시간 데이터 한 번에 수집 반환"""
    session, is_live = get_current_session()
    session_key = session["session_key"]
    year = session["year"]

    base = {
        "is_live": is_live,
        "session": session,
        "position": get_position(session_key),
        "race_control": get_race_control(session_key),
        "championship_drivers": get_championship_drivers(year),
        "championship_teams": get_championship_teams(year),
        "meetings": get_meetings(year),
    }

    if mode == "detail":
        base["pit_stops"] = get_pit_stops(session_key)
        base["stints"] = get_stints(session_key)
        base["intervals"] = get_intervals(session_key)
        base["weather"] = get_weather(session_key)

    return base