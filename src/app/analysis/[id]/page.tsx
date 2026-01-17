'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

// 1. Register Chart.js components
ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

export default function AnalysisPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [listing, setListing] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);

    // 2. Fetch Data
    useEffect(() => {
        const loadListing = async () => {
            if (!params.id) return;
            try {
                const data = await getListingById(params.id);
                setListing(data);
            } catch (error) {
                console.error("Failed to fetch detail:", error);
            } finally {
                setLoading(false);
            }
        };
        loadListing();
    }, [params.id]);

    if (loading) return <div className="flex h-screen items-center justify-center">분석 리포트 생성 중...</div>;
    if (!listing) return <div className="flex h-screen items-center justify-center">데이터를 찾을 수 없습니다.</div>;

    // 3. Chart Data (Random for Demo)
    const chartData = {
        labels: ['치안', '건물', '교통', '인프라', '환경', '쾌적'],
        datasets: [
            {
                label: '종합 안전 점수',
                data: Array.from({ length: 6 }, () => Math.floor(Math.random() * (100 - 60 + 1)) + 60),
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

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <header className="sticky top-0 z-10 flex cursor-pointer items-center justify-between border-b bg-white px-4 py-3 shadow-sm" onClick={() => router.back()}>
                <button className="flex items-center gap-1 text-gray-500 hover:text-gray-900">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="font-medium">뒤로 가기</span>
                </button>
            </header>

            <main className="mx-auto max-w-lg space-y-4 p-4">
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
            </main>

            {/* Floating Footer */}
            <footer className="fixed bottom-0 left-0 w-full border-t bg-white p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <div className="mx-auto flex max-w-lg gap-3">
                    <button className="flex-1 rounded-xl bg-gray-100 py-3.5 font-bold text-gray-700 transition hover:bg-gray-200">
                        공유하기
                    </button>
                    <button className="flex-[2] rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg transition hover:bg-blue-700 hover:-translate-y-0.5">
                        집주인에게 문의하기
                    </button>
                </div>
            </footer>
        </div>
    );
}
