'use client';

import React from 'react';
import Link from 'next/link';

export default function GuidePage() {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center">
            <header className="absolute top-0 w-full p-4 flex justify-between items-center">
                <Link href="/" className="font-bold text-xl">Tenant Note</Link>
            </header>
            <h1 className="text-2xl font-bold text-gray-800">계약/이사 가이드 페이지 준비 중입니다.</h1>
            <Link href="/" className="mt-4 text-blue-600 hover:underline">홈으로 돌아가기</Link>
        </div>
    );
}
