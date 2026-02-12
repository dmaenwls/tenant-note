-- ============================================================
-- PostGIS RPC: 지도 범위 내 전월세 데이터 조회
-- Supabase SQL Editor에서 실행
-- ============================================================

-- 1) real_estate_rents 범위 조회 함수
CREATE OR REPLACE FUNCTION get_rents_in_bounds(
    min_lat DOUBLE PRECISION,
    max_lat DOUBLE PRECISION,
    min_lng DOUBLE PRECISION,
    max_lng DOUBLE PRECISION
)
RETURNS TABLE (
    id            UUID,
    region_code   TEXT,
    building_name TEXT,
    jibun         TEXT,
    floor         INTEGER,
    build_year    INTEGER,
    area_m2       NUMERIC(10,2),
    deposit       BIGINT,
    monthly_rent  BIGINT,
    contract_type TEXT,
    contract_date DATE,
    lat           DOUBLE PRECISION,
    lng           DOUBLE PRECISION
) AS $$
    SELECT
        r.id,
        r.region_code,
        r.building_name,
        r.jibun,
        r.floor,
        r.build_year,
        r.area_m2,
        r.deposit,
        r.monthly_rent,
        r.contract_type,
        r.contract_date,
        ST_Y(r.location::geometry) AS lat,
        ST_X(r.location::geometry) AS lng
    FROM real_estate_rents r
    WHERE r.location IS NOT NULL
      AND r.location && ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)::geography
    ORDER BY r.contract_date DESC NULLS LAST
    LIMIT 500;
$$ LANGUAGE sql STABLE;
