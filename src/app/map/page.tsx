'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import MapContainer from '@/components/map/MapContainer';
import ListingDetailPanel from '@/components/map/ListingDetailPanel';

export default function MapPage() {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    return (
        <div className="relative w-full h-screen overflow-hidden">
            {/* Home Button */}
            <Link
                href="/"
                className="absolute top-4 left-4 z-40 bg-white px-4 py-2 rounded-lg shadow-md font-bold text-gray-700 hover:bg-gray-50 transition-colors border border-gray-100"
            >
                ← 홈으로
            </Link>

            {/* Map */}
            <MapContainer onListingSelect={setSelectedId} />

            {/* Panel */}
            <ListingDetailPanel listingId={selectedId} onClose={() => setSelectedId(null)} />
        </div>
    );
}
