'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import WriteModal from './WriteModal';

// ---- Types ----
interface Post {
  id: string;
  category: string;
  tag: string;
  title: string;
  content: string;
  author: string;
  likes: number;
  comments_count: number;
  views: number;
  location: string | null;
  created_at: string;
}

// ---- Filter Config ----
const FILTERS = [
  { label: '전체', value: 'all' },
  { label: '🔥 베스트', value: 'best' },
  { label: '💬 잡담', value: 'talk' },
  { label: '❓ 질문', value: 'qna' },
  { label: '😡 대나무숲', value: 'rant' },
];

// ---- Tag display helpers ----
function getBadgeStyle(tag: string, category: string) {
  if (category === '베스트') return 'bg-red-100 text-red-600';
  if (tag === 'qna') return 'bg-green-100 text-green-700';
  if (tag === 'review') return 'bg-yellow-100 text-yellow-700';
  if (tag === 'rant') return 'bg-gray-800 text-white';
  return 'bg-slate-100 text-slate-600';
}

function getEmoji(tag: string, category: string) {
  if (category === '베스트') return '🔥';
  if (tag === 'qna') return '❓';
  if (tag === 'review') return '👀';
  if (tag === 'rant') return '😡';
  return '💬';
}

function getTagName(tag: string, category: string) {
  if (category === '베스트') return '인기';
  const map: Record<string, string> = { talk: '잡담', qna: '질문', review: '후기요청', rant: '대나무숲', best: '베스트' };
  return map[tag] || category;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

// ===========================================================
export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  const [loading, setLoading] = useState(true);
  const [writeOpen, setWriteOpen] = useState(false);

  // ---- Fetch posts ----
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setPosts(data as Post[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // ---- Filtered & sorted posts ----
  let filtered = posts;
  if (activeFilter === 'best') {
    filtered = [...posts].sort((a, b) => b.likes - a.likes);
  } else if (activeFilter !== 'all') {
    filtered = posts.filter(p => p.tag === activeFilter);
  }

  if (sortBy === 'popular' && activeFilter !== 'best') {
    filtered = [...filtered].sort((a, b) => b.likes - a.likes);
  }

  // ---- Hot posts (top 2 by likes) ----
  const hotPosts = [...posts].sort((a, b) => b.likes - a.likes).slice(0, 2);

  // ---- Write handler ----
  async function handleWrite(data: { category: string; tag: string; title: string; content: string }) {
    const supabase = createClient();
    const { error } = await supabase.from('community_posts').insert({
      category: data.category,
      tag: data.tag,
      title: data.title,
      content: data.content,
      author: '익명',
    });
    if (error) throw error;
    await fetchPosts();
  }

  return (
    <div className="text-slate-900 min-h-screen flex flex-col" style={{ background: '#f8fafc' }}>
      <main className="w-full max-w-2xl mx-auto bg-white min-h-screen border-x border-slate-100 shadow-sm relative pb-20">

        {/* ====== Hero Section: Hot Posts ====== */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            테넌트 라운지 (Tenant Lounge){' '}
            <span className="text-sm font-normal text-slate-500">같은 고민을 하는 테넌트들의 대나무숲 🎋</span>
          </h2>
          <div className="space-y-3">
            {hotPosts.map(post => (
              <div key={post.id} className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded">HOT</span>
                  <h3 className="font-bold text-slate-800 line-clamp-1 text-sm">{post.title}</h3>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1 mb-2">{post.content}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>{post.author}</span>
                  <span><i className="fa-regular fa-thumbs-up"></i> {post.likes}</span>
                  <span><i className="fa-regular fa-comment-dots"></i> {post.comments_count}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ====== Sticky Filter Bar ====== */}
        <section className="sticky top-20 z-40 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pr-4">
            {FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold border transition-colors ${
                  activeFilter === f.value
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </section>

        {/* Sort Row */}
        <div className="px-4 py-3 bg-slate-50/50 flex justify-end text-xs text-slate-400 font-bold border-b border-slate-100">
          <span
            className={`cursor-pointer ${sortBy === 'latest' ? 'text-slate-800' : 'hover:text-slate-800'}`}
            onClick={() => setSortBy('latest')}
          >최신순</span>
          <span className="mx-2">|</span>
          <span
            className={`cursor-pointer ${sortBy === 'popular' ? 'text-slate-800' : 'hover:text-slate-800'}`}
            onClick={() => setSortBy('popular')}
          >인기순</span>
        </div>

        {/* ====== Feed List ====== */}
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-10 text-center text-slate-400 font-bold">로딩 중...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-slate-400 font-bold">게시글이 없습니다.</div>
          ) : (
            filtered.map(post => {
              const bgClass = post.tag === 'review' ? 'bg-yellow-50/50 hover:bg-yellow-50' : 'bg-white hover:bg-slate-50';
              return (
                <div key={post.id} className={`p-5 cursor-pointer transition-colors ${bgClass}`}>
                  {/* Location Badge */}
                  {post.location && (
                    <>
                      <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px] font-bold mb-1 border border-blue-100 hover:bg-blue-100 transition-colors">
                        <i className="fa-solid fa-location-dot"></i> {post.location}
                      </div>
                      <div className="block" />
                    </>
                  )}

                  <div className="flex items-center gap-2 mb-2">
                    <span className={`${getBadgeStyle(post.tag, post.category)} text-[10px] font-bold px-1.5 py-0.5 rounded`}>
                      {getEmoji(post.tag, post.category)} {getTagName(post.tag, post.category)}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm md:text-base">{post.title}</h3>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed line-clamp-2 mb-3">{post.content}</p>
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <div className="flex gap-2">
                      <span>{post.author}</span>
                      <span>·</span>
                      <span>{timeAgo(post.created_at)}</span>
                    </div>
                    <div className="flex gap-3">
                      <span className={post.likes > 10 ? 'text-red-500 font-bold' : ''}>
                        <i className="fa-regular fa-thumbs-up"></i> {post.likes}
                      </span>
                      <span className={post.comments_count > 0 ? 'text-blue-500 font-bold' : ''}>
                        <i className="fa-regular fa-comment-dots"></i> {post.comments_count}
                      </span>
                      <span><i className="fa-regular fa-eye"></i> {post.views}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ====== FAB (글쓰기) ====== */}
        <button
          onClick={() => setWriteOpen(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl shadow-blue-200 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-50"
        >
          <i className="fa-solid fa-pen text-xl"></i>
        </button>
      </main>

      {/* ====== Write Modal ====== */}
      <WriteModal isOpen={writeOpen} onClose={() => setWriteOpen(false)} onSubmit={handleWrite} />
    </div>
  );
}
