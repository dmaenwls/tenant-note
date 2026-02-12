import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const minLat = parseFloat(searchParams.get('minLat') || '0');
    const maxLat = parseFloat(searchParams.get('maxLat') || '0');
    const minLng = parseFloat(searchParams.get('minLng') || '0');
    const maxLng = parseFloat(searchParams.get('maxLng') || '0');

    // 유효성 검사
    if (minLat === 0 && maxLat === 0 && minLng === 0 && maxLng === 0) {
        return NextResponse.json(
            { error: 'bounds 파라미터(minLat, maxLat, minLng, maxLng)가 필요합니다.' },
            { status: 400 }
        );
    }

    try {
        // PostGIS RPC 함수 호출 (002_get_rents_in_bounds.sql 에서 생성)
        const { data, error } = await supabase.rpc('get_rents_in_bounds', {
            min_lat: minLat,
            max_lat: maxLat,
            min_lng: minLng,
            max_lng: maxLng,
        });

        if (error) {
            console.error('🔥 [listings API] PostGIS RPC 에러:', error);
            throw error;
        }

        return NextResponse.json({
            total: data?.length || 0,
            listings: data || [],
        });
    } catch (error: any) {
        console.error('🔥 [listings API] 서버 에러:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
