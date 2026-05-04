'''
OpenF1 API 데모 테스트
각 엔드포인트별로 데이터 잘 가져오는지 확인
'''

from openf1 import *
import json


def print_section(title):
    """섹션 구분용"""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)


def pretty_print(data, limit=3):
    """JSON 예쁘게 출력 (리스트면 앞 n개만)"""
    if isinstance(data, list):
        print(f"📊 총 {len(data)}개 항목")
        print(json.dumps(data[:limit], indent=2, ensure_ascii=False))
        if len(data) > limit:
            print(f"... (나머지 {len(data) - limit}개 생략)")
    else:
        print(json.dumps(data, indent=2, ensure_ascii=False))


def test_basic():
    """기본 세션 정보 테스트"""
    print_section("1. 현재/최근 세션 정보")
    session, is_live = get_current_session()
    print(f"🔴 라이브: {is_live}")
    pretty_print(session)


def test_championship():
    """챔피언십 순위 테스트"""
    print_section("2. 드라이버 챔피언십 (2024)")
    drivers = get_championship_drivers(2024)
    pretty_print(drivers, limit=5)
    
    print_section("3. 컨스트럭터 챔피언십 (2024)")
    teams = get_championship_teams(2024)
    pretty_print(teams, limit=5)


def test_session_data():
    """세션 관련 데이터 테스트"""
    session, _ = get_current_session()
    sk = session["session_key"]
    
    print_section("4. 드라이버 목록")
    drivers = get_drivers(sk)
    pretty_print(drivers, limit=3)
    
    print_section("5. 현재 순위")
    positions = get_position(sk)
    pretty_print(positions, limit=5)
    
    print_section("6. 레이스 컨트롤 메시지")
    rc = get_race_control(sk)
    pretty_print(rc, limit=3)
    
    print_section("7. 피트스톱")
    pits = get_pit_stops(sk)
    pretty_print(pits, limit=3)
    
    print_section("8. 날씨")
    weather = get_weather(sk)
    pretty_print(weather)


def test_live_data():
    """통합 라이브 데이터 테스트"""
    print_section("9. 라이브 데이터 통합 (basic)")
    basic = get_live_data(mode="basic")
    
    print(f"🔴 라이브: {basic['is_live']}")
    session = basic['session']
    meeting = session.get('meeting_name', session.get('location', 'Unknown'))
    session_name = session.get('session_name', 'Unknown')
    print(f"📍 세션: {meeting} - {session_name}")
    print(f"🏁 현재 순위 TOP 3:")
    for p in basic['position'][:3]:
        print(f"  {p['position']}위 - 드라이버 #{p['driver_number']}")
    
    print_section("10. 라이브 데이터 통합 (detail)")
    detail = get_live_data(mode="detail")
    print(f"✅ 포함 키: {list(detail.keys())}")


if __name__ == "__main__":
    try:
        print("\n🏎️  OpenF1 API 테스트 시작\n")
        
        test_basic()
        test_championship()
        test_session_data()
        test_live_data()
        
        print_section("✅ 테스트 완료")
        
    except Exception as e:
        print(f"\n❌ 에러 발생: {e}")
        import traceback
        traceback.print_exc()



        