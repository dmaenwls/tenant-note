-- ============================================================
-- 인사이트(전문가 칼럼) 테이블 & RLS 정책
-- Supabase SQL Editor에서 실행
-- ============================================================

-- ============================================================
-- 1) insights 테이블 생성
-- ============================================================
CREATE TABLE IF NOT EXISTS insights (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    category    TEXT          NOT NULL,                    -- 카테고리 (전세사기 예방, 계약 실무, 시장 분석 등)
    title       TEXT          NOT NULL,                    -- 칼럼 제목
    summary     TEXT          NOT NULL,                    -- 요약 (카드에 표시)
    author      TEXT          NOT NULL DEFAULT '김평가사',  -- 작성자
    image_url   TEXT,                                      -- 썸네일 이미지 URL
    content     TEXT,                                      -- 본문 (HTML 마크업 저장)
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()       -- 작성일
);

-- 최신순 정렬 인덱스
CREATE INDEX IF NOT EXISTS idx_insights_created_at
    ON insights (created_at DESC);

-- 카테고리별 필터링 인덱스
CREATE INDEX IF NOT EXISTS idx_insights_category
    ON insights (category);


-- ============================================================
-- 2) RLS (Row Level Security) 활성화
-- ============================================================
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 3) 일반 사용자 정책: SELECT만 허용 (읽기 전용)
--    anon, authenticated 모두 공개 읽기 가능
-- ============================================================
CREATE POLICY "Allow public read on insights"
    ON insights
    FOR SELECT
    USING (true);


-- ============================================================
-- 4) 관리자 정책: INSERT / UPDATE / DELETE
--    Supabase Auth에서 이메일이 관리자 이메일인 유저만 허용
--    ⚠️ 아래 'your-admin@email.com' 을 실제 관리자 이메일로 변경하세요
-- ============================================================

-- 관리자 INSERT 정책
CREATE POLICY "Admin insert on insights"
    ON insights
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.jwt() ->> 'email' = 'dmaenwls@gmail.com'
    );

-- 관리자 UPDATE 정책
CREATE POLICY "Admin update on insights"
    ON insights
    FOR UPDATE
    TO authenticated
    USING (
        auth.jwt() ->> 'email' = 'dmaenwls@gmail.com'
    )
    WITH CHECK (
        auth.jwt() ->> 'email' = 'dmaenwls@gmail.com'
    );

-- 관리자 DELETE 정책
CREATE POLICY "Admin delete on insights"
    ON insights
    FOR DELETE
    TO authenticated
    USING (
        auth.jwt() ->> 'email' = 'dmaenwls@gmail.com'
    );
