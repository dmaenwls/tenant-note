"""
seed_community_posts.py — 커뮤니티 게시판 시드 데이터 삽입
===========================================================
community.html의 POSTS 목업 데이터 10건을
Supabase community_posts 테이블에 일괄 삽입합니다.

사용법:
    cd scripts          (또는 프로젝트 루트)
    python seed_community_posts.py
"""

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client, Client

# ============================================================
# 0. 환경변수 로딩 (.env.local → .env)
# ============================================================
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

print("-" * 50)
print(f"🔑 Supabase URL : {SUPABASE_URL[:30]}..." if SUPABASE_URL else "❌ SUPABASE_URL 없음")
print(f"🔑 Supabase Key : {SUPABASE_KEY[:8]}..." if SUPABASE_KEY else "❌ SUPABASE_KEY 없음")
print("-" * 50)

if not all([SUPABASE_URL, SUPABASE_KEY]):
    print("❌ 필수 환경변수가 누락되었습니다. .env.local 파일을 확인하세요.")
    print("   필요한 키: SUPABASE_URL, SUPABASE_KEY (또는 SUPABASE_SERVICE_ROLE_KEY)")
    sys.exit(1)


# ============================================================
# 1. 시드 데이터 (community.html의 POSTS 10건)
# ============================================================
# category/tag 매핑:
#   legacy 'hot'    → category '베스트',   tag 'best'
#   legacy 'talk'   → category '자유수다', tag 'talk'
#   legacy 'qna'    → category '질문있어요', tag 'qna'
#   legacy 'review' → category '후기요청', tag 'review'
#   legacy 'rant'   → category '대나무숲', tag 'rant'

CATEGORY_MAP = {
    "hot":    "베스트",
    "talk":   "자유수다",
    "qna":    "질문있어요",
    "review": "후기요청",
    "rant":   "대나무숲",
}

POSTS = [
    {
        "category": "hot", "tag": "best",
        "title": "집주인이 보일러 수리비 반반 내자는데 이거 맞아?",
        "content": "들어온 지 3개월 됐는데 갑자기 보일러 고장남. 기사님이 노후 문제라는데 집주인은 사용 부주의 아니냐며 반반 내자고 함. 이거 내가 내야 돼? 진짜 어이없어서...",
        "author": "분노의세입자",
        "likes": 124, "comments_count": 45, "views": 1200,
        "location": None,
    },
    {
        "category": "hot", "tag": "best",
        "title": "서울 자취 5년차의 벌레 퇴치 꿀팁 푼다",
        "content": "바퀴벌레, 돈벌레, 그리마 다 겪어봄. 맥스포스겔만 믿지 마라. 진짜 중요한 건 하수구 트랩이랑 창문 물구멍 막는 거임. 다이소템으로 해결하는 법 알려줌.",
        "author": "세스코지망생",
        "likes": 89, "comments_count": 23, "views": 890,
        "location": None,
    },
    {
        "category": "talk", "tag": "talk",
        "title": "오늘 이사했는데 짜장면 혼밥 중... 외롭다",
        "content": "짐 정리는 끝이 없고 짜장면은 불어 터지고... 엄마 보고 싶네 갑자기. 다들 첫 독립 때 어땠어?",
        "author": "도비이즈프리",
        "likes": 5, "comments_count": 2, "views": 45,
        "location": None,
    },
    {
        "category": "qna", "tag": "qna",
        "title": "전세보증보험 HUG랑 HF 차이가 뭐야? 제발 알려줘 ㅠㅠ",
        "content": "은행 갔더니 HF가 더 싸다는데 HUG가 더 안전하다는 말도 있고... 목적물 따라 다르다는 건 또 무슨 소리야? 신축 빌라인데 어디로 해야 돼?",
        "author": "전세초보",
        "likes": 0, "comments_count": 8, "views": 120,
        "location": "신림 르네상스 오피스텔",
    },
    {
        "category": "review", "tag": "review",
        "title": "관악구 해피오피스텔 살아본 사람? 방음 괜찮아?",
        "content": "신림역 5분 거리라 위치는 딱인데 옆방 소음 심하다는 리뷰를 봐서... 밤에 잠귀 밝은 편인데 여기 살아본 선배님들 후기 좀 부탁해!",
        "author": "귀밝은토끼",
        "likes": 2, "comments_count": 5, "views": 300,
        "location": "관악 해피오피스텔",
    },
    {
        "category": "rant", "tag": "rant",
        "title": "윗집 발망치 진짜 올라가서 따질까 고민 중",
        "content": "새벽 2시인데 쿵쿵거림. 코끼리를 키우나 봐. 쪽지 붙여도 소용없고 층간소음 신고해본 사람 있어? 효과 있나?",
        "author": "다크서클",
        "likes": 15, "comments_count": 12, "views": 450,
        "location": None,
    },
    {
        "category": "talk", "tag": "talk",
        "title": "월세 50으로 서울살이 가능? (현실적인 조언 좀)",
        "content": "보증금 1000에 월세 50 관리비 포함...으로 영등포 쪽 구하고 싶은데 반지하 말고 지상층 가능할까? 너무 욕심인가?",
        "author": "지방러",
        "likes": 7, "comments_count": 20, "views": 600,
        "location": None,
    },
    {
        "category": "qna", "tag": "qna",
        "title": "묵시적 갱신 되면 계약서 다시 써야 함?",
        "content": "2년 지났는데 집주인이 아무 말 없어서 그냥 살고 있거든. 이거 확정일자 다시 받아야 돼? 아니면 그냥 냅둬도 보증금 보호 되는 거냐?",
        "author": "법알못",
        "likes": 3, "comments_count": 4, "views": 150,
        "location": None,
    },
    {
        "category": "review", "tag": "review",
        "title": "성수동 쉐어하우스 솔직 후기 (비추천)",
        "content": "인스타 감성 보고 들어갔다가 화장실 청소 때문에 피 터지게 싸움. 쉐어하우스 로망 있는 애들 잘 들어라. 남이랑 사는 건 지옥이다.",
        "author": "독고다이",
        "likes": 30, "comments_count": 15, "views": 1000,
        "location": None,
    },
    {
        "category": "talk", "tag": "talk",
        "title": "다들 집 꾸미기에 얼마 씀?",
        "content": "오늘의집 보니까 눈만 높아져서... 커튼이랑 조명만 샀는데 벌써 30만원 깨짐. 가성비 인테리어 템 추천 좀 해줘.",
        "author": "텅장요정",
        "likes": 10, "comments_count": 9, "views": 400,
        "location": None,
    },
]


