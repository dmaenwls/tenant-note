'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

// ─── Admin Email ─────────────────────────────────────────────
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'your-admin@email.com';

// ─── Types ───────────────────────────────────────────────────
interface Insight {
    id: string;
    category: string;
    title: string;
    summary: string;
    author: string;
    image_url: string | null;
    content: string | null;
    created_at: string;
}

// ─── Date Formatter ──────────────────────────────────────────
function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}. ${month}. ${day}`;
}

// ─── Placeholder image (fallback) ────────────────────────────
const FALLBACK_IMAGE =
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';

// ═════════════════════════════════════════════════════════════
// Main Page Component
// ═════════════════════════════════════════════════════════════
export default function InsightPage() {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedArticle, setSelectedArticle] = useState<Insight | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // ── Admin state ──────────────────────────────────────────
    const [isAdmin, setIsAdmin] = useState(false);
    const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

    // ── Check admin status ────────────────────────────────────
    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const supabase = createClient();
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error || !user) {
                    setIsAdmin(false);
                    return;
                }
                setIsAdmin(user.email === ADMIN_EMAIL);
            } catch {
                // 세션 없음 / 네트워크 에러 → 일반 유저 모드
                setIsAdmin(false);
            }
        };
        checkAdmin();
    }, []);

    // ── Fetch insights from Supabase ─────────────────────────
    const fetchInsights = useCallback(async () => {
        setLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
            .from('insights')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to fetch insights:', error);
        } else {
            setInsights(data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchInsights();
    }, [fetchInsights]);

    // ── Modal open / close ───────────────────────────────────
    const openArticle = useCallback((article: Insight) => {
        setSelectedArticle(article);
        setIsModalOpen(true);
        requestAnimationFrame(() => {
            setIsAnimating(true);
        });
        document.body.style.overflow = 'hidden';
    }, []);

    const closeArticle = useCallback(() => {
        setIsAnimating(false);
        setTimeout(() => {
            setIsModalOpen(false);
            setSelectedArticle(null);
            document.body.style.overflow = '';
        }, 300);
    }, []);

    // ── Delete handler ───────────────────────────────────────
    const handleDelete = useCallback(async (id: string) => {
        if (!confirm('정말 이 칼럼을 삭제하시겠습니까?')) return;
        const supabase = createClient();
        const { error } = await supabase.from('insights').delete().eq('id', id);
        if (error) {
            alert('삭제 실패: ' + error.message);
        } else {
            alert('칼럼이 삭제되었습니다.');
            closeArticle();
            fetchInsights();
        }
    }, [fetchInsights, closeArticle]);

    // ── Override globals.css body overflow:hidden for this page ──
    useEffect(() => {
        document.body.style.overflow = 'auto';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    return (
        <main className="flex-1" style={{ fontFamily: '"Pretendard Variable", Pretendard, sans-serif' }}>

            {/* ═══════════ Hero Section ═══════════ */}
            <section className="bg-slate-900 text-white py-16 md:py-24 relative overflow-hidden">
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-20"
                    style={{
                        backgroundImage:
                            "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')",
                    }}
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />

                <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center gap-8 max-w-5xl">
                    {/* Profile Image */}
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white/20 overflow-hidden shadow-2xl shrink-0 bg-slate-800">
                        <img
                            src="https://ui-avatars.com/api/?name=Kim+Evaluator&background=2563eb&color=fff&size=200"
                            alt="김평가사"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Text */}
                    <div className="text-center md:text-left">
                        <div className="inline-flex items-center gap-2 bg-blue-600/30 border border-blue-400/30 rounded-full px-3 py-1 mb-4 backdrop-blur-sm">
                            <i className="fa-solid fa-check-circle text-blue-400" />
                            <span className="text-xs font-bold text-blue-100">Verified Expert</span>
                        </div>
                        <h1
                            className="text-3xl md:text-4xl font-bold mb-4 leading-tight"
                            style={{ fontFamily: "'Noto Serif KR', serif" }}
                        >
                            &quot;부동산의 가치는 거짓말하지 않습니다.
                            <br />
                            팩트로 기록하는 안심 전세 이야기.&quot;
                        </h1>
                        <p className="text-slate-400 text-lg">
                            현직 감정평가사 <strong className="text-white">김평가</strong>가 전하는 부동산 팩트체크
                        </p>
                    </div>
                </div>
            </section>

            {/* ═══════════ Magazine Grid ═══════════ */}
            <section className="py-12 md:py-20 bg-slate-50">
                <div className="container mx-auto px-4 max-w-5xl">

                    {/* Loading State */}
                    {loading && (
                        <div className="flex justify-center items-center py-20">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                                <p className="text-slate-400 font-medium">칼럼을 불러오는 중...</p>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && insights.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <i className="fa-regular fa-newspaper text-6xl text-slate-300 mb-6" />
                            <h2 className="text-2xl font-bold text-slate-700 mb-2">아직 게시된 칼럼이 없습니다</h2>
                            <p className="text-slate-400">전문가의 인사이트가 곧 업데이트될 예정입니다.</p>
                        </div>
                    )}

                    {/* Column Grid */}
                    {!loading && insights.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                            {insights.map((insight) => (
                                <InsightCard
                                    key={insight.id}
                                    insight={insight}
                                    onClick={() => openArticle(insight)}
                                />
                            ))}
                        </div>
                    )}

                </div>
            </section>

            {/* ═══════════ Article Viewer Modal ═══════════ */}
            {isModalOpen && selectedArticle && (
                <ArticleModal
                    article={selectedArticle}
                    isAnimating={isAnimating}
                    onClose={closeArticle}
                    isAdmin={isAdmin}
                    onDelete={handleDelete}
                />
            )}

            {/* ═══════════ Admin FAB ═══════════ */}
            {isAdmin && (
                <button
                    id="fab-write-column"
                    onClick={() => setIsWriteModalOpen(true)}
                    className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-500 hover:scale-110 transition-all flex items-center justify-center text-2xl"
                    title="칼럼 작성하기"
                >
                    <i className="fa-solid fa-pen-to-square" />
                </button>
            )}

            {/* ═══════════ Write Modal ═══════════ */}
            {isWriteModalOpen && (
                <WriteModal
                    onClose={() => setIsWriteModalOpen(false)}
                    onSaved={() => { setIsWriteModalOpen(false); fetchInsights(); }}
                />
            )}
        </main>
    );
}

// ═════════════════════════════════════════════════════════════
// InsightCard – Magazine-style card (from legacy insight.html)
// ═════════════════════════════════════════════════════════════
function InsightCard({
    insight,
    onClick,
}: {
    insight: Insight;
    onClick: () => void;
}) {
    return (
        <div
            className="group cursor-pointer flex flex-col h-full"
            onClick={onClick}
        >
            {/* Thumbnail */}
            <div className="rounded-xl overflow-hidden mb-5 relative aspect-[16/9] shadow-md group-hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1">
                <img
                    src={insight.image_url || FALLBACK_IMAGE}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    alt={insight.title}
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm">
                    {insight.category}
                </div>
            </div>

            {/* Text Body */}
            <div className="flex-1 flex flex-col">
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 group-hover:text-blue-700 transition-colors leading-snug">
                    {insight.title}
                </h2>
                <p
                    className="text-slate-500 mb-4 leading-relaxed"
                    style={{
                        fontFamily: "'Noto Serif KR', serif",
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}
                >
                    {insight.summary}
                </p>

                {/* Author & Date */}
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-400 uppercase tracking-wider">
                    <span className="text-slate-900 font-bold">{insight.author}</span>
                    <span>{formatDate(insight.created_at)}</span>
                </div>
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════
// ArticleModal – Slide-in panel (from legacy insight.html)
// ═════════════════════════════════════════════════════════════
function ArticleModal({
    article,
    isAnimating,
    onClose,
    isAdmin,
    onDelete,
}: {
    article: Insight;
    isAnimating: boolean;
    onClose: () => void;
    isAdmin: boolean;
    onDelete: (id: string) => void;
}) {
    return (
        <div className="fixed inset-0 z-[100]">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'
                    }`}
                onClick={onClose}
            />

            {/* Content Panel */}
            <div
                className={`absolute inset-y-0 right-0 w-full md:w-[800px] bg-white shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-out ${isAnimating ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Sticky Toolbar */}
                <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-800 transition-colors flex items-center gap-2"
                    >
                        <i className="fa-solid fa-arrow-left" />
                        <span className="font-bold text-sm">목록으로</span>
                    </button>
                    <div className="flex gap-4 text-slate-400">
                        <button className="hover:text-blue-600 transition-colors">
                            <i className="fa-solid fa-share-nodes" />
                        </button>
                        <button className="hover:text-blue-600 transition-colors">
                            <i className="fa-regular fa-bookmark" />
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => onDelete(article.id)}
                                className="hover:text-red-600 transition-colors"
                                title="칼럼 삭제"
                            >
                                <i className="fa-solid fa-trash" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Article Header */}
                <article className="px-6 py-12 md:px-16">
                    <div className="text-center mb-12">
                        <span className="inline-block text-blue-600 font-bold tracking-wider text-sm mb-4 border-b-2 border-blue-600 pb-1">
                            {article.category}
                        </span>
                        <h1
                            className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-8"
                            style={{ fontFamily: "'Noto Serif KR', serif" }}
                        >
                            {article.title}
                        </h1>
                        <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
                            <img
                                src="https://ui-avatars.com/api/?name=Kim+Evaluator&background=2563eb&color=fff"
                                className="w-8 h-8 rounded-full"
                                alt={article.author}
                            />
                            <span className="font-bold text-slate-900">{article.author}</span>
                            <span>·</span>
                            <span>{formatDate(article.created_at)}</span>
                        </div>
                    </div>

                    {/* Hero Image */}
                    {article.image_url && (
                        <div className="mb-12 rounded-2xl overflow-hidden shadow-lg">
                            <img
                                src={article.image_url}
                                className="w-full h-auto object-cover max-h-[400px]"
                                alt={article.title}
                            />
                        </div>
                    )}

                    {/* Article Body (HTML content from DB) */}
                    <div
                        className="prose prose-lg max-w-none text-slate-800"
                        style={{ fontFamily: "'Noto Serif KR', serif" }}
                        dangerouslySetInnerHTML={{
                            __html: article.content || '<p class="text-slate-400 text-center">본문이 준비 중입니다.</p>',
                        }}
                    />
                </article>

                {/* Bottom Nav */}
                <div className="bg-slate-50 border-t border-slate-100 p-8 md:p-12 text-center">
                    <h3 className="text-slate-900 font-bold mb-4">다른 칼럼도 읽어보세요</h3>
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-white border border-slate-300 rounded-full font-bold text-slate-600 hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all"
                    >
                        전체 리스트 보기
                    </button>
                </div>
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════
// WriteModal – Admin column creation form
// ═════════════════════════════════════════════════════════════
function WriteModal({
    onClose,
    onSaved,
}: {
    onClose: () => void;
    onSaved: () => void;
}) {
    const [form, setForm] = useState({
        category: '',
        title: '',
        summary: '',
        image_url: '',
        content: '',
    });
    const [saving, setSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.category || !form.title || !form.summary) {
            alert('카테고리, 제목, 요약은 필수입니다.');
            return;
        }
        setSaving(true);
        const supabase = createClient();
        const { error } = await supabase.from('insights').insert({
            category: form.category,
            title: form.title,
            summary: form.summary,
            image_url: form.image_url || null,
            content: form.content || null,
            author: '김평가사',
        });
        setSaving(false);
        if (error) {
            alert('저장 실패: ' + error.message);
        } else {
            alert('칼럼이 성공적으로 등록되었습니다!');
            onSaved();
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />

            {/* Form Panel */}
            <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10 rounded-t-2xl">
                    <h2 className="text-lg font-bold text-slate-900">
                        <i className="fa-solid fa-pen-to-square text-blue-600 mr-2" />
                        새 칼럼 작성
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-800 transition-colors">
                        <i className="fa-solid fa-xmark text-xl" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Category */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">카테고리 *</label>
                        <select
                            name="category"
                            value={form.category}
                            onChange={handleChange}
                            className="w-full bg-slate-50 border border-slate-300 placeholder-slate-500 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-colors"
                        >
                            <option value="">카테고리 선택</option>
                            <option value="전세사기 예방">전세사기 예방</option>
                            <option value="계약 실무">계약 실무</option>
                            <option value="시장 분석">시장 분석</option>
                            <option value="청년 정책">청년 정책</option>
                            <option value="생활 꿀팁">생활 꿀팁</option>
                        </select>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">제목 *</label>
                        <input
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="칼럼 제목을 입력하세요"
                            className="w-full bg-slate-50 border border-slate-300 placeholder-slate-500 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>

                    {/* Summary */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">요약 *</label>
                        <textarea
                            name="summary"
                            value={form.summary}
                            onChange={handleChange}
                            rows={3}
                            placeholder="카드에 표시될 요약문을 입력하세요"
                            className="w-full bg-slate-50 border border-slate-300 placeholder-slate-500 rounded-xl px-4 py-3 text-sm resize-none outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>

                    {/* Image URL */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">썸네일 이미지 URL</label>
                        <input
                            name="image_url"
                            value={form.image_url}
                            onChange={handleChange}
                            placeholder="https://... (선택사항)"
                            className="w-full bg-slate-50 border border-slate-300 placeholder-slate-500 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>

                    {/* Content (HTML) */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">본문 (HTML 가능)</label>
                        <textarea
                            name="content"
                            value={form.content}
                            onChange={handleChange}
                            rows={10}
                            placeholder="본문 내용을 입력하세요. HTML 태그 사용이 가능합니다."
                            className="w-full bg-slate-50 border border-slate-300 placeholder-slate-500 rounded-xl px-4 py-3 text-sm font-mono resize-y outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                저장 중...
                            </span>
                        ) : (
                            '칼럼 등록하기'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
