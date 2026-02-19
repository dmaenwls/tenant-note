import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ── Supabase 클라이언트 (서버사이드) ──
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── 허용 타입 & View 매핑 ──
type ListingType = 'sales' | 'rent';

const VIEW_MAP: Record<ListingType, string> = {
    sales: 'view_sales',
    rent: 'view_rents',
};

/**
 * GET /api/listings?minLat=&maxLat=&minLng=&maxLng=&zoom=&type=sales|rent
 *
 * 지도 Bounds 내 매물 목록을 반환합니다.
 * - type=sales → view_sales (매매)
 * - type=rent  → view_rents (전월세)
 */
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;

    // ── 1. 파라미터 파싱 ──
    const minLat = parseFloat(searchParams.get('minLat') || '');
    const maxLat = parseFloat(searchParams.get('maxLat') || '');
    const minLng = parseFloat(searchParams.get('minLng') || '');
    const maxLng = parseFloat(searchParams.get('maxLng') || '');
    const zoom = parseInt(searchParams.get('zoom') || '15', 10);
    const type = (searchParams.get('type') || 'sales') as ListingType;

    // ── 2. 유효성 검사 ──
    if ([minLat, maxLat, minLng, maxLng].some(Number.isNaN)) {
        return NextResponse.json(
            { error: 'bounds 파라미터(minLat, maxLat, minLng, maxLng)가 필요합니다.' },
            { status: 400 }
        );
    }

    if (!VIEW_MAP[type]) {
        return NextResponse.json(
            { error: "type은 'sales' 또는 'rent'만 가능합니다." },
            { status: 400 }
        );
    }

    // ── 3. 줌 레벨에 따른 limit 조정 (선택) ──
    // 높은 줌(확대)일수록 더 많은 마커 표시, 낮은 줌은 적게
    const limit = zoom >= 17 ? 200 : zoom >= 15 ? 150 : zoom >= 13 ? 100 : 50;

    try {
        // ── 4. Supabase View 조회 (lat/lng 기반 범위 필터) ──
        const { data, error } = await supabase
            .from(VIEW_MAP[type])
            .select('id, deal_amount, deposit, monthly_rent, area_exclusive, building_name, floor, lat, lng')
            .gte('lat', minLat)
            .lte('lat', maxLat)
            .gte('lng', minLng)
            .lte('lng', maxLng)
            .limit(limit);

        if (error) {
            console.error('🔥 [listings API] 쿼리 에러:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            type,
            zoom,
            limit,
            total: data?.length ?? 0,
            listings: data ?? [],
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal Server Error';
        console.error('🔥 [listings API] 서버 에러:', err);
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}

