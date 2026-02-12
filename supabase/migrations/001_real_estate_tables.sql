-- ============================================================
-- 국토교통부 실거래가 테이블 & 갭 분석 뷰
-- Supabase SQL Editor에서 실행
-- ============================================================

-- 0) PostGIS 확장 활성화
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- 1) real_estate_rents  (전월세 거래)
-- ============================================================
CREATE TABLE IF NOT EXISTS real_estate_rents (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_code   TEXT        NOT NULL,          -- 법정동 코드
    building_name TEXT,                          -- 건물명
    jibun         TEXT        NOT NULL,          -- 지번
    floor         INTEGER,                       -- 층
    build_year    INTEGER,                       -- 건축년도
    area_m2       NUMERIC(10,2),                 -- 전용면적(㎡)
    location      GEOGRAPHY(Point, 4326),        -- 위경도(WGS84)

    -- 전월세 전용 컬럼
    deposit       BIGINT      NOT NULL DEFAULT 0,  -- 보증금 (만원)
    monthly_rent  BIGINT      NOT NULL DEFAULT 0,  -- 월세   (만원, 전세는 0)
    contract_type TEXT        NOT NULL,             -- '전세' | '월세'

    contract_date DATE,                          -- 계약일
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- GIST 공간 인덱스 (Source 400)
CREATE INDEX IF NOT EXISTS idx_rents_location
    ON real_estate_rents USING GIST (location);

-- 조회 성능용 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_rents_building_lookup
    ON real_estate_rents (region_code, jibun, building_name);

CREATE INDEX IF NOT EXISTS idx_rents_contract_date
    ON real_estate_rents (contract_date DESC);

-- ============================================================
-- 2) real_estate_sales  (매매 거래)
-- ============================================================
CREATE TABLE IF NOT EXISTS real_estate_sales (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_code   TEXT        NOT NULL,          -- 법정동 코드
    building_name TEXT,                          -- 건물명
    jibun         TEXT        NOT NULL,          -- 지번
    floor         INTEGER,                       -- 층
    build_year    INTEGER,                       -- 건축년도
    area_m2       NUMERIC(10,2),                 -- 전용면적(㎡)
    location      GEOGRAPHY(Point, 4326),        -- 위경도(WGS84)

    -- 매매 전용 컬럼
    deal_amount   BIGINT      NOT NULL,          -- 거래금액 (만원)

    deal_date     DATE,                          -- 거래일
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- GIST 공간 인덱스 (Source 400)
CREATE INDEX IF NOT EXISTS idx_sales_location
    ON real_estate_sales USING GIST (location);

-- 조회 성능용 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_sales_building_lookup
    ON real_estate_sales (region_code, jibun, building_name);

CREATE INDEX IF NOT EXISTS idx_sales_deal_date
    ON real_estate_sales (deal_date DESC);

-- ============================================================
-- 3) view_gap_analysis  (갭 투자 분석 뷰)
--    같은 건물(region_code + jibun + building_name)의
--    [최근 매매가 vs 최근 전세가] 비교
-- ============================================================
CREATE OR REPLACE VIEW view_gap_analysis AS
WITH latest_sale AS (
    -- 건물별 가장 최근 매매 거래
    SELECT DISTINCT ON (region_code, jibun, building_name)
        region_code,
        jibun,
        building_name,
        deal_amount,
        deal_date,
        floor         AS sale_floor,
        area_m2       AS sale_area_m2,
        build_year,
        location
    FROM real_estate_sales
    ORDER BY region_code, jibun, building_name, deal_date DESC NULLS LAST
),
latest_jeonse AS (
    -- 건물별 가장 최근 전세 거래 (contract_type = '전세')
    SELECT DISTINCT ON (region_code, jibun, building_name)
        region_code,
        jibun,
        building_name,
        deposit       AS jeonse_deposit,
        contract_date AS jeonse_date,
        floor         AS jeonse_floor,
        area_m2       AS jeonse_area_m2
    FROM real_estate_rents
    WHERE contract_type = '전세'
    ORDER BY region_code, jibun, building_name, contract_date DESC NULLS LAST
)
SELECT
    s.region_code,
    s.jibun,
    s.building_name,
    s.build_year,
    s.location,

    -- 매매 정보
    s.deal_amount,
    s.deal_date,
    s.sale_floor,
    s.sale_area_m2,

    -- 전세 정보
    j.jeonse_deposit,
    j.jeonse_date,
    j.jeonse_floor,
    j.jeonse_area_m2,

    -- 갭 분석 지표
    (s.deal_amount - j.jeonse_deposit)                        AS gap_amount,      -- 차액 (만원)
    ROUND((j.jeonse_deposit::NUMERIC / NULLIF(s.deal_amount, 0)) * 100, 2)
                                                               AS jeonse_ratio    -- 전세가율 (%)
FROM latest_sale  s
JOIN latest_jeonse j
    ON  s.region_code   = j.region_code
    AND s.jibun         = j.jibun
    AND s.building_name = j.building_name;

-- ============================================================
-- 4) RLS (Row Level Security) 정책
--    공개 읽기 허용 (필요시 수정)
-- ============================================================
ALTER TABLE real_estate_rents  ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_estate_sales  ENABLE ROW LEVEL SECURITY;

-- 모든 사용자에게 SELECT 허용
CREATE POLICY "Allow public read on rents"
    ON real_estate_rents FOR SELECT
    USING (true);

CREATE POLICY "Allow public read on sales"
    ON real_estate_sales FOR SELECT
    USING (true);

-- ============================================================
-- 5) updated_at 자동 갱신 트리거
-- ============================================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_rents_updated_at
    BEFORE UPDATE ON real_estate_rents
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trg_sales_updated_at
    BEFORE UPDATE ON real_estate_sales
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
