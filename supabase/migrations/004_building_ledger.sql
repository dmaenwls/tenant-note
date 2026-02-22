-- ============================================================
-- 건축물대장(Building Ledger) 테이블 & 실거래가 매핑 뷰
-- Supabase SQL Editor에서 실행
-- ============================================================

-- ============================================================
-- 1) building_ledger 테이블
--    건축물대장 API 데이터를 적재하며,
--    (region_code, jibun)을 복합 PK로 사용하여
--    기존 real_estate_sales / real_estate_rents와 JOIN
-- ============================================================
CREATE TABLE IF NOT EXISTS building_ledger (
    region_code    TEXT        NOT NULL,              -- 법정동 코드
    jibun          TEXT        NOT NULL,              -- 지번
    bld_nm         TEXT,                              -- 건물명
    main_purps     TEXT,                              -- 주용도 (예: 공동주택, 단독주택)
    vl_rat         NUMERIC(6,2),                      -- 용적률 (%)
    bc_rat         NUMERIC(6,2),                      -- 건폐율 (%)
    use_apr_day    DATE,                              -- 사용승인일 (노후도 계산용)
    tot_pkng_cnt   INTEGER      DEFAULT 0,            -- 총 주차대수
    viol_bld_yn    TEXT         DEFAULT 'N',          -- 위반건축물 여부 ('Y' | 'N')

    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),

    PRIMARY KEY (region_code, jibun)
);

-- 조회 성능용 인덱스
CREATE INDEX IF NOT EXISTS idx_building_ledger_jibun
    ON building_ledger (jibun);

CREATE INDEX IF NOT EXISTS idx_building_ledger_main_purps
    ON building_ledger (main_purps);

-- updated_at 자동 갱신 트리거
CREATE TRIGGER trg_building_ledger_updated_at
    BEFORE UPDATE ON building_ledger
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();


-- ============================================================
-- 2) view_sales  (매매 + 건축물대장 LEFT JOIN)
--    기존 API route.ts에서 참조하는 뷰를 정식 생성
--    building_ledger의 상세 정보를 함께 반환
-- ============================================================
DROP VIEW IF EXISTS view_sales;
CREATE OR REPLACE VIEW view_sales AS
SELECT
    s.id,
    s.region_code,
    s.jibun,
    s.building_name,
    s.floor,
    s.build_year,
    s.area_m2,
    s.deal_amount,
    s.deal_date,
    s.location,
    ST_Y(s.location::geometry)  AS lat,
    ST_X(s.location::geometry)  AS lng,

    -- 건축물대장 정보
    bl.bld_nm,
    bl.main_purps,
    bl.vl_rat,
    bl.bc_rat,
    bl.use_apr_day,
    bl.tot_pkng_cnt,
    bl.viol_bld_yn
FROM real_estate_sales s
LEFT JOIN building_ledger bl
    ON  s.region_code = bl.region_code
    AND s.jibun       = bl.jibun
WHERE s.location IS NOT NULL;


-- ============================================================
-- 3) view_rents  (전월세 + 건축물대장 LEFT JOIN)
-- ============================================================
DROP VIEW IF EXISTS view_rents;
CREATE OR REPLACE VIEW view_rents AS
SELECT
    r.id,
    r.region_code,
    r.jibun,
    r.building_name,
    r.floor,
    r.build_year,
    r.area_m2,
    r.deposit,
    r.monthly_rent,
    r.contract_type,
    r.contract_date,
    r.location,
    ST_Y(r.location::geometry)  AS lat,
    ST_X(r.location::geometry)  AS lng,

    -- 건축물대장 정보
    bl.bld_nm,
    bl.main_purps,
    bl.vl_rat,
    bl.bc_rat,
    bl.use_apr_day,
    bl.tot_pkng_cnt,
    bl.viol_bld_yn
FROM real_estate_rents r
LEFT JOIN building_ledger bl
    ON  r.region_code = bl.region_code
    AND r.jibun       = bl.jibun
WHERE r.location IS NOT NULL;
