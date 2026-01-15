import os
import random
from supabase import create_client
from dotenv import load_dotenv

# 1. 파일 위치 강제 탐색 (현재 위치 기준)
current_dir = os.getcwd()
env_path = os.path.join(current_dir, '.env.local')

# 2. .env.local 로딩 시도 (없으면 .env 시도)
if os.path.exists(env_path):
    print(f"✅ Found .env.local at: {env_path}")
    load_dotenv(env_path)
else:
    print("⚠️ .env.local not found, trying .env...")
    load_dotenv()

# 3. 만능 키 찾기 (이름이 뭐든 다 찾아냄)
url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

# 4. 그래도 없으면 에러 (디버깅 정보 출력)
if not url or not key:
    print("\n❌ [ERROR] 키를 찾을 수 없습니다!")
    print(f"👉 현재 폴더: {current_dir}")
    print(f"👉 폴더 내 파일들: {os.listdir(current_dir)}")
    raise ValueError("제발 .env.local 파일을 확인해주세요 ㅠㅠ")

# 5. Supabase 연결 및 데이터 생성
supabase = create_client(url, key)

data = []
for _ in range(50):
    # 강남역 중심 반경 2km 내 랜덤 좌표
    lat = 37.4979 + random.uniform(-0.02, 0.02)
    lng = 127.0276 + random.uniform(-0.02, 0.02)
    
    # 등급 랜덤
    grade = random.choice(['A', 'B', 'C'])
    
    # 가격 랜덤 (1억~10억)
    deposit = random.randint(10, 100) * 10000000 
    monthly = random.randint(0, 200) * 10000

    item = {
        "location": f"POINT({lng} {lat})",  # 경도, 위도 순서 준수
        "safety_grade": grade,
        "price_deposit": deposit,
        "price_monthly": monthly,
        "address": "서울시 강남구 역삼동 (테스트)",
        "building_name": f"테스트 빌딩 {random.randint(1, 100)}"
    }
    data.append(item)

# 6. 데이터 전송
print(f"🚀 {len(data)}개 데이터 전송 시작...")
try:
    response = supabase.table('listings').upsert(data).execute()
    print("🎉 50 listings inserted successfully! (성공)")
except Exception as e:
    print(f"❌ 전송 실패: {e}")