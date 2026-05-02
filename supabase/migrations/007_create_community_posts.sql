-- ============================================================
-- 테넌트 라운지(커뮤니티) 게시판 테이블 & RLS 정책
-- Supabase SQL Editor에서 실행
-- ============================================================


-- ============================================================
-- 1) community_posts 테이블 생성
-- ============================================================
CREATE TABLE IF NOT EXISTS community_posts (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    category        TEXT            NOT NULL,                     -- 카테고리 (자유수다, 질문있어요, 꿀팁공유, 사기주의보 등)
    tag             TEXT            NOT NULL DEFAULT '',          -- 해시태그 / 서브 태그
    title           TEXT            NOT NULL,                     -- 게시글 제목
    content         TEXT            NOT NULL,                     -- 본문 내용
    author          TEXT            NOT NULL DEFAULT '익명',       -- 작성자 닉네임
    author_email    TEXT,                                         -- 작성자 이메일 (RLS 본인확인용, 화면 노출 X)
    likes           INTEGER         NOT NULL DEFAULT 0,           -- 좋아요 수
    comments_count  INTEGER         NOT NULL DEFAULT 0,           -- 댓글 수
    views           INTEGER         NOT NULL DEFAULT 0,           -- 조회수
    location        TEXT,                                         -- 지역 (서울 마포구 등, nullable)
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now()        -- 작성일시
);

-- 최신순 정렬 인덱스
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at
    ON community_posts (created_at DESC);

-- 카테고리 필터 인덱스
CREATE INDEX IF NOT EXISTS idx_community_posts_category
    ON community_posts (category);


-- ============================================================
-- 2) RLS (Row Level Security) 활성화
-- ============================================================
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 3) SELECT: 누구나 읽기 가능 (anon + authenticated)
-- ============================================================
CREATE POLICY "Allow public read on community_posts"
    ON community_posts
    FOR SELECT
    USING (true);


-- ============================================================
-- 4) INSERT: 테스트 기간 동안 누구나 작성 가능
--    ⚠️ 프로덕션 전환 시 아래 정책을 삭제하고
--       authenticated 전용 정책으로 교체하세요
-- ============================================================
CREATE POLICY "Allow public insert on community_posts"
    ON community_posts
    FOR INSERT
    WITH CHECK (true);

-- (참고) 프로덕션용 INSERT 정책 — 필요 시 위 정책 DROP 후 활성화
-- CREATE POLICY "Authenticated insert on community_posts"
--     ON community_posts
--     FOR INSERT
--     TO authenticated
--     WITH CHECK (true);


-- ============================================================
-- 5) UPDATE: 본인(author_email 일치) 또는 관리자만 가능
-- ============================================================
CREATE POLICY "Owner or admin update on community_posts"
    ON community_posts
    FOR UPDATE
    TO authenticated
    USING (
        author_email = auth.jwt() ->> 'email'
        OR auth.jwt() ->> 'email' = 'dmaenwls@gmail.com'
    )
    WITH CHECK (
        author_email = auth.jwt() ->> 'email'
        OR auth.jwt() ->> 'email' = 'dmaenwls@gmail.com'
    );


-- ============================================================
-- 6) DELETE: 본인(author_email 일치) 또는 관리자만 가능
-- ============================================================
CREATE POLICY "Owner or admin delete on community_posts"
    ON community_posts
    FOR DELETE
    TO authenticated
    USING (
        author_email = auth.jwt() ->> 'email'
        OR auth.jwt() ->> 'email' = 'dmaenwls@gmail.com'
    );


-- ============================================================
-- 7) 시드 데이터 (선택) — 개발/테스트용 샘플 게시글
-- ============================================================
INSERT INTO community_posts (category, tag, title, content, author, likes, comments_count, views, location) VALUES
    ('자유수다',   '일상',     '첫 자취 시작했어요!',                     '오늘 드디어 짐 다 풀었습니다. 혼자 사는 게 이렇게 설렐 줄이야... 자취 선배님들 팁 좀 부탁드려요!', '자취초보',   12, 3, 58,  '서울 마포구'),
    ('질문있어요', '계약',     '전세 계약 시 특약사항 뭐 넣으셨나요?',       '다음 주에 계약 앞두고 있는데 특약 뭘 넣어야 할지 모르겠어요. 선배님들 경험 공유해주세요!',        '계약초보',   24, 8, 142, '서울 강남구'),
    ('꿀팁공유',   '이사',     '이사비용 30만원 아끼는 법',                '이사업체 비교견적 + 폐가전 무상수거 + 짐 줄이기 꿀팁 공유합니다.',                              '이사마스터', 45, 12, 320, '경기 성남시'),
    ('사기주의보', '전세사기',  '⚠️ 이 건물 전세사기 의심됩니다',            '등기부등본 확인했더니 근저당이 매매가의 90%... 혹시 이 건물 아시는 분?',                        '조심이',    67, 21, 512, '서울 강서구'),
    ('자유수다',   '인테리어', '원룸 셀프 인테리어 후기',                   '1만원대 소품으로 분위기 확 바꿨어요! 사진 첨부합니다 📸',                                       '꾸미기달인', 31, 5, 198, '서울 성동구')
ON CONFLICT DO NOTHING;
