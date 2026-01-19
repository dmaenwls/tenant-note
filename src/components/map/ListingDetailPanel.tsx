'use client';

import React, { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { getListingById, Listing } from '@/utils/supabase/fetchListings';

// Register Chart.js components
ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

interface ListingDetailPanelProps {
    listingId: string | null;
    onClose: () => void;
}

export default function ListingDetailPanel({ listingId, onClose }: ListingDetailPanelProps) {
    const [listing, setListing] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadListing = async () => {
            if (!listingId) {
                setListing(null);
                return;
            }
            setLoading(true);
            try {
                const data = await getListingById(listingId);
                setListing(data);
            } catch (error) {
                console.error("Failed to fetch detail:", error);
            } finally {
                setLoading(false);
            }
        };
        loadListing();
    }, [listingId]);

    interface ListingScore {
        security_safety: number;
        building: number;
        living_comfort: number;
        living_infra: number;
        traffic: number;
        environment: number;
    }

    const MOCK_LISTING_DATA: { scores: ListingScore; totalScore: number; grade: string } = {
        scores: {
            security_safety: 85,
            building: 40,
            living_comfort: 75,
            living_infra: 90,
            traffic: 60,
            environment: 70,
        },
        totalScore: 70, // Average of the above roughly
        grade: 'B',
    };

    // ... inside component ...

    // Chart Data (Use Structured Mock Data)
    const chartData = {
        labels: ['치안/안전', '건물', '주거쾌적', '생활인프라', '교통', '환경'],
        datasets: [
            {
                label: '안전 점수',
                data: [
                    MOCK_LISTING_DATA.scores.security_safety,
                    MOCK_LISTING_DATA.scores.building,
                    MOCK_LISTING_DATA.scores.living_comfort,
                    MOCK_LISTING_DATA.scores.living_infra,
                    MOCK_LISTING_DATA.scores.traffic,
                    MOCK_LISTING_DATA.scores.environment,
                ],
                backgroundColor: 'rgba(37, 99, 235, 0.2)', // Blue-600 transparent
                borderColor: '#2563eb', // Blue-600
                borderWidth: 2,
            },
        ],
    };

    const chartOptions = {
        scales: {
            r: {
                angleLines: { color: '#e5e7eb' },
                grid: { color: '#e5e7eb' },
                pointLabels: {
                    font: { size: 12, weight: 'bold' as const },
                    color: '#374151',
                },
                suggestedMin: 0,
                suggestedMax: 100,
            },
        },
        plugins: {
            legend: { display: false },
        },
    };

    // Helper for Price Format
    const formatPrice = (deposit: number, monthly: number) => {
        const eok = Math.floor(deposit / 10000);
        const man = deposit % 10000;
        const depositStr = `${eok > 0 ? `${eok}억` : ''} ${man > 0 ? man : ''}`.trim();
        return monthly > 0 ? `${depositStr || '0'} / ${monthly}` : depositStr;
    };

    const isVisible = !!listingId;

    return (
        <div
            className={`fixed right-0 top-0 h-full w-full md:w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col
            ${isVisible ? 'translate-x-0' : 'translate-x-full'}
            md:translate-y-0
            ${isVisible ? 'max-md:translate-y-0' : 'max-md:translate-y-full'}
            max-md:bottom-0 max-md:top-auto max-md:h-[85vh] max-md:rounded-t-2xl max-md:left-0 max-md:right-0
            `}
        >
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm max-md:rounded-t-2xl">
                <h2 className="text-lg font-bold text-gray-900">물건 상세 분석</h2>
                <button
                    onClick={onClose}
                    className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"
                    aria-label="Close"
                >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-4 pb-24">
                {loading ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : listing ? (
                    <div className="space-y-4">
                        {/* Basic Info Card */}
                        <section className="rounded-2xl bg-white p-6 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{listing.building_name || '이름 없는 건물'}</h1>
                                    <p className="text-gray-500 text-sm mt-1">서울시 관악구 신림동</p>
                                </div>
                                <span className={`rounded-lg px-3 py-1 text-sm font-bold text-white shadow-sm
                  ${listing.safety_grade === 'A' ? 'bg-green-500' :
                                        listing.safety_grade === 'B' ? 'bg-yellow-500' :
                                            listing.safety_grade === 'C' ? 'bg-orange-500' : 'bg-red-500'}`}>
                                    {listing.safety_grade}등급
                                </span>
                            </div>
                            <div className="mt-4 text-xl font-bold text-blue-600">
                                {formatPrice(listing.price_deposit, listing.price_monthly)}
                            </div>
                        </section>

                        {/* Radar Chart Section */}
                        <section className="rounded-2xl bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-bold text-gray-900">🛡️ 안전도 정밀 분석</h2>
                            <div className="relative aspect-square w-full">
                                <Radar data={chartData} options={chartOptions} />
                            </div>
                            <p className="mt-4 text-center text-sm text-gray-500 bg-gray-50 p-2 rounded-lg">
                                이 지역 평균보다 <strong>안전 점수가 15% 높습니다.</strong>
                            </p>
                        </section>

                        {/* SWOT Analysis */}
                        <section className="rounded-2xl bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-bold text-gray-900">📊 SWOT 분석</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-blue-50 p-4">
                                    <span className="block text-xs font-bold text-blue-500">STRENGTH</span>
                                    <p className="mt-1 font-bold text-gray-800">초역세권</p>
                                    <p className="text-xs text-gray-600">도보 3분 거리</p>
                                </div>
                                <div className="rounded-xl bg-red-50 p-4">
                                    <span className="block text-xs font-bold text-red-500">WEAKNESS</span>
                                    <p className="mt-1 font-bold text-gray-800">소음 주의</p>
                                    <p className="text-xs text-gray-600">대로변 인접</p>
                                </div>
                                <div className="rounded-xl bg-green-50 p-4">
                                    <span className="block text-xs font-bold text-green-500">OPPORTUNITY</span>
                                    <p className="mt-1 font-bold text-gray-800">개발 호재</p>
                                    <p className="text-xs text-gray-600">상권 발달 예정</p>
                                </div>
                                <div className="rounded-xl bg-gray-100 p-4">
                                    <span className="block text-xs font-bold text-gray-500">THREAT</span>
                                    <p className="mt-1 font-bold text-gray-800">노후화</p>
                                    <p className="text-xs text-gray-600">10년차 건물</p>
                                </div>
                            </div>
                        </section>
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-500">
                        데이터를 불러올 수 없습니다.
                    </div>
                )}
            </div>

            {/* Floating Footer - Only visible if listing exists */}
            {listing && (
                <footer className="absolute bottom-0 left-0 w-full border-t bg-white p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                    <div className="flex gap-3">
                        <button className="flex-1 rounded-xl bg-gray-100 py-3.5 font-bold text-gray-700 transition hover:bg-gray-200">
                            공유하기
                        </button>
                        <button className="flex-[2] rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg transition hover:bg-blue-700 hover:-translate-y-0.5">
                            집주인에게 문의하기
                        </button>
                    </div>
                </footer>
            )}
        </div>
    );
}
