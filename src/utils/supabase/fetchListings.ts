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

// 1. [지도용] 모든 매물 가져오기 (이게 없어서 지도가 안 떴던 겁니다!)
export const fetchListings = async (): Promise<Listing[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('listings_with_geo')
        .select('*');

    if (error) {
        console.error('Error fetching listings:', error);
        return [];
    }
    return data as Listing[];
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
    return data as Listing;
};