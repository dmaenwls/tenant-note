"use client";

import React, { useState } from "react";

export default function ReviewModal({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-end md:items-center justify-center animate-fade-in-up"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl p-6 shadow-2xl animate-fade-in-up">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900">
                        살아본 집의 찐후기를 들려주세요!
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <i className="fa-solid fa-xmark text-2xl"></i>
                    </button>
                </div>

                <div className="space-y-4">
                    {/* 1. Address Search */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">
                            어디에 사셨나요?
                        </label>
                        <div className="relative">
                            <i className="fa-solid fa-magnifying-glass absolute left-4 top-3.5 text-slate-400"></i>
                            <input
                                type="text"
                                placeholder="도로명 주소나 건물명 검색"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-colors"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* 2. Period */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">
                            거주 기간
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500">
                                <option>2024년</option>
                                <option>2023년</option>
                                <option>2022년</option>
                                <option>2021년 이전</option>
                            </select>
                            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500">
                                <option>1년 미만</option>
                                <option>1년</option>
                                <option>2년 이상</option>
                            </select>
                        </div>
                    </div>

                    {/* 3. Rating */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">
                            이 집의 총점은?
                        </label>
                        <div className="flex gap-2 justify-center py-4 bg-slate-50 rounded-xl border border-slate-200">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <i
                                    key={i}
                                    className="fa-solid fa-star text-3xl text-gray-300 cursor-pointer hover:text-yellow-400"
                                    onClick={(e) => {
                                        e.currentTarget.classList.toggle("text-yellow-400");
                                        e.currentTarget.classList.toggle("text-gray-300");
                                    }}
                                ></i>
                            ))}
                        </div>
                    </div>

                    {/* 4. Pros/Cons */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-blue-600 mb-1">
                                장점
                            </label>
                            <textarea
                                className="w-full h-24 bg-blue-50/50 border border-blue-100 rounded-xl p-3 text-sm resize-none outline-none focus:border-blue-500"
                                placeholder="채광, 치안, 교통 등 만족스러운 점"
                            ></textarea>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-red-500 mb-1">
                                단점
                            </label>
                            <textarea
                                className="w-full h-24 bg-red-50/50 border border-red-100 rounded-xl p-3 text-sm resize-none outline-none focus:border-red-500"
                                placeholder="소음, 벌레, 곰팡이 등 아쉬운 점"
                            ></textarea>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            alert("소중한 후기 감사합니다! 500P가 적립되었습니다.");
                            onClose();
                        }}
                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-800 transition-all transform hover:scale-[1.02]"
                    >
                        등록하고 포인트 받기 💰
                    </button>
                </div>
            </div>
        </div>
    );
}
