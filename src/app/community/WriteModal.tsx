'use client';

import React, { useState } from 'react';

interface WriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { category: string; tag: string; title: string; content: string }) => Promise<void>;
}

const CATEGORY_OPTIONS = [
  { label: '💬 잡담', category: '자유수다', tag: 'talk' },
  { label: '❓ 질문', category: '질문있어요', tag: 'qna' },
  { label: '👀 후기요청', category: '후기요청', tag: 'review' },
  { label: '😡 대나무숲', category: '대나무숲', tag: 'rant' },
];

export default function WriteModal({ isOpen, onClose, onSubmit }: WriteModalProps) {
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit() {
    if (selectedIdx < 0) { alert('게시판을 선택하세요.'); return; }
    if (!title.trim()) { alert('제목을 입력하세요.'); return; }
    if (!content.trim()) { alert('내용을 입력하세요.'); return; }

    const opt = CATEGORY_OPTIONS[selectedIdx];
    setSubmitting(true);
    try {
      await onSubmit({ category: opt.category, tag: opt.tag, title, content });
      setSelectedIdx(-1);
      setTitle('');
      setContent('');
      onClose();
    } catch {
      alert('게시글 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl p-6 shadow-2xl animate-fade-in-up">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900">글쓰기</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <i className="fa-solid fa-xmark text-2xl"></i>
          </button>
        </div>

        <div className="space-y-4">
          {/* Category Select */}
          <select
            value={selectedIdx}
            onChange={e => setSelectedIdx(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
          >
            <option value={-1}>게시판을 선택하세요</option>
            {CATEGORY_OPTIONS.map((opt, i) => (
              <option key={i} value={i}>{opt.label}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold outline-none focus:border-blue-500"
          />

          <textarea
            placeholder="내용을 입력하세요. (서로 존중하는 커뮤니티를 만들어가요!)"
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 resize-none outline-none focus:border-blue-500"
          />

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {submitting ? '등록 중...' : '작성 완료'}
          </button>
        </div>
      </div>
    </div>
  );
}
