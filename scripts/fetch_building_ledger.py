"""
fetch_building_ledger.py — 건축물대장 표제부 ETL
==================================================
국토교통부 '건축물대장 표제부 조회 API'를 호출하여
Supabase building_ledger 테이블에 데이터를 적재합니다.

사용법:
    cd scripts          (또는 프로젝트 루트)
    python fetch_building_ledger.py
"""

import os
import re
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path

import pandas as pd
import requests
from dotenv import load_dotenv
from supabase import create_client, Client

# ============================================================
# 0. 환경변수 로딩
# ============================================================
# .env.local → .env 순으로 탐색 (현재 디렉토리 → 상위 디렉토리)
_cwd = Path.cwd()
for _name in [".env.local", ".env"]:
    for _dir in [_cwd, _cwd.parent]:
        _candidate = _dir / _name
        if _candidate.exists():
            load_dotenv(dotenv_path=_candidate, override=True)
            print(f"✅ 환경변수 로드: {_candidate}")
            break

SUPABASE_URL = (os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")).strip()
SUPABASE_KEY = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY", "")).strip()
API_KEY      = (os.getenv("DATA_GO_KR_API_KEY") or os.getenv("DATA_GO_KR_DECODING_KEY", "")).strip()

# 키 확인
print("-" * 50)
print(f"🔑 공공데이터 API 키 : {API_KEY[:12]}..." if API_KEY else "❌ DATA_GO_KR_API_KEY 없음")
print(f"🔑 Supabase URL     : {SUPABASE_URL[:20]}..." if SUPABASE_URL else "❌ SUPABASE_URL 없음")
print(f"🔑 Supabase Key     : {SUPABASE_KEY[:8]}..." if SUPABASE_KEY else "❌ SUPABASE_SERVICE_ROLE_KEY 없음")
print("-" * 50)

if not all([API_KEY, SUPABASE_URL, SUPABASE_KEY]):
    print("❌ 필수 환경변수가 누락되었습니다. .env.local 파일을 확인하세요.")
    print("   필요한 키: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATA_GO_KR_API_KEY")
    sys.exit(1)

# ============================================================
# 1. 설정 상수
# ============================================================
# 테스트 대상: 관악구 신림동
DEFAULT_SIGUNGU_CD = "11620"     # 서울시 관악구 (5자리)
DEFAULT_BJDONG_CD  = "10200"     # 신림동 (5자리)

# 건축물대장 표제부 API 엔드포인트
API_ENDPOINT = "http://apis.data.go.kr/1613000/BldRgstService_v2/getBrTitleInfo"

# 트래픽 제한: 최대 50건만 조회
FETCH_LIMIT = 50

# API 호출 간 대기 (초) — 트래픽 초과 방지
API_DELAY = 0.3

# ============================================================
# 2. 지번 파싱 함수
# ============================================================
def parse_jibun(jibun: str) -> dict:
    """
    지번 문자열을 API 파라미터로 분해.

    Examples:
        "123-4"   → platGbCd=0, bun=0123, ji=0004
        "산12-3"  → platGbCd=1, bun=0012, ji=0003
        "567"     → platGbCd=0, bun=0567, ji=0000
        "산5"     → platGbCd=1, bun=0005, ji=0000
    """
    jibun = jibun.strip()

    # 산 여부 판별
    plat_gb_cd = "0"  # 대지
    if jibun.startswith("산"):
        plat_gb_cd = "1"
        jibun = jibun[1:].strip()

    # 본번-부번 분리
    parts = re.split(r"[-−]", jibun)  # 일반 하이픈 + 전각 하이픈

    bun_raw = parts[0].strip() if len(parts) >= 1 else "0"
    ji_raw  = parts[1].strip() if len(parts) >= 2 else "0"

    # 숫자만 추출 후 4자리 패딩
    bun = re.sub(r"\D", "", bun_raw).zfill(4)
    ji  = re.sub(r"\D", "", ji_raw).zfill(4)

    return {
        "platGbCd": plat_gb_cd,
        "bun": bun,
        "ji": ji,
    }


# ============================================================
# 3. 건축물대장 API 호출
# ============================================================
def fetch_building_info(
    jibun: str,
    sigungu_cd: str = DEFAULT_SIGUNGU_CD,
    bjdong_cd: str = DEFAULT_BJDONG_CD,
) -> dict | None:
    """
    단일 지번에 대해 건축물대장 표제부 API를 호출하고
    첫 번째 item의 주요 필드를 dict로 반환.
    데이터 없으면 None.
    """
    parsed = parse_jibun(jibun)
    plat_gb_cd = parsed["platGbCd"]  # 🔥 대지구분코드 원복
    bun = parsed["bun"]
    ji  = parsed["ji"]

    # 비정상 지번(본번이 0000) 스킵
    if bun == "0000":
        return None

    # f-string으로 URL 직접 조립 (params 딕셔너리 사용 금지 → 이중 인코딩 방지)
    full_url = (
        f"{API_ENDPOINT}"
        f"?ServiceKey={API_KEY}"
        f"&sigunguCd={sigungu_cd}"
        f"&bjdongCd={bjdong_cd}"
        f"&platGbCd={plat_gb_cd}"
        f"&bun={bun}"
        f"&ji={ji}"
        f"&numOfRows=10"
        f"&pageNo=1"
    )

    try:
        resp = requests.get(full_url, timeout=10)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"    ⚠️ API 요청 실패 (지번={jibun}): {e}")
        return None

    # XML 파싱
    try:
        root = ET.fromstring(resp.text)
    except ET.ParseError:
        print(f"    ⚠️ XML 파싱 실패 (지번={jibun})")
        return None

    # 에러코드 확인
    result_code = root.findtext(".//resultCode")
    if result_code and result_code != "00":
        result_msg = root.findtext(".//resultMsg", "Unknown error")
        print(f"    ⚠️ API 에러 (지번={jibun}): [{result_code}] {result_msg}")
        return None

    # item 추출
    item = root.find(".//item")
    if item is None:
        return None  # 데이터 없음 (정상)

    def _text(tag: str) -> str | None:
        """item 내부의 태그 텍스트 추출"""
        el = item.find(tag)
        return el.text.strip() if el is not None and el.text else None

    def _float(tag: str) -> float | None:
        val = _text(tag)
        if val:
            try:
                return float(val)
            except ValueError:
                return None
        return None

    def _int(tag: str) -> int | None:
        val = _text(tag)
        if val:
            try:
                return int(float(val))
            except ValueError:
                return None
        return None

    # 사용승인일 파싱 (YYYYMMDD → YYYY-MM-DD)
    use_apr_raw = _text("useAprDay")
    use_apr_day = None
    if use_apr_raw and len(use_apr_raw) == 8:
        use_apr_day = f"{use_apr_raw[:4]}-{use_apr_raw[4:6]}-{use_apr_raw[6:8]}"

    return {
        "bld_nm":       _text("bldNm"),
        "main_purps":   _text("mainPurpsCdNm"),
        "vl_rat":       _float("vlRat"),
        "bc_rat":       _float("bcRat"),
        "use_apr_day":  use_apr_day,
        "tot_pkng_cnt": _int("totPkngCnt"),
        "viol_bld_yn":  _text("violBldYn"),
    }


