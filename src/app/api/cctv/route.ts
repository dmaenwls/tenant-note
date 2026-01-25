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

    try {
        // 1. 데이터 조회 (컬럼명 유연성 확보를 위해 * 조회)
        // 위경도 컬럼 이름을 모를 수 있으므로 범위 조건을 잠시 끄고 limit으로 가져오거나, 
        // 혹은 확실한 컬럼명을 안다면 그 컬럼으로 필터링해야 함. 
        // 여기서는 사용자가 'lat', 'lng'으로 올렸다고 가정하되, 실패 시 로그를 띄움.

        let { data, error } = await supabase
            .from('cctv')
            .select('*')
            .gte('lat', minLat)  // 만약 DB 컬럼이 latitude라면 이 부분을 latitude로 바꿔야 함
            .lte('lat', maxLat)
            .gte('lng', minLng)
            .lte('lng', maxLng)
            .limit(2000);

        if (error) {
            console.error("DB Query Error:", error);
            // 만약 lat 컬럼이 없다는 에러라면, latitude나 WGS84위도 등으로 재시도하는 로직이 필요할 수 있음
            throw error;
        }

        // 2. 데이터 매핑 (프론트엔드가 'lat', 'lng'을 기대함)
        const mappedData = data?.map((item: any) => ({
            ...item,
            lat: item.lat || item.latitude || item.WGS84위도 || item.위도,
            lng: item.lng || item.longitude || item.WGS84경도 || item.경도,
            address: item.address || item.road_address || item.지번주소 || '주소 미상'
        })) || [];

        return NextResponse.json({ total: mappedData.length, features: mappedData });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}