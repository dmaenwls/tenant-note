import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase 서버사이드 클라이언트 생성
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;

    const minLat = parseFloat(searchParams.get('minLat') || '0');
    const maxLat = parseFloat(searchParams.get('maxLat') || '0');
    const minLng = parseFloat(searchParams.get('minLng') || '0');
    const maxLng = parseFloat(searchParams.get('maxLng') || '0');
    const zoom = parseInt(searchParams.get('zoom') || '15', 10);
    const type = searchParams.get('type') || 'sales';

    // 잘못된 좌표 요청 방어
    if ([minLat, maxLat, minLng, maxLng].some(Number.isNaN) || minLat === 0) {
        return NextResponse.json({ error: '유효한 좌표 파라미터가 필요합니다.' }, { status: 400 });
    }

    // 💡 DB에서 건물 단위 그룹핑 처리로 성능 최적화 완료 → 줌 레벨 제한 해제
    const limit = 10000; // 관악구 전체 데이터를 한 번에 가져오기 충분한 양

    // 호출할 함수 이름 매핑
    const rpcName = type === 'sales' ? 'get_grouped_sales_in_bounds' : 'get_grouped_rents_in_bounds';

    try {
        const { data, error } = await supabase.rpc(rpcName, {
            min_lat: minLat,
            max_lat: maxLat,
            min_lng: minLng,
            max_lng: maxLng,
            max_rows: limit
        });

        if (error) {
            console.error('🔥 [API RPC Error]:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            type,
            zoom,
            limit,
            total: data?.length || 0,
            listings: data || [],
        });

    } catch (err: any) {
        console.error('🔥 [API Server Error]:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}