# ============================================================
# 4. Supabase에서 지번 목록 조회
# ============================================================
def get_jibun_list(supabase: Client, limit: int = FETCH_LIMIT) -> list[str]:
    """
    real_estate_sales 테이블에서 고유 지번 목록을 가져온다.
    Supabase의 .select()으로 distinct 효과를 내기 위해
    jibun만 가져온 뒤 Python에서 중복 제거.
    """
    print(f"\n📋 real_estate_sales에서 지번 목록 조회 (limit={limit})...")

    try:
        resp = (
            supabase
            .table("real_estate_sales")
            .select("jibun")
            .not_.is_("jibun", "null")
            .limit(limit * 3)  # 중복 고려해 넉넉히 가져옴
            .execute()
        )
    except Exception as e:
        print(f"❌ Supabase 조회 실패: {e}")
        return []

    if not resp.data:
        print("   📭 지번 데이터 없음")
        return []

    # 중복 제거 + limit 적용
    seen = set()
    unique_jibuns = []
    for row in resp.data:
        j = (row.get("jibun") or "").strip()
        if j and j not in seen:
            seen.add(j)
            unique_jibuns.append(j)
        if len(unique_jibuns) >= limit:
            break

    print(f"   ✅ 고유 지번 {len(unique_jibuns)}건 확보")
    return unique_jibuns


