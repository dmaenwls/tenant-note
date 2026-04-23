-- ============================================================
-- insights 테이블 RLS 정책 재설정
-- 기존 더미 이메일 정책을 DROP 후, 실제 관리자 이메일로 재생성
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 1) 기존 정책 전부 DROP (에러 방지를 위해 IF EXISTS 사용)
DROP POLICY IF EXISTS "Admin insert on insights"  ON insights;
DROP POLICY IF EXISTS "Admin update on insights"  ON insights;
DROP POLICY IF EXISTS "Admin delete on insights"  ON insights;
DROP POLICY IF EXISTS "Allow public read on insights" ON insights;

-- 2) RLS 활성화 (이미 켜져 있어도 안전)
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- 3) 공개 읽기 정책 (재생성)
CREATE POLICY "Allow public read on insights"
    ON insights
    FOR SELECT
    USING (true);

-- 4) 관리자 INSERT
CREATE POLICY "Admin insert on insights"
    ON insights
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.jwt() ->> 'email' = 'dmaenwls@gmail.com'
    );

-- 5) 관리자 UPDATE
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

-- 6) 관리자 DELETE
CREATE POLICY "Admin delete on insights"
    ON insights
    FOR DELETE
    TO authenticated
    USING (
        auth.jwt() ->> 'email' = 'dmaenwls@gmail.com'
    );
