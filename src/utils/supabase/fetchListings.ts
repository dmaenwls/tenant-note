import { createClient } from '@supabase/supabase-js';

// 1. 환경변수 로딩
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. 데이터 타입 정의
export interface Listing {
    id: string;
    price_deposit: number;
    price_monthly: number;
    building_name: string;
    safety_grade: string;
    lat: number;
    lng: number;
}

// 3. 데이터 가져오기 (가상 테이블 View 사용)
export const fetchListings = async (): Promise<Listing[]> => {
    // 여기가 바뀝니다! 'listings' -> 'listings_with_geo'
    const { data, error } = await supabase
        .from('listings_with_geo')
        .select('*') // 복잡한 수식 없이 깔끔하게!
        .limit(100);

    if (error) {
        console.error('Error fetching listings:', error);
        return [];
    }

    return data as Listing[];
};