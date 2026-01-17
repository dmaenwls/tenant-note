"use client";

import React, { useState } from "react";
import Link from "next/link";
import ReviewModal from "./ReviewModal";

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-md">
                <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link href="/" className="flex flex-col leading-none group">
                        <div className="flex items-center gap-1.5">
                            <span className="text-2xl font-black text-blue-600 tracking-tight group-hover:scale-105 transition-transform">
                                Tenant Note
                            </span>
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                                Beta
                            </span>
                        </div>
                        <span className="text-xs font-medium text-gray-400 mt-1.5 tracking-wide">
                            세입자를 위한 안전 지킴이
                        </span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-10">
                        <Link
                            href="/map"
                            className="group flex flex-col items-center justify-center gap-1 py-2"
                        >
                            <span className="text-lg font-bold text-gray-800 transition group-hover:text-blue-600">
                                동네 분석
                            </span>
                            <span className="text-xs font-medium text-gray-500 transition group-hover:text-blue-500">
                                여기 살기 어때요?
                            </span>
                        </Link>
                        <Link
                            href="/analysis"
                            className="group flex flex-col items-center justify-center gap-1 py-2"
                        >
                            <span className="text-lg font-bold text-gray-800 transition group-hover:text-blue-600">
                                물건 분석
                            </span>
                            <span className="text-xs font-medium text-gray-500 transition group-hover:text-blue-500">
                                여기 계약해도 될까?
                            </span>
                        </Link>
                        <Link
                            href="/guide"
                            className="group flex flex-col items-center justify-center gap-1 py-2"
                        >
                            <span className="text-lg font-bold text-gray-800 transition group-hover:text-blue-600">
                                계약/이사 가이드
                            </span>
                            <span className="text-xs font-medium text-gray-500 transition group-hover:text-blue-500">
                                이제 뭘 해야 하지?
                            </span>
                        </Link>
                        <Link
                            href="/community"
                            className="group flex flex-col items-center justify-center gap-1 py-2"
                        >
                            <span className="text-lg font-bold text-gray-800 transition group-hover:text-blue-600">
                                테넌트 라운지
                            </span>
                            <span className="text-xs font-medium text-gray-500 transition group-hover:text-blue-500">
                                나랑 같은 고민 상담
                            </span>
                        </Link>
                        <Link
                            href="/insight"
                            className="group flex flex-col items-center justify-center gap-1 py-2"
                        >
                            <span className="text-lg font-bold text-gray-800 transition group-hover:text-blue-600">
                                인사이트
                            </span>
                            <span className="text-xs font-medium text-gray-500 transition group-hover:text-blue-500">
                                전문가의 팩트체크
                            </span>
                        </Link>
                    </nav>

                    <div className="hidden md:flex items-center gap-4">
                        <button className="text-base font-semibold text-gray-500 hover:text-gray-900 transition">
                            로그인
                        </button>
                        <button
                            onClick={() => setModalOpen(true)}
                            className="rounded-xl bg-blue-600 px-5 py-2.5 text-base font-bold text-white shadow-lg hover:bg-blue-500 transition hover:-translate-y-0.5"
                        >
                            후기 남기기
                        </button>
                    </div>

                    <button
                        id="mobile-menu-btn"
                        className="md:hidden p-2 text-gray-600 hover:text-blue-600 focus:outline-none"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <svg
                            className="h-8 w-8"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 6h16M4 12h16M4 18h16"
                            ></path>
                        </svg>
                    </button>
                </div>

                {mobileMenuOpen && (
                    <div
                        id="mobile-menu"
                        className="md:hidden border-t border-gray-100 bg-white"
                    >
                        <div className="space-y-1 px-4 py-6">
                            <Link
                                href="/map"
                                className="block rounded-lg px-4 py-3 text-base font-bold text-gray-800 hover:bg-blue-50 hover:text-blue-600"
                            >
                                동네 분석{" "}
                                <span className="ml-2 text-xs font-normal text-gray-500">
                                    여기 살기 어때요?
                                </span>
                            </Link>
                            <Link
                                href="/analysis"
                                className="block rounded-lg px-4 py-3 text-base font-bold text-gray-800 hover:bg-blue-50 hover:text-blue-600"
                            >
                                물건 분석{" "}
                                <span className="ml-2 text-xs font-normal text-gray-500">
                                    여기 계약해도 될까?
                                </span>
                            </Link>
                            <Link
                                href="/guide"
                                className="block rounded-lg px-4 py-3 text-base font-bold text-gray-800 hover:bg-blue-50 hover:text-blue-600"
                            >
                                계약/이사 가이드{" "}
                                <span className="ml-2 text-xs font-normal text-gray-500">
                                    이제 뭘 해야 하지?
                                </span>
                            </Link>
                            <Link
                                href="/community"
                                className="block rounded-lg px-4 py-3 text-base font-bold text-gray-800 hover:bg-blue-50 hover:text-blue-600"
                            >
                                테넌트 라운지{" "}
                                <span className="ml-2 text-xs font-normal text-gray-500">
                                    나랑 같은 고민 상담
                                </span>
                            </Link>
                            <Link
                                href="/insight"
                                className="block rounded-lg px-4 py-3 text-base font-bold text-gray-800 hover:bg-blue-50 hover:text-blue-600"
                            >
                                인사이트{" "}
                                <span className="ml-2 text-xs font-normal text-gray-500">
                                    전문가의 팩트체크
                                </span>
                            </Link>

                            <div className="mt-6 border-t border-gray-100 pt-6">
                                <Link
                                    href="#"
                                    className="block w-full rounded-lg bg-gray-100 px-4 py-3 text-center text-base font-bold text-gray-600 hover:bg-gray-200"
                                >
                                    로그인
                                </Link>
                                <button
                                    onClick={() => setModalOpen(true)}
                                    className="mt-3 block w-full rounded-lg bg-blue-600 px-4 py-3 text-center text-base font-bold text-white hover:bg-blue-500"
                                >
                                    후기 남기기
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            <ReviewModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
        </>
    );
}
