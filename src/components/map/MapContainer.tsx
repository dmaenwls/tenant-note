'use client';

import { useEffect, useState } from 'react';
import { Map, MapMarker, MarkerClusterer, CustomOverlayMap, useKakaoLoader } from 'react-kakao-maps-sdk';
import { useRouter } from 'next/navigation';
import { fetchListings, Listing } from '@/utils/supabase/fetchListings';

// 1. Grade Colors (Tailwind Match)
const GRADE_COLORS: Record<string, string> = {
    A: '#22c55e', // Green-500
    B: '#eab308', // Yellow-500
    C: '#f97316', // Orange-500
    D: '#ef4444', // Red-500
    default: '#3b82f6' // Blue-500
};

// 2. Price Formatter (Korean Format: 1억 5000)
const formatPrice = (deposit: number, monthly: number) => {
    const eok = Math.floor(deposit / 10000);
    const man = deposit % 10000;
    let depositStr = '';

    if (eok > 0) depositStr += `${eok}억`;
    if (man > 0) depositStr += ` ${man.toLocaleString()}`;
    if (deposit === 0) depositStr = '0';

    return monthly > 0 ? `${depositStr} / ${monthly}` : depositStr;
};

export default function MapContainer({ onListingSelect }: { onListingSelect?: (id: string) => void }) {
    // 3. Load Kakao Maps SDK
    useKakaoLoader({
        appkey: process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY!,
        libraries: ['clusterer', 'services'],
    });

    const router = useRouter();
    const [listings, setListings] = useState<Listing[]>([]);
    const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

    useEffect(() => {
        const loadListings = async () => {
            try {
                const data = await fetchListings();
                setListings(data);
            } catch (error) {
                console.error("Failed to fetch listings:", error);
            }
        };
        loadListings();
    }, []);

    return (
        <div className="w-full h-screen">
            <Map
                center={{ lat: 37.4979, lng: 127.0276 }} // Gangnam Station Center
                style={{ width: '100%', height: '100%' }}
                level={3}
                onClick={() => setSelectedListing(null)}
            >
                <MarkerClusterer
                    averageCenter={true}
                    minLevel={6}
                >
                    {listings.map((listing) => (
                        <MapMarker
                            key={listing.id}
                            position={{ lat: listing.lat, lng: listing.lng }}
                            // 4. Custom SVG Marker Logic
                            image={{
                                src: `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='${encodeURIComponent(GRADE_COLORS[listing.safety_grade] || GRADE_COLORS.default)}' width='24' height='24'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z'/%3E%3C/svg%3E`,
                                size: { width: 30, height: 30 },
                            }}
                            onClick={() => setSelectedListing(listing)}
                        />
                    ))}
                </MarkerClusterer>

                {/* 5. Custom Overlay */}
                {selectedListing && (
                    <CustomOverlayMap
                        position={{ lat: selectedListing.lat, lng: selectedListing.lng }}
                        yAnchor={1.2}
                        zIndex={3}
                        clickable={true} // [Critical] Enables interaction inside overlay
                    >
                        <div className="bg-white rounded-xl shadow-2xl p-4 min-w-[240px] relative border border-gray-100 flex flex-col gap-2 transition-all animation-fade-in pointer-events-auto">

                            {/* Close Button */}
                            <button
                                type="button"
                                className="absolute top-3 right-3 text-gray-400 hover:text-gray-800 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedListing(null);
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Listing Info */}
                            <div className="flex flex-col">
                                <h3 className="font-bold text-gray-900 text-lg leading-tight pr-6">
                                    {selectedListing.building_name || '이름 없는 건물'}
                                </h3>
                                <p className="text-gray-500 text-xs mt-0.5">서울시 관악구 신림동 (임시주소)</p>
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                                <span
                                    className="px-2 py-0.5 rounded text-xs font-bold text-white shadow-sm"
                                    style={{ backgroundColor: GRADE_COLORS[selectedListing.safety_grade] || GRADE_COLORS.default }}
                                >
                                    {selectedListing.safety_grade}등급
                                </span>
                                <span className="text-base font-bold text-gray-800">
                                    {formatPrice(selectedListing.price_deposit, selectedListing.price_monthly)}
                                </span>
                            </div>

                            {/* Navigation Button (SPA) */}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation(); // Stop bubbling to map
                                    if (onListingSelect) {
                                        onListingSelect(selectedListing.id);
                                    } else {
                                        router.push(`/analysis/${selectedListing.id}`); // Keep fallback
                                    }
                                }}
                                className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center shadow-md cursor-pointer z-50 pointer-events-auto"
                            >
                                상세 분석 리포트 보기 →
                            </button>

                            {/* Tail Arrow */}
                            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b border-gray-100 shadow-[2px_2px_2px_-1px_rgba(0,0,0,0.1)]"></div>
                        </div>
                    </CustomOverlayMap>
                )}
            </Map>
        </div>
    );
}
