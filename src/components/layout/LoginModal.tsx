"use client";

import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            alert("이메일과 비밀번호를 모두 입력해주세요.");
            return;
        }

        setLoading(true);
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        setLoading(false);

        if (error) {
            alert("로그인 실패: " + error.message);
            return;
        }

        window.location.reload();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-[fadeScaleIn_0.25s_ease-out]">
                {/* Header */}
                <div className="px-8 pt-8 pb-2 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 mb-4">
                        <svg
                            className="w-7 h-7 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                        로그인
                    </h2>
                    <p className="text-sm text-gray-400">
                        Tenant Note 계정으로 로그인하세요
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-8 pt-6 pb-8 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">
                            이메일
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            autoFocus
                            className="w-full bg-gray-50 border border-gray-300 placeholder-gray-500 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">
                            비밀번호
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-gray-50 border border-gray-300 placeholder-gray-500 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                로그인 중...
                            </span>
                        ) : (
                            "로그인"
                        )}
                    </button>
                </form>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-300 hover:text-gray-600 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
