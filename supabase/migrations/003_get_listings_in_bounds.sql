-- ============================================================
-- Bounds-based listing queries (lat/lng range comparison)
-- PostGIS 함수로 geography → lat/lng 추출 후 범위 필터
-- ============================================================

-- 1) 매매 (real_estate_sales) 범위 조회
CREATE OR REPLACE FUNCTION get_sales_in_bounds(
    min_lat DOUBLE PRECISION,
    max_lat DOUBLE PRECISION,
    min_lng DOUBLE PRECISION,
    max_lng DOUBLE PRECISION,
    max_rows INTEGER DEFAULT 200
)
RETURNS TABLE (
    id            UUID,
    lat           DOUBLE PRECISION,
    lng           DOUBLE PRECISION,
    building_name TEXT,
    deal_amount   BIGINT,
    area_m2       NUMERIC(10,2),
    floor         INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        ST_Y(s.location::geometry)  AS lat,
        ST_X(s.location::geometry)  AS lng,
        s.building_name,
        s.deal_amount,
        s.area_m2,
        s.floor
    FROM real_estate_sales s
    WHERE s.location IS NOT NULL
      AND ST_Y(s.location::geometry) >= min_lat
      AND ST_Y(s.location::geometry) <= max_lat
      AND ST_X(s.location::geometry) >= min_lng
      AND ST_X(s.location::geometry) <= max_lng
    ORDER BY s.deal_date DESC NULLS LAST
    LIMIT max_rows;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2) 전월세 (real_estate_rents) 범위 조회
CREATE OR REPLACE FUNCTION get_rents_in_bounds(
    min_lat DOUBLE PRECISION,
    max_lat DOUBLE PRECISION,
    min_lng DOUBLE PRECISION,
    max_lng DOUBLE PRECISION,
    max_rows INTEGER DEFAULT 200
)
RETURNS TABLE (
    id            UUID,
    lat           DOUBLE PRECISION,
    lng           DOUBLE PRECISION,
    building_name TEXT,
    deposit       BIGINT,
    monthly_rent  BIGINT,
    contract_type TEXT,
    area_m2       NUMERIC(10,2),
    floor         INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        ST_Y(r.location::geometry)  AS lat,
        ST_X(r.location::geometry)  AS lng,
        r.building_name,
        r.deposit,
        r.monthly_rent,
        r.contract_type,
        r.area_m2,
        r.floor
    FROM real_estate_rents r
    WHERE r.location IS NOT NULL
      AND ST_Y(r.location::geometry) >= min_lat
      AND ST_Y(r.location::geometry) <= max_lat
      AND ST_X(r.location::geometry) >= min_lng
      AND ST_X(r.location::geometry) <= max_lng
    ORDER BY r.contract_date DESC NULLS LAST
    LIMIT max_rows;
END;
$$ LANGUAGE plpgsql STABLE;