# ============================================================
# 5. Supabase Upsert (배치)
# ============================================================
def upsert_building_ledger(supabase: Client, records: list[dict], batch_size: int = 50):
    """
    building_ledger 테이블에 upsert.
    PK = (region_code, jibun)
    """
    if not records:
        print("   📭 저장할 데이터 없음")
        return 0

    total = len(records)
    success = 0

    for i in range(0, total, batch_size):
        batch = records[i : i + batch_size]
        try:
            supabase.table("building_ledger").upsert(
                batch, on_conflict="region_code,jibun"
            ).execute()
            success += len(batch)
            print(
                f"    ✅ batch {i // batch_size + 1}/"
                f"{(total - 1) // batch_size + 1}  ({len(batch)}건 저장)"
            )
        except Exception as e:
            print(f"    ❌ batch {i // batch_size + 1} 실패: {e}")

    return success


# ============================================================
# 6. 메인 파이프라인
# ============================================================
def main():
    print("=" * 60)
    print("🏗️  건축물대장 표제부 ETL — fetch_building_ledger.py")
    print(f"   대상: 관악구 신림동 ({DEFAULT_SIGUNGU_CD}/{DEFAULT_BJDONG_CD})")
    print(f"   제한: 최대 {FETCH_LIMIT}건")
    print("=" * 60)

    # Supabase 클라이언트
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Supabase 연결 완료")

    # 1) 지번 목록 확보
    jibun_list = get_jibun_list(supabase, limit=FETCH_LIMIT)
    if not jibun_list:
        print("❌ 조회할 지번이 없습니다. real_estate_sales에 데이터가 있는지 확인하세요.")
        sys.exit(0)

    # 2) 건축물대장 API 호출
    print(f"\n📡 건축물대장 API 호출 시작 ({len(jibun_list)}건)...\n")
    results: list[dict] = []
    skipped = 0

    for idx, jibun in enumerate(jibun_list, start=1):
        parsed = parse_jibun(jibun)
        bun = parsed["bun"]
        ji  = parsed["ji"]

        print(
            f"  [{idx:3d}/{len(jibun_list)}] 지번={jibun:>10s}  "
            f"→ bun={bun} ji={ji}",
            end="  ",
        )

        # 🔥 수정 3: 비정상 지번 스킵 (본번 0000)
        if bun == "0000":
            print("⏭️ 비정상 지번(본번 0000) → 스킵")
            skipped += 1
            continue

        info = fetch_building_info(jibun)

        if info is None:
            print("⏭️ 데이터 없음")
            skipped += 1
        else:
            # region_code + jibun 추가 (PK)
            info["region_code"] = DEFAULT_SIGUNGU_CD
            info["jibun"] = jibun
            results.append(info)
            print(f"✅ {info.get('main_purps', '-')} / 주차 {info.get('tot_pkng_cnt', '-')}")

        # API 호출 간격
        time.sleep(API_DELAY)

    # 3) Supabase Upsert
    print(f"\n{'─' * 50}")
    print(f"📊 API 호출 결과: 성공 {len(results)}건 / 스킵 {skipped}건")
    print(f"{'─' * 50}")

    if results:
        print("\n💾 Supabase building_ledger 테이블에 저장 중...")
        saved = upsert_building_ledger(supabase, results)
        print(f"\n🎯 최종 저장 완료: {saved}건")
    else:
        print("\n📭 저장할 데이터가 없습니다.")

    print("\n" + "=" * 60)
    print("🏁 건축물대장 ETL 완료!")
    print("=" * 60)


# ============================================================
# Entry Point
# ============================================================
if __name__ == "__main__":
    main()
