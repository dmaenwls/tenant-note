-- ============================================================
-- 건물 단위 GROUP BY 조회 함수 (지도 마커용)
-- jibun + building_name 기준 DISTINCT ON → 최신 거래 대표 1건
-- Supabase SQL Editor에서 실행
-- ============================================================

-- 1) 매매: 건물별 최신 거래 대표 1건
CREATE OR REPLACE FUNCTION get_grouped_sales_in_bounds(
    min_lat DOUBLE PRECISION,
    max_lat DOUBLE PRECISION,
    min_lng DOUBLE PRECISION,
    max_lng DOUBLE PRECISION,
    max_rows INTEGER DEFAULT 5000
)
RETURNS TABLE (
    jibun          TEXT,
    building_name  TEXT,
    lat            DOUBLE PRECISION,
    lng            DOUBLE PRECISION,
    deal_amount    BIGINT,
    area_m2        NUMERIC(10,2),
    floor          INTEGER,
    deal_date      DATE,
    region_code    TEXT,
    build_year     INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (s.jibun, s.building_name)
        s.jibun,
        s.building_name,
        ST_Y(s.location::geometry)  AS lat,
        ST_X(s.location::geometry)  AS lng,
        s.deal_amount,
        s.area_m2,
        s.floor,
        s.deal_date,
        s.region_code,
        s.build_year
    FROM real_estate_sales s
    WHERE s.location IS NOT NULL
      AND ST_Y(s.location::geometry) >= min_lat
      AND ST_Y(s.location::geometry) <= max_lat
      AND ST_X(s.location::geometry) >= min_lng
      AND ST_X(s.location::geometry) <= max_lng
    ORDER BY s.jibun, s.building_name, s.deal_date DESC NULLS LAST
    LIMIT max_rows;
END;
$$ LANGUAGE plpgsql STABLE;


-- 2) 전월세: 건물별 최신 거래 대표 1건
CREATE OR REPLACE FUNCTION get_grouped_rents_in_bounds(
    min_lat DOUBLE PRECISION,
    max_lat DOUBLE PRECISION,
    min_lng DOUBLE PRECISION,
    max_lng DOUBLE PRECISION,
    max_rows INTEGER DEFAULT 5000
)
RETURNS TABLE (
    jibun          TEXT,
    building_name  TEXT,
    lat            DOUBLE PRECISION,
    lng            DOUBLE PRECISION,
    deposit        BIGINT,
    monthly_rent   BIGINT,
    contract_type  TEXT,
    area_m2        NUMERIC(10,2),
    floor          INTEGER,
    contract_date  DATE,
    region_code    TEXT,
    build_year     INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (r.jibun, r.building_name)
        r.jibun,
        r.building_name,
        ST_Y(r.location::geometry)  AS lat,
        ST_X(r.location::geometry)  AS lng,
        r.deposit,
        r.monthly_rent,
        r.contract_type,
        r.area_m2,
        r.floor,
        r.contract_date,
        r.region_code,
        r.build_year
    FROM real_estate_rents r
    WHERE r.location IS NOT NULL
      AND ST_Y(r.location::geometry) >= min_lat
      AND ST_Y(r.location::geometry) <= max_lat
      AND ST_X(r.location::geometry) >= min_lng
      AND ST_X(r.location::geometry) <= max_lng
    ORDER BY r.jibun, r.building_name, r.contract_date DESC NULLS LAST
    LIMIT max_rows;
END;
$$ LANGUAGE plpgsql STABLE;