# ============================================================
# 2. 메인
# ============================================================
def main():
    print("=" * 60)
    print("🎋 커뮤니티 게시판 시드 데이터 삽입 스크립트")
    print(f"   대상 테이블: community_posts")
    print(f"   삽입할 데이터: {len(POSTS)}건")
    print("=" * 60)

    # Supabase 클라이언트
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Supabase 연결 완료\n")

    # ----- 기존 데이터 중복 방지: title 기준으로 이미 있는 게시글 스킵 -----
    print("🔍 기존 데이터 확인 중...")
    try:
        existing = supabase.table("community_posts").select("title").execute()
        existing_titles = {row["title"] for row in (existing.data or [])}
        print(f"   기존 게시글: {len(existing_titles)}건")
    except Exception as e:
        print(f"   ⚠️ 기존 데이터 조회 실패 (테이블이 없을 수 있음): {e}")
        existing_titles = set()

    # ----- 삽입할 레코드 구성 -----
    records_to_insert = []
    skipped = 0

    for post in POSTS:
        if post["title"] in existing_titles:
            print(f"   ⏭️ 이미 존재 → 스킵: {post['title'][:30]}...")
            skipped += 1
            continue

        records_to_insert.append({
            "category":       CATEGORY_MAP.get(post["category"], post["category"]),
            "tag":            post["tag"],
            "title":          post["title"],
            "content":        post["content"],
            "author":         post["author"],
            "likes":          post["likes"],
            "comments_count": post["comments_count"],
            "views":          post["views"],
            "location":       post["location"],
        })

    if not records_to_insert:
        print(f"\n📭 새로 삽입할 데이터가 없습니다. (스킵: {skipped}건)")
        print("   이미 모든 시드 데이터가 존재합니다.")
        return

    # ----- 일괄 INSERT -----
    print(f"\n💾 {len(records_to_insert)}건 삽입 중...")
    try:
        result = supabase.table("community_posts").insert(records_to_insert).execute()
        inserted = len(result.data) if result.data else 0
        print(f"\n🎯 삽입 완료: {inserted}건 성공 / {skipped}건 스킵 (중복)")
    except Exception as e:
        print(f"\n❌ 삽입 실패: {e}")
        sys.exit(1)

    print("\n" + "=" * 60)
    print("🏁 시드 데이터 삽입 완료!")
    print("=" * 60)


if __name__ == "__main__":
    main()
