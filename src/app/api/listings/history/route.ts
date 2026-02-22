import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ── Supabase 클라이언트 (서버사이드) ──
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ListingType = 'sales' | 'rent';

const TABLE_MAP: Record<ListingType, string> = {
    sales: 'real_estate_sales',
    rent: 'real_estate_rents',
};

// 🔥 수정 1: 매매 테이블도 deal_date가 아닌 contract_date로 정렬
const DATE_COL: Record<ListingType, string> = {
    sales: 'contract_date',
    rent: 'contract_date',
};

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;

    const jibun = searchParams.get('jibun');
    const type = (searchParams.get('type') || 'sales') as ListingType;
    const buildingName = searchParams.get('building_name');

    if (!jibun) {
        return NextResponse.json({ error: 'jibun 파라미터가 필요합니다.' }, { status: 400 });
    }

    if (!TABLE_MAP[type]) {
        return NextResponse.json({ error: "type은 'sales' 또는 'rent'만 가능합니다." }, { status: 400 });
    }

    try {
        // 🔥 수정 2: area_m2 대신 대표님 DB에 맞는 area_exclusive 사용
        const commonCols = 'id, jibun, building_name, floor, build_year, area_exclusive';

        // 🔥 수정 3: 매매일 때 deal_date 대신 contract_date 사용
        const typeCols =
            type === 'sales'
                ? 'deal_amount, contract_date'
                : 'deposit, monthly_rent, contract_type, contract_date';

        let query = supabase
            .from(TABLE_MAP[type])
            .select(`${commonCols}, ${typeCols}`)
            .eq('jibun', jibun)
            .order(DATE_COL[type], { ascending: false })
            .limit(100);

        if (buildingName) {
            query = query.eq('building_name', buildingName);
        }

        const { data, error } = await query;

        if (error) {
            console.error('🔥 [history API] 쿼리 에러:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            jibun,
            type,
            building_name: buildingName,
            total: data?.length ?? 0,
            history: data ?? [],
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal Server Error';
        console.error('🔥 [history API] 서버 에러:', err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}