'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PERSONAS, QUESTIONS, TRAIT_LABELS, Persona } from './gameData';

type Screen = 'start' | 'game' | 'result';
type Scores = Record<string, number>;

function calcBestPersona(userScores: Scores): Persona {
  let best = PERSONAS[0];
  let maxScore = -Infinity;
  for (const p of PERSONAS) {
    let score = 0;
    for (const [trait, weight] of Object.entries(p.traits)) {
      score += (userScores[trait] || 0) * weight;
    }
    if (score > maxScore) { maxScore = score; best = p; }
  }
  return best;
}

function getTopTraitTags(persona: Persona): string[] {
  return Object.entries(persona.traits)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([t]) => TRAIT_LABELS[t] || `#${t}`);
}

export default function GamePage() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>('start');
  const [currentStep, setCurrentStep] = useState(0);
  const [userScores, setUserScores] = useState<Scores>({ safety: 0, traffic: 0, infra: 0, cost: 0, nature: 0, quality: 0 });
  const [displayPersona, setDisplayPersona] = useState<Persona | null>(null);
  const [fadeKey, setFadeKey] = useState(0);

  const myPersona = useMemo(() => screen === 'result' ? calcBestPersona(userScores) : null, [screen, userScores]);
  const shownPersona = displayPersona || myPersona;

  function startGame() { setScreen('game'); setCurrentStep(0); setUserScores({ safety: 0, traffic: 0, infra: 0, cost: 0, nature: 0, quality: 0 }); }

  function selectOption(idx: 0 | 1) {
    const q = QUESTIONS[currentStep];
    const choice = idx === 0 ? q.a : q.b;
    setUserScores(prev => {
      const next = { ...prev };
      for (const [key, val] of Object.entries(choice.scores)) { next[key] = (next[key] || 0) + val; }
      return next;
    });
    setFadeKey(k => k + 1);
    if (currentStep + 1 < QUESTIONS.length) { setCurrentStep(s => s + 1); }
    else { setDisplayPersona(null); setScreen('result'); }
  }

  function restart() { setScreen('start'); setCurrentStep(0); setUserScores({ safety: 0, traffic: 0, infra: 0, cost: 0, nature: 0, quality: 0 }); setDisplayPersona(null); }

  function goToMap() {
    const index = PERSONAS.findIndex(p => p.id === shownPersona?.id);
    const numericId = index + 1;
    router.push(`/map?type=${numericId}`);
  }

  function shareResult() {
    const name = shownPersona?.name || '';
    if (navigator.share) { navigator.share({ title: '내 주거 성향 MBTI', text: `나는 ${name}! 너도 한번 해봐.`, url: window.location.href }); }
    else { alert('링크가 복사되었습니다!'); }
  }

  // ============================ START SCREEN ============================
  if (screen === 'start') {
    return (
      <div className="bg-indigo-50 text-slate-900 min-h-screen flex flex-col items-center justify-center">
        <div className="w-full max-w-md flex flex-col p-8 bg-white shadow-2xl relative items-center justify-center text-center min-h-screen">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-indigo-100 to-white -z-10 rounded-b-[3rem]"></div>
          <div className="mb-6 animate-bounce"><span className="text-6xl">🏡</span></div>
          <h1 className="text-4xl font-bold text-indigo-600 mb-4 leading-tight" style={{ fontFamily: "'Jua', sans-serif" }}>
            내 주거 성향<br /><span className="text-slate-800">MBTI 테스트</span>
          </h1>
          <p className="text-slate-500 mb-10 text-lg">16가지 유형으로 분석하는<br />소름돋는 내 집 찾기 스타일</p>
          <button onClick={startGame} className="active:scale-95 w-full max-w-xs bg-indigo-600 text-white text-xl font-bold py-4 rounded-2xl shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
            테스트 시작하기 <i className="fa-solid fa-arrow-right"></i>
          </button>
          <p className="mt-4 text-xs text-slate-400">참여자수: 12,453명</p>
        </div>
      </div>
    );
  }

  // ============================ GAME SCREEN ============================
  if (screen === 'game') {
    const q = QUESTIONS[currentStep];
    const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

    return (
      <div className="bg-indigo-50 text-slate-900 min-h-screen flex flex-col items-center justify-center">
        <div className="w-full max-w-md flex flex-col bg-slate-50 shadow-2xl relative min-h-screen">
          {/* Header */}
          <div className="px-6 pt-12 pb-4 bg-white rounded-b-3xl shadow-sm z-10">
            <div className="flex justify-between items-end mb-2">
              <span className="text-indigo-600 font-black text-xl italic">Q{currentStep + 1}</span>
              <span className="text-slate-300 text-xs font-bold">Total {QUESTIONS.length}</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full relative transition-all duration-300" style={{ width: `${progress}%` }}>
                <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/30"></div>
              </div>
            </div>
          </div>

          {/* Question */}
          <div key={fadeKey} className="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-center leading-relaxed break-keep text-slate-800 mb-10" style={{ fontFamily: "'Jua', sans-serif" }}>
              {q.q}
            </h2>
            <div className="w-full space-y-4">
              {/* Option A */}
              <button onClick={() => selectOption(0)} className="group active:scale-95 w-full bg-white border-2 border-indigo-50 hover:border-indigo-500 hover:bg-indigo-50 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all text-left relative overflow-hidden">
                <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs group-hover:bg-indigo-500 group-hover:text-white transition-colors">A</div>
                <span className="text-lg font-bold text-slate-700 group-hover:text-indigo-700 leading-snug block pl-6">{q.a.text}</span>
              </button>
              {/* Option B */}
              <button onClick={() => selectOption(1)} className="group active:scale-95 w-full bg-white border-2 border-slate-50 hover:border-pink-500 hover:bg-pink-50 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all text-left relative overflow-hidden">
                <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs group-hover:bg-pink-500 group-hover:text-white transition-colors">B</div>
                <span className="text-lg font-bold text-slate-700 group-hover:text-pink-700 leading-snug block pl-6">{q.b.text}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================ RESULT SCREEN ============================
  if (!shownPersona) return null;
  const tags = getTopTraitTags(shownPersona);
  const otherPersonas = PERSONAS.filter(p => p.id !== shownPersona.id);

  return (
    <div className="bg-indigo-50 text-slate-900 h-[100dvh] flex flex-col items-center justify-center overflow-hidden">
      <div className="w-full max-w-md flex flex-col bg-white shadow-2xl relative overflow-y-auto h-full">
        {/* Hero Banner */}
        <div className="relative w-full h-48 bg-indigo-600 flex items-center justify-center shrink-0 rounded-b-[3rem] -mb-16 z-0">
          <div className="text-center text-white pb-10">
            <p className="text-sm opacity-80 mb-1">나의 주거 성향은?</p>
            <h1 className="text-3xl tracking-wide" style={{ fontFamily: "'Jua', sans-serif" }}>{shownPersona.name}</h1>
          </div>
        </div>

        <div className="px-6 pb-24 pt-6 z-10 flex-1 flex flex-col">
          {/* Glass Card */}
          <div className="bg-white/90 backdrop-blur-[10px] border border-white/50 rounded-3xl p-6 shadow-xl mb-6 text-center animate-fade-in-up">
            <div className="text-6xl mb-4">{shownPersona.emoji}</div>
            <h2 className="text-xl font-bold text-indigo-900 mb-2">{shownPersona.desc.split('.')[0]}.</h2>
            <div className="w-full h-0.5 bg-indigo-50 my-4"></div>
            <p className="text-slate-600 leading-relaxed font-medium break-keep text-sm">{shownPersona.desc}</p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {tags.map(tag => (
                <span key={tag} className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold">{tag}</span>
              ))}
            </div>
          </div>

          {/* Other Types Grid */}
          <div className="mt-6 mb-8 w-full animate-fade-in-up">
            <h3 className="text-xs font-bold text-slate-400 text-center mb-4">다른 15가지 유형도 구경해봐요! 👀</h3>
            <div className="grid grid-cols-4 gap-2">
              {otherPersonas.map(item => (
                <div
                  key={item.id}
                  onClick={() => setDisplayPersona(item)}
                  className="flex flex-col items-center justify-center p-2 bg-white rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:scale-105 hover:shadow-md transition-all active:scale-95"
                >
                  <span className="text-2xl mb-1 drop-shadow-sm">{item.emoji}</span>
                  <span className="text-[0.6rem] font-bold text-slate-500 text-center leading-tight break-keep">{item.name.replace('형', '')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 mt-auto">
            <button onClick={goToMap} className="active:scale-95 w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2">
              <i className="fa-solid fa-map-location-dot"></i> 내 맞춤 동네 지도 보기
            </button>
            <button onClick={shareResult} className="active:scale-95 w-full bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-200 flex items-center justify-center gap-2">
              <i className="fa-solid fa-share-nodes"></i> 친구에게 공유하기
            </button>
            <button onClick={restart} className="w-full py-3 text-slate-400 text-sm hover:text-indigo-500">
              <i className="fa-solid fa-rotate-right mr-1"></i> 다시 테스트하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
