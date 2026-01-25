import pandas as pd
from supabase import create_client, Client
import math

# ---------------------------------------------------------
# 🔑 Supabase 키 설정 (반드시 본인의 키로 변경하세요!)
# ---------------------------------------------------------
SUPABASE_URL = "https://lmvllfiirflsrdkjktbq.supabase.co" 
SUPABASE_KEY = "sb_publishable_J6ksbNPwLTF3bWVXV8tnsg_1QxCrBNr"

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"🔥 Supabase 연결 설정 실패: {e}")
    exit()

def upload_data():
    print("🗑️ 1. 기존 데이터 삭제 중 (초기화)...")
    try:
        # 기존 데이터 전체 삭제 (안전하게 id가 0보다 큰 것 삭제)
        supabase.table('cctv').delete().gt('id', 0).execute()
        print("   ✅ DB 초기화 완료!")
    except Exception as e:
        print(f"   ⚠️ 초기화 중 메시지(무시 가능): {e}")

    print("\n📂 2. CSV 파일 로딩 중...")
    df = None
    # 인코딩 자동 감지 (한글 깨짐 방지)
    encodings = ['utf-8', 'cp949', 'euc-kr', 'utf-8-sig']
    
    for enc in encodings:
        try:
            df = pd.read_csv('cctv_data.csv', encoding=enc)
            print(f"   ✅ 파일 읽기 성공 (인코딩: {enc})")
            break
        except:
            continue
            
    if df is None:
        print("❌ 파일 읽기 실패. 엑셀에서 'CSV (UTF-8)' 형식으로 다시 저장해주세요.")
        return

    # 3. 컬럼명 스마트 매핑 (깨진 글자라도 찾기)
    print(f"📋 읽어온 컬럼: {list(df.columns)}")
    
    target_lat = None
    target_lng = None
    
    # [수정된 부분] for 와 in 사이에 변수 x를 넣었습니다.
    for col in df.columns:
        c = str(col).lower()
        if any(x in c for x in ['lat', '위도', 'wgs84위도']): target_lat = col
        if any(x in c for x in ['lon', 'lng', '경도', 'wgs84경도']): target_lng = col

    # 못 찾았으면 위치(인덱스)로 강제 추정 (보통 뒤쪽에 좌표가 있음)
    if not target_lat or not target_lng:
        print("⚠️ 컬럼 이름으로 좌표를 찾을 수 없어, 12, 13번째 컬럼을 좌표로 가정합니다.")
        if len(df.columns) > 13:
            target_lat = df.columns[1] # 엑셀 13번째
            target_lng = df.columns[2] # 엑셀 14번째

    print(f"🎯 좌표 컬럼 확정: 위도=[{target_lat}], 경도=[{target_lng}]")

    # 4. 데이터 정제 및 변환
    records = []
    print("🔄 유효 데이터 선별 중...")

    count_skipped = 0
    for index, row in df.iterrows():
        try:
            lat = row[target_lat]
            lng = row[target_lng]

            # 좌표가 없거나 0이면 건너뜀
            if pd.isna(lat) or pd.isna(lng):
                count_skipped += 1
                continue
                
            lat_val = float(lat)
            lng_val = float(lng)

            # 🚨 핵심: 대한민국 좌표 범위(33~43, 124~132)가 아니면 버림 (0,0 데이터 차단)
            if not (33 < lat_val < 43 and 124 < lng_val < 132):
                count_skipped += 1
                continue

            record = {
                "name": str(row.get('관리기관명', 'CCTV')), 
                "address": str(row.get('소재지도로명주소', row.get('소재지지번주소', '주소미상'))),
                "purpose": str(row.get('설치목적구분', '다목적')),
                "count": int(row.get('카메라대수', 1)),
                "lat": lat_val,
                "lng": lng_val,
            }
            records.append(record)
        except:
            count_skipped += 1
            continue

    print(f"   🚀 유효 데이터: {len(records)}개 (제외된 불량 데이터: {count_skipped}개)")

    if len(records) == 0:
        print("❌ 업로드할 유효한 데이터가 없습니다. 좌표 컬럼을 다시 확인하세요.")
        return

    # 5. 고속 업로드 (배치 처리)
    print("📡 DB 업로드 시작...")
    batch_size = 1000
    total_batches = math.ceil(len(records) / batch_size)

    for i in range(total_batches):
        batch = records[i*batch_size : (i+1)*batch_size]
        try:
            supabase.table('cctv').insert(batch).execute()
            print(f"   ✅ Batch [{i+1}/{total_batches}] 완료")
        except Exception as e:
            print(f"   ❌ Batch [{i+1}] 에러: {e}")

    print("🎉 모든 작업이 완료되었습니다!")

if __name__ == "__main__":
    upload_data()