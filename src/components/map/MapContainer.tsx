'use client';

import React, { useEffect, useState } from 'react';
import { Map, MapMarker, MarkerClusterer, CustomOverlayMap, useKakaoLoader } from 'react-kakao-maps-sdk';
import { fetchListings, Listing } from '@/utils/supabase/fetchListings';

const MapContainer = () => {
    useKakaoLoader({
        appkey: process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY!,
        libraries: ['clusterer', 'drawing', 'services'],
    });

    const [listings, setListings] = useState<Listing[]>([]);
    const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

    useEffect(() => {
        const loadListings = async () => {
            try {
                const data = await fetchListings();
                setListings(data);
            } catch (error) {
                console.error("Failed to load listings", error);
            }
        };
        loadListings();
    }, []);

    const formatPrice = (deposit: number, monthly: number) => {
        const depositUnit = 10000;
        let depositStr = '';
        if (deposit >= depositUnit) {
            const eok = Math.floor(deposit / depositUnit);
            const remainder = deposit % depositUnit;
            depositStr = `${eok}억${remainder > 0 ? ` ${remainder}` : ''}`;
        } else {
            depositStr = deposit.toString();
        }
        return `${depositStr}/${monthly}`;
    };

    return (
        <Map
            center={{ lat: 37.4979, lng: 127.0276 }}
            style={{ width: "100%", height: "100%" }}
            level={3}
        >
            <MarkerClusterer
                averageCenter={true}
                minLevel={10}
            >
                {listings.map((listing) => (
                    <MapMarker
                        key={listing.id}
                        position={{ lat: listing.lat, lng: listing.lng }}
                        onClick={() => setSelectedListing(listing)}
                    />
                ))}
            </MarkerClusterer>

            {selectedListing && (
                <CustomOverlayMap
                    position={{ lat: selectedListing.lat, lng: selectedListing.lng }}
                    yAnchor={1.5}
                >
                    <div className="bg-white p-3 rounded-lg shadow-xl border border-gray-100 relative min-w-[150px]">
                        <button
                            className="absolute top-1 right-2 text-gray-400 hover:text-gray-800 font-bold"
                            onClick={() => setSelectedListing(null)}
                        >
                            ×
                        </button>
                        <div className="font-bold text-gray-900 pr-5 mb-1">{selectedListing.building_name || '건물명 없음'}</div>
                        <div className="text-sm font-bold text-blue-600">
                            {formatPrice(selectedListing.price_deposit, selectedListing.price_monthly)}
                        </div>
                        <div className="mt-1">
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${selectedListing.safety_grade === 'A' ? 'bg-green-100 text-green-700' :
                                    selectedListing.safety_grade === 'B' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                }`}>
                                안전등급 {selectedListing.safety_grade}
                            </span>
                        </div>
                    </div>
                </CustomOverlayMap>
            )}
        </Map>
    );
};

export default MapContainer;
