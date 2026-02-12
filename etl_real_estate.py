"""
etl_real_estate.py — 국토교통부 실거래가 ETL 파이프라인
=====================================================
PublicDataReader로 국토부 API 8종(매매4 + 전월세4)을 수집하고,
카카오 로컬 API로 좌표 변환 후 Supabase에 Upsert합니다.

사용법:
    cd data_pipeline
    python etl_real_estate.py
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# ============================================================
# 0. 설정 (Config) - 환경변수 강제 로딩
# ============================================================

# 1. .env.local 파일 위치 찾기 (현재 폴더 또는 상위 폴더 검색)
current_dir = Path.cwd()
env_path = current_dir / '.env.local'

if not env_path.exists():
    # 현재 폴더에 없으면 상위 폴더도 한번 찾아봄
    env_path = current_dir.parent / '.env.local'

# 2. 파일 로드 (override=True로 기존 설정 덮어쓰기)
if env_path.exists():
    print(f"✅ 환경변수 파일 로드: {env_path}")
    load_dotenv(dotenv_path=env_path, override=True)
else:
    print("⚠️ .env.local 파일을 찾을 수 없습니다. 기본 설정을 시도합니다.")
    load_dotenv() # 기본 .env 로드 시도

# 3. API 키 불러오기 (공백 제거 .strip() 추가)
# 파이썬 변수명 = os.getenv("실제 .env 파일 안의 변수명")
DATA_GO_KR_KEY = os.getenv("DATA_GO_KR_DECODING_KEY", "").strip() # 혹은 DATA_GO_KR_CCTV_KEY
KAKAO_REST_API_KEY = os.getenv("KAKAO_REST_API_KEY", "").strip()
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip() or os.getenv("NEXT_PUBLIC_SUPABASE_URL", "").strip()
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "").strip() or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "").strip()

# 4. 키 확인 (디버깅용)
print("-" * 30)
print(f"🔑 공공데이터 키 : {DATA_GO_KR_KEY[:10]}..." if DATA_GO_KR_KEY else "❌ 공공데이터 키 없음")
print(f"🔑 카카오 키     : {KAKAO_REST_API_KEY[:5]}..." if KAKAO_REST_API_KEY else "❌ 카카오 키 없음")
print(f"🔑 수파베이스 URL: {SUPABASE_URL[:15]}..." if SUPABASE_URL else "❌ 수파베이스 URL 없음")
print("-" * 30)

# 5. 필수 키가 없으면 프로그램 종료
if not all([DATA_GO_KR_KEY, KAKAO_REST_API_KEY, SUPABASE_URL, SUPABASE_KEY]):
    print("❌ [오류] 필수 API 키가 누락되었습니다. .env.local 파일을 확인해주세요.")
    sys.exit(1)
import time
import hashlib
import uuid
from datetime import datetime
from functools import lru_cache

import pandas as pd
import requests
from dotenv import load_dotenv
from supabase import create_client, Client

# PublicDataReader
from PublicDataReader import TransactionPrice

# ============================================================
# 0. 설정 (Config)
# ============================================================
load_dotenv(dotenv_path='../.env.local')
load_dotenv(dotenv_path='../.env')  # fallback

# API 키
DATA_GO_KR_KEY = os.getenv("DATA_GO_KR_DECODING_KEY", "")
KAKAO_REST_API_KEY = os.getenv("KAKAO_REST_API_KEY", "")

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY", "")

# 대상 지역 (관악구)
TARGET_SIGUNGU = "11620"   # 서울시 관악구 법정동코드(5자리)
TARGET_NAME = "관악구"

# 수집 기간
START_YEAR_MONTH = "202401"
END_YEAR_MONTH = datetime.now().strftime("%Y%m")  # 현재월까지

# 중복 방지용 UUID 네임스페이스
UUID_NAMESPACE = uuid.UUID("b3d7e8a1-4c5f-6789-abcd-ef0123456789")

# ============================================================
# 1. 환경 검증
# ============================================================
def validate_env():
    """필수 환경변수 확인"""
    missing = []
    if not DATA_GO_KR_KEY:
        missing.append("DATA_GO_KR_DECODING_KEY")
    if not KAKAO_REST_API_KEY:
        missing.append("KAKAO_REST_API_KEY")
    if not SUPABASE_URL:
        missing.append("SUPABASE_URL")
    if not SUPABASE_KEY:
        missing.append("SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY)")

    if missing:
        print("=" * 60)
        print("❌ 다음 환경변수가 .env.local 또는 .env에 설정되어야 합니다:")
        for m in missing:
            print(f"   • {m}")
        print("=" * 60)
        sys.exit(1)

    print("✅ 환경변수 확인 완료")

# ============================================================
# 2. Supabase 클라이언트
# ============================================================
def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)

# ============================================================
# 3. 카카오 Geocoding (주소 → 좌표)
# ============================================================
@lru_cache(maxsize=5000)
def geocode_address(address: str):
    """
    카카오 로컬 API로 주소 → (lat, lng) 변환.
    LRU 캐시로 같은 주소 반복 호출 방지.
    """
    try:
        resp = requests.get(
            "https://dapi.kakao.com/v2/local/search/address.json",
            headers={"Authorization": f"KakaoAK {KAKAO_REST_API_KEY}"},
            params={"query": address},
            timeout=5,
        )
        if resp.status_code == 200:
            result = resp.json()
            if result.get("documents"):
                doc = result["documents"][0]
                lat = float(doc["y"])
                lng = float(doc["x"])
                return lat, lng
        elif resp.status_code == 429:
            # Rate limit → 잠시 대기 후 재시도
            time.sleep(1)
            return geocode_address.__wrapped__(address)  # bypass cache
    except Exception as e:
        pass  # 실패 시 None 반환

    return None

def build_address(row: pd.Series) -> str:
    """법정동 + 지번으로 주소 문자열 생성"""
    dong = str(row.get("법정동", "")).strip()
    jibun = str(row.get("지번", "")).strip()

    # "서울특별시 관악구" 접두어 추가
    if dong and jibun:
        return f"서울특별시 {TARGET_NAME} {dong} {jibun}"
    elif dong:
        return f"서울특별시 {TARGET_NAME} {dong}"
    return ""

# ============================================================
# 4. Deterministic UUID 생성 (중복 방지)
# ============================================================
def generate_id(*args) -> str:
    """인자들을 조합해 결정적 UUID5 생성"""
    raw = "|".join(str(a).strip() for a in args)
    return str(uuid.uuid5(UUID_NAMESPACE, raw))

# ============================================================
# 5. 건물명 추출 헬퍼
# ============================================================
def extract_building_name(row, property_type: str) -> str:
    """건물명 추출: 단지명 > 아파트 > aptNm > 오피스텔 > ..."""
    # 공통 우선순위 키
    priority_keys = ["단지명"]
    # property_type별 추가 키
    type_keys = {
        "아파트":     ["아파트", "aptNm"],
        "오피스텔":   ["오피스텔", "offiNm"],
        "연립다세대": ["연립다세대", "mhouseNm"],
        "단독다가구": ["단독다가구", "houseNm"],
    }
    keys = priority_keys + type_keys.get(property_type, ["아파트", "aptNm"])
    return get_val(row, *keys)


def get_val(row: pd.Series, *keys, default=""):
    """이중 키 확인: 한글 키 → 영문 키 순서로 값 탐색"""
    for key in keys:
        val = row.get(key)
        if pd.notna(val) and str(val).strip():
            return str(val).strip()
    return default

# ============================================================
# 6. 데이터 변환 — 매매
# ============================================================
def transform_sales(df: pd.DataFrame, property_type: str, region_code: str) -> list[dict]:
    """매매 DataFrame → real_estate_sales row dicts"""
    records = []

    # ✅ DataFrame → List[dict] 강제 변환
    if isinstance(df, pd.DataFrame):
        items = df.to_dict('records')
    else:
        items = list(df)

    if not items:
        return records

    # 👀 디버깅: 첫 번째 데이터의 키 확인
    print(f"    👀 [매매] 컬럼 키 목록: {list(items[0].keys())}")
    print(f"    👀 [매매] 첫 번째 데이터 샘플: {items[0]}")

    for idx, row in enumerate(items):
        try:
            # --- 날짜 조립 (3중 안전장치) ---
            year  = get_val(row, "계약년도", "년", "dealYear")
            month = get_val(row, "계약월", "월", "dealMonth")
            day   = get_val(row, "계약일", "일", "dealDay")

            if not year or not month or not day:
                continue

            contract_date = f"{year}-{month.zfill(2)}-{day.zfill(2)}"

            # --- 문자열 필드 (3중 키) ---
            jibun         = get_val(row, "지번", "jibun")
            building_name = extract_building_name(row, property_type)
            sigungu_code  = get_val(row, "지역코드", "sggCd", default=region_code)

            # --- 숫자 필드 (3중 키 + 안전 변환) ---
            floor_raw = get_val(row, "층", "floor", default="0")
            floor_int = int(float(floor_raw)) if floor_raw else 0

            deal_amount_raw = get_val(row, "거래금액", "dealAmount", default="0").replace(",", "")
            deal_amount = int(deal_amount_raw) if deal_amount_raw else 0

            build_year_raw = get_val(row, "건축년도", "buildYear", default="0")
            build_year_int = int(float(build_year_raw)) if build_year_raw else 0

            area_raw = get_val(row, "전용면적", "excluUseAr", default="0")
            area_exclusive = float(area_raw) if area_raw else 0.0

            # --- 결정적 ID ---
            record_id = generate_id(contract_date, jibun, floor_int, deal_amount)

            # --- Geocoding ---
            address = build_address(row)
            location_wkt = None
            if address:
                coords = geocode_address(address)
                if coords:
                    lat, lng = coords
                    location_wkt = f"POINT({lng} {lat})"
                time.sleep(0.05)

            records.append({
                "id": record_id,
                "region_code": sigungu_code,
                "building_name": building_name,
                "jibun": jibun,
                "floor": floor_int,
                "build_year": build_year_int,
                "area_exclusive": area_exclusive,
                "deal_amount": deal_amount,
                "contract_date": contract_date,
                "location": location_wkt,
            })
        except Exception as e:
            print(f"    ⚠️ 매매 변환 오류 (행 {idx}): {e}")
            continue

    return records

# ============================================================
# 7. 데이터 변환 — 전월세
# ============================================================
def transform_rents(df: pd.DataFrame, property_type: str, region_code: str) -> list[dict]:
    """전월세 DataFrame → real_estate_rents row dicts"""
    records = []

    # ✅ DataFrame → List[dict] 강제 변환
    if isinstance(df, pd.DataFrame):
        items = df.to_dict('records')
    else:
        items = list(df)

    if not items:
        return records

    # 👀 디버깅: 첫 번째 데이터의 키 확인
    print(f"    👀 [전월세] 컬럼 키 목록: {list(items[0].keys())}")
    print(f"    👀 [전월세] 첫 번째 데이터 샘플: {items[0]}")

    for idx, row in enumerate(items):
        try:
            # --- 날짜 조립 (3중 안전장치) ---
            year  = get_val(row, "계약년도", "년", "dealYear")
            month = get_val(row, "계약월", "월", "dealMonth")
            day   = get_val(row, "계약일", "일", "dealDay")

            if not year or not month or not day:
                continue

            contract_date = f"{year}-{month.zfill(2)}-{day.zfill(2)}"

            # --- 문자열 필드 (3중 키) ---
            jibun         = get_val(row, "지번", "jibun")
            building_name = extract_building_name(row, property_type)
            sigungu_code  = get_val(row, "지역코드", "sggCd", default=region_code)

            # --- 숫자 필드 (3중 키 + 안전 변환) ---
            floor_raw = get_val(row, "층", "floor", default="0")
            floor_int = int(float(floor_raw)) if floor_raw else 0

            deposit_raw = get_val(row, "보증금", "보증금액", "deposit", default="0").replace(",", "")
            deposit = int(deposit_raw) if deposit_raw else 0

            monthly_rent_raw = get_val(row, "월세", "월세금액", "monthlyRent", default="0").replace(",", "")
            monthly_rent = int(monthly_rent_raw) if monthly_rent_raw else 0

            # 전월세 구분 (3중 키)
            contract_type_raw = get_val(row, "전월세구분", "dealType")
            if "전세" in contract_type_raw:
                contract_type = "전세"
            elif "월세" in contract_type_raw:
                contract_type = "월세"
            else:
                contract_type = "전세" if monthly_rent == 0 else "월세"

            build_year_raw = get_val(row, "건축년도", "buildYear", default="0")
            build_year_int = int(float(build_year_raw)) if build_year_raw else 0

            area_raw = get_val(row, "전용면적", "excluUseAr", default="0")
            area_exclusive = float(area_raw) if area_raw else 0.0

            # --- 결정적 ID ---
            record_id = generate_id(contract_date, jibun, floor_int, deposit, monthly_rent)

            # --- Geocoding ---
            address = build_address(row)
            location_wkt = None
            if address:
                coords = geocode_address(address)
                if coords:
                    lat, lng = coords
                    location_wkt = f"POINT({lng} {lat})"
                time.sleep(0.05)

            records.append({
                "id": record_id,
                "region_code": sigungu_code,
                "building_name": building_name,
                "jibun": jibun,
                "floor": floor_int,
                "build_year": build_year_int,
                "area_exclusive": area_exclusive,
                "deposit": deposit,
                "monthly_rent": monthly_rent,
                "contract_type": contract_type,
                "contract_date": contract_date,
                "location": location_wkt,
            })
        except Exception as e:
            print(f"    ⚠️ 전월세 변환 오류 (행 {idx}): {e}")
            continue

    return records

# ============================================================
# 8. 중복 제거 (Pandas drop_duplicates)
# ============================================================
def deduplicate_records(records: list[dict], trade_type: str) -> list[dict]:
    """Pandas drop_duplicates로 강력한 중복 제거"""
    if not records:
        return records

    df = pd.DataFrame(records)
    before_count = len(df)

    # 타입 통일 (미세한 차이 방지)
    if 'area_exclusive' in df.columns:
        df['area_exclusive'] = pd.to_numeric(df['area_exclusive'], errors='coerce').fillna(0).astype(float)
    if 'floor' in df.columns:
        df['floor'] = pd.to_numeric(df['floor'], errors='coerce').fillna(0).astype(int)
    if 'build_year' in df.columns:
        df['build_year'] = pd.to_numeric(df['build_year'], errors='coerce').fillna(0).astype(int)

    # 거래 유형별 중복 기준 컬럼
    if trade_type == "매매":
        if 'deal_amount' in df.columns:
            df['deal_amount'] = pd.to_numeric(df['deal_amount'], errors='coerce').fillna(0).astype(int)
        subset_cols = ['contract_date', 'jibun', 'floor', 'area_exclusive', 'deal_amount', 'building_name']
    else:
        if 'deposit' in df.columns:
            df['deposit'] = pd.to_numeric(df['deposit'], errors='coerce').fillna(0).astype(int)
        if 'monthly_rent' in df.columns:
            df['monthly_rent'] = pd.to_numeric(df['monthly_rent'], errors='coerce').fillna(0).astype(int)
        subset_cols = ['contract_date', 'jibun', 'floor', 'area_exclusive', 'deposit', 'monthly_rent', 'building_name']

    # 실제 존재하는 컬럼만 필터
    subset_cols = [c for c in subset_cols if c in df.columns]

    df.drop_duplicates(subset=subset_cols, keep='last', inplace=True)
    after_count = len(df)
    removed = before_count - after_count

    if removed > 0:
        print(f"    🧹 강력 중복 제거: {before_count} → {after_count} ({removed}건 삭제)")
    else:
        print(f"    ✅ 중복 없음: {before_count}건 업로드 시작")

    return df.to_dict('records')

# ============================================================
# 9. Supabase Upsert
# ============================================================
def upsert_to_supabase(supabase: Client, table: str, records: list[dict], batch_size: int = 200):
    """배치 단위로 Supabase upsert (on_conflict="id")"""
    if not records:
        print(f"    📭 {table}: 저장할 데이터 없음")
        return 0

    total = len(records)
    success_count = 0

    for i in range(0, total, batch_size):
        batch = records[i:i + batch_size]
        try:
            response = supabase.table(table).upsert(batch, on_conflict="id").execute()
            success_count += len(batch)
            print(f"    ✅ {table}: batch {i // batch_size + 1}/{(total - 1) // batch_size + 1} "
                  f"({len(batch)}건 저장)")
        except Exception as e:
            print(f"    ❌ {table}: batch {i // batch_size + 1} 실패 — {e}")

    return success_count

# ============================================================
# 9. API 설정 (8종)
# ============================================================
API_CONFIGS = [
    # 매매 4종 → real_estate_sales
    {"property_type": "아파트",     "trade_type": "매매",   "target": "real_estate_sales", "label": "아파트 매매"},
    {"property_type": "오피스텔",   "trade_type": "매매",   "target": "real_estate_sales", "label": "오피스텔 매매"},
    {"property_type": "연립다세대", "trade_type": "매매",   "target": "real_estate_sales", "label": "연립다세대 매매"},
    {"property_type": "단독다가구", "trade_type": "매매",   "target": "real_estate_sales", "label": "단독다가구 매매"},
    # 전월세 4종 → real_estate_rents
    {"property_type": "아파트",     "trade_type": "전월세", "target": "real_estate_rents", "label": "아파트 전월세"},
    {"property_type": "오피스텔",   "trade_type": "전월세", "target": "real_estate_rents", "label": "오피스텔 전월세"},
    {"property_type": "연립다세대", "trade_type": "전월세", "target": "real_estate_rents", "label": "연립다세대 전월세"},
    {"property_type": "단독다가구", "trade_type": "전월세", "target": "real_estate_rents", "label": "단독다가구 전월세"},
]

# ============================================================
# 10. 메인 파이프라인
# ============================================================
def run_pipeline():
    """전체 ETL 파이프라인 실행"""
    print("=" * 60)
    print(f"🏠 국토교통부 실거래가 ETL 파이프라인")
    print(f"   대상: {TARGET_NAME} ({TARGET_SIGUNGU})")
    print(f"   기간: {START_YEAR_MONTH} ~ {END_YEAR_MONTH}")
    print("=" * 60)
    print()

    validate_env()

    # PublicDataReader 초기화
    print("\n📡 PublicDataReader 초기화...")
    api = TransactionPrice(DATA_GO_KR_KEY)
    print("✅ API 초기화 완료")

    # Supabase 클라이언트
    supabase = get_supabase()
    print("✅ Supabase 연결 완료\n")

    total_sales = 0
    total_rents = 0

    for config in API_CONFIGS:
        property_type = config["property_type"]
        trade_type = config["trade_type"]
        target_table = config["target"]
        label = config["label"]

        print(f"\n{'─' * 50}")
        print(f"📥 [{label}] 데이터 수집 중...")
        print(f"   시군구: {TARGET_SIGUNGU}, 기간: {START_YEAR_MONTH}~{END_YEAR_MONTH}")

        try:
            # PublicDataReader API 호출
            df = api.get_data(
                property_type=property_type,
                trade_type=trade_type,
                sigungu_code=TARGET_SIGUNGU,
                start_year_month=START_YEAR_MONTH,
                end_year_month=END_YEAR_MONTH,
            )

            if df is None or df.empty:
                print(f"   📭 데이터 없음 — 건너뜀")
                continue

            print(f"   📦 {len(df)}건 수집 완료")

            # 데이터 변환 + 중복 제거 + 업로드
            if trade_type == "매매":
                records = transform_sales(df, property_type, TARGET_SIGUNGU)
                records = deduplicate_records(records, "매매")
                count = upsert_to_supabase(supabase, target_table, records)
                total_sales += count
            else:
                records = transform_rents(df, property_type, TARGET_SIGUNGU)
                records = deduplicate_records(records, "전월세")
                count = upsert_to_supabase(supabase, target_table, records)
                total_rents += count

            print(f"   🎯 [{label}] {count}건 저장 완료")

        except Exception as e:
            print(f"   ❌ [{label}] 오류 발생: {e}")
            import traceback
            traceback.print_exc()
            continue

    # 최종 리포트
    print("\n" + "=" * 60)
    print(f"🏁 ETL 완료!")
    print(f"   📊 real_estate_sales: {total_sales}건 저장")
    print(f"   📊 real_estate_rents: {total_rents}건 저장")
    print(f"   🗺️ Geocoding 캐시: {geocode_address.cache_info()}")
    print("=" * 60)

# ============================================================
# Entry Point
# ============================================================
if __name__ == "__main__":
    run_pipeline()
