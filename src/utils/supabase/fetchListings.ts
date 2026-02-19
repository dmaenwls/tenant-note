import { createClient } from '@/utils/supabase/client';

export interface Listing {
    id: string;
    building_name: string;
    lat: number;
    lng: number;
    price_deposit: number;
    price_monthly: number;
    safety_grade: string;
    // 필요한 경우 추가 필드 정의
}

/**
 * PostGIS WKB(Hex) → { lng, lat } 파서
 * Supabase PostgREST는 geography/geometry 컬럼을 WKB Hex 문자열로 반환하므로,
 * 클라이언트에서 직접 파싱하여 lat/lng 숫자로 변환한다.
 *
 * WKB Point (Little-Endian) 구조:
 *   Byte 0     : Endianness (01 = LE)
 *   Bytes 1-4  : Type (01000020 = Point with SRID, LE)
 *   Bytes 5-8  : SRID (E6100000 = 4326, LE)
 *   Bytes 9-16 : X (lng) as Float64 LE
 *   Bytes 17-24: Y (lat) as Float64 LE
 */
function parseWkbPoint(hex: string): { lat: number; lng: number } | null {
    if (!hex || typeof hex !== 'string') return null;

    try {
        // EWKB with SRID: 01 0100 0020 E6100000 + 16 bytes (X) + 16 bytes (Y) = 50 hex chars
        // Standard WKB:   01 01000000 + 16 bytes (X) + 16 bytes (Y) = 42 hex chars
        let offset = 0;

        // Byte 0: endianness
        const endian = hex.substring(0, 2);
        offset = 2;

        // Bytes 1-4: geometry type (4 bytes = 8 hex chars)
        const typeHex = hex.substring(offset, offset + 8);
        offset += 8;

        // Check if SRID flag is set (type & 0x20000000 for LE, or type starts with '0020' for BE)
        // In LE, type 0x20000001 is stored as '01000020'
        const typeVal = parseInt(
            typeHex.match(/../g)!.reverse().join(''),
            16
        );
        const hasSRID = (typeVal & 0x20000000) !== 0;

        if (hasSRID) {
            // Skip 4-byte SRID (8 hex chars)
            offset += 8;
        }

        // Read X (lng) — 8 bytes = 16 hex chars, Float64 LE
        const xHex = hex.substring(offset, offset + 16);
        offset += 16;

        // Read Y (lat) — 8 bytes = 16 hex chars, Float64 LE
        const yHex = hex.substring(offset, offset + 16);

        const toFloat64 = (h: string): number => {
            const bytes = h.match(/../g)!.map(b => parseInt(b, 16));
            if (endian === '01') bytes.reverse(); // LE → BE for DataView
            const buf = new ArrayBuffer(8);
            const view = new DataView(buf);
            bytes.forEach((b, i) => view.setUint8(i, b));
            return view.getFloat64(0);
        };

        const lng = toFloat64(xHex);
        const lat = toFloat64(yHex);

        // 유효성 체크
        if (isNaN(lat) || isNaN(lng)) return null;

        return { lat, lng };
    } catch {
        return null;
    }
}

/**
 * Supabase 로우 데이터에 lat/lng를 추가한다.
 * - 이미 lat/lng가 숫자로 있으면 그대로 사용
 * - location 컬럼이 WKB hex 문자열이면 파싱하여 lat/lng 추출
 */
function enrichWithLatLng<T extends Record<string, any>>(row: T): T & { lat: number; lng: number } {
    // 이미 숫자형 lat/lng가 있으면 그대로 반환
    if (typeof row.lat === 'number' && typeof row.lng === 'number') {
        return row as T & { lat: number; lng: number };
    }

    // location 컬럼에서 WKB 파싱 시도
    if (row.location && typeof row.location === 'string') {
        const parsed = parseWkbPoint(row.location);
        if (parsed) {
            const { location: _loc, ...rest } = row; // location 필드 제거
            return { ...rest, lat: parsed.lat, lng: parsed.lng } as T & { lat: number; lng: number };
        }
    }

    // 파싱 실패 시 기본값
    return { ...row, lat: row.lat ?? 0, lng: row.lng ?? 0 } as T & { lat: number; lng: number };
}

// 1. [지도용] 모든 매물 가져오기
export const fetchListings = async (): Promise<Listing[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('listings_with_geo')
        .select('*');

    if (error) {
        console.error('Error fetching listings:', error);
        return [];
    }

    return (data ?? []).map(enrichWithLatLng) as Listing[];
};

// 2. [상세페이지용] 특정 매물 하나만 가져오기
export const getListingById = async (id: string): Promise<Listing | null> => {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('listings_with_geo')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error(`Error fetching listing ${id}:`, error);
        return null;
    }
    return data ? enrichWithLatLng(data) as Listing : null;
};