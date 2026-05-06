"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { EVENTS, ENDINGS, type GameEvent, type EndingData } from "./gameData";
import { motion, AnimatePresence } from "framer-motion";

const clamp = (v: number) => Math.min(100, Math.max(0, v));

function calculateEnding(money: number, karma: number, stress: number, month: number): EndingData | null {
  // 1. 즉시 발동 (게임 오버형 - D유형)
  if (stress >= 100) return ENDINGS.find(e => e.id === 13) || null; // 13. 탈모 갤러리 정회원
  if (money <= 0) return ENDINGS.find(e => e.id === 14) || null; // 14. 강제 경매 파산자
  if (money <= 10 && karma <= 10 && stress <= 10) return ENDINGS.find(e => e.id === 16) || null; // 16. 해탈한 생불

  if (month > 12) {
    if (money < 20) return ENDINGS.find(e => e.id === 15) || null; // 15. 세금의 노예 (12월 종부세 후 자산 부족)

    // 12개월 생존 시
    // Type A: Money High, Karma Low
    if (money >= 70 && karma < 50) {
      if (money >= 85) return ENDINGS.find(e => e.id === 1) || null; // 1. 강남 폭군 조물주
      if (stress >= 60) return ENDINGS.find(e => e.id === 4) || null; // 4. 내용증명 콜렉터
      if (karma < 30) return ENDINGS.find(e => e.id === 2) || null; // 2. 어둠의 디벨로퍼
      return ENDINGS.find(e => e.id === 3) || null; // 3. 엑셀 마스터
    }

    // Type B: Karma High, Money Low
    if (karma >= 70 && money < 60) {
      if (karma >= 85) return ENDINGS.find(e => e.id === 5) || null; // 5. 마이너스 마더 테레사
      if (money < 30) return ENDINGS.find(e => e.id === 8) || null; // 8. 명예 사회복지사
      if (stress >= 60) return ENDINGS.find(e => e.id === 7) || null; // 7. 호구 잡힌 동네 북
      return ENDINGS.find(e => e.id === 6) || null; // 6. 움직이는 ATM기
    }

    // Type C: Balanced / Avg
    if (money >= 50 && karma >= 50) {
      if (stress <= 40) return ENDINGS.find(e => e.id === 9) || null; // 9. 밀당의 고수
      if (money >= 60) return ENDINGS.find(e => e.id === 11) || null; // 11. 박쥐형 조물주
      return ENDINGS.find(e => e.id === 10) || null; // 10. 무념무상 은둔 고수
    }

    // 나머지 평범한 생존자
    return ENDINGS.find(e => e.id === 12) || null; // 12. 소시민 꼬마 건물주
  }
  return null;
}

function getShortTitle(title: string) {
  if (title.includes('폭군')) return '폭군';
  if (title.includes('디벨로퍼')) return '디벨로퍼';
  if (title.includes('엑셀')) return '엑셀 마스터';
  if (title.includes('내용증명')) return '콜렉터';
  if (title.includes('마더 테레사')) return '테레사';
  if (title.includes('ATM')) return 'ATM';
  if (title.includes('동네 북')) return '동네 북';
  if (title.includes('복지사')) return '복지사';
  if (title.includes('밀당')) return '밀당 고수';
  if (title.includes('무념무상')) return '은둔 고수';
  if (title.includes('박쥐')) return '박쥐';
  if (title.includes('소시민')) return '소시민';
  if (title.includes('탈모')) return '탈모인';
  if (title.includes('파산자')) return '파산자';
  if (title.includes('세금')) return '세금 노예';
  if (title.includes('생불')) return '생불';
  return title.split(' ')[0];
}

function barColor(type: "money" | "karma" | "stress", value: number) {
  if (type === "stress") return value >= 80 ? "bg-red-500" : value >= 50 ? "bg-orange-400" : "bg-emerald-400";
  if (value <= 20) return "bg-red-500";
  if (value <= 40) return "bg-orange-400";
  return type === "money" ? "bg-blue-500" : "bg-violet-500";
}

export default function GameLandlordPage() {
  const [money, setMoney] = useState(60);
  const [karma, setKarma] = useState(50);
  const [stress, setStress] = useState(30);
  const [currentMonth, setCurrentMonth] = useState(1);

  const event = EVENTS.find(e => e.month === currentMonth) || EVENTS[0];
  const ending = calculateEnding(money, karma, stress, currentMonth);
  const isGameOver = !!ending;

  const handleChoice = useCallback((side: "A" | "B") => {
    if (isGameOver) return;

    const choice = side === "A" ? event.choiceA : event.choiceB;

    setMoney(m => clamp(m + choice.money));
    setKarma(k => clamp(k + choice.karma));
    setStress(s => clamp(s + choice.stress));

    setCurrentMonth(prev => prev + 1);
  }, [event, isGameOver]);

  const handleRestart = () => {
    setMoney(60); setKarma(50); setStress(30);
    setCurrentMonth(1);
  };

  const shareResult = async () => {
    if (!ending) return;
    const text = `[나도 건물주 MBTI]\n"${ending.quote}"\n\n내 건물주 유형은 [${ending.title}] ${ending.emoji}\n💰자산 ${money} | ⭐평판 ${karma} | 🔥스트레스 ${stress}\n\n👉 테넌트 노트에서 내 성향 테스트하기`;
    if (navigator.share) {
      try {
        await navigator.share({ title: '나도 건물주 결과', text: text, url: window.location.href });
      } catch (err) { console.log('Share failed or cancelled', err); }
    } else {
      navigator.clipboard.writeText(text);
      alert("결과가 클립보드에 복사되었습니다! 카톡 등에 붙여넣기 해보세요.");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#0f172a] flex flex-col items-center py-6 font-sans">
      {/* Top Bar */}
      <div className="w-full max-w-md px-4 mb-4 z-10">
        <div className="flex justify-between items-center mb-3">
          <Link href="/" className="text-slate-400 hover:text-white text-xs font-bold transition">← 홈으로</Link>
          <h1 className="text-base font-black text-white tracking-tight">나도 건물주 🏠</h1>
          <span className="text-xs font-black text-slate-400 bg-slate-800 px-2 py-1 rounded-full">{isGameOver ? "종료" : `${Math.min(currentMonth, 12)} / 12월`}</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full mb-5 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, ((currentMonth - 1) / 12) * 100)}%` }} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[{ k: "money", l: "💰 자산", v: money }, { k: "karma", l: "⭐ 평판", v: karma }, { k: "stress", l: "🔥 멘탈", v: stress }].map(s => (
            <div key={s.k} className="bg-slate-800/50 p-2 rounded-xl border border-slate-700/50">
              <div className="flex justify-between mb-1 text-[10px] font-black text-slate-300 tracking-wider"><span>{s.l}</span><span>{s.v}</span></div>
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-500 ease-out ${barColor(s.k as any, s.v)}`} style={{ width: `${s.v}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Area */}
      <div className={`w-full max-w-md px-4 relative flex-1 flex flex-col ${isGameOver ? 'justify-start' : 'justify-center'} overflow-y-auto min-h-full`}>
        <AnimatePresence mode="wait">
          {isGameOver && ending ? (
            <div className="flex flex-col w-full">
              {/* ── 화려한 타로/MBTI 스타일 엔딩 카드 ── */}
              <motion.div
                key="ending"
                initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 100 }}
                className="relative w-full aspect-[4/5] max-h-[600px] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-slate-700 bg-slate-900 flex flex-col z-10"
              >
                {/* Dynamic Gradient Background based on Ending Color */}
                <div className={`absolute inset-0 bg-gradient-to-br ${ending.color} opacity-20 z-0`}></div>

                <div className="relative z-10 flex flex-col h-full p-6 text-center">
                  {/* Header Badge */}
                  <div className="mb-4">
                    <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${ending.type === 'D' ? 'bg-red-500 text-white' : 'bg-white text-slate-900'}`}>
                      {ending.type === 'D' ? 'GAME OVER' : `TYPE ${ending.type}`}
                    </span>
                  </div>

                  {/* Giant Emoji Art */}
                  <div className="text-8xl drop-shadow-2xl my-2 animate-bounce-slow">
                    {ending.emoji}
                  </div>

                  {/* Title & Desc */}
                  <h2 className={`text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${ending.color} drop-shadow-sm mb-3 mt-4`}>
                    {ending.title}
                  </h2>
                  <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-700/50 mb-auto">
                    <p className="text-slate-200 text-sm whitespace-pre-line leading-relaxed font-bold break-keep">
                      "{ending.quote}"
                    </p>
                  </div>

                  {/* Final Stats Summary */}
                  <div className="grid grid-cols-3 gap-2 mt-4 bg-black/40 p-3 rounded-2xl backdrop-blur-sm">
                    <div>
                      <div className="text-lg font-black text-blue-400">{money}</div>
                      <div className="text-[9px] font-bold text-slate-400 mt-0.5">자산</div>
                    </div>
                    <div>
                      <div className="text-lg font-black text-violet-400">{karma}</div>
                      <div className="text-[9px] font-bold text-slate-400 mt-0.5">평판</div>
                    </div>
                    <div>
                      <div className="text-lg font-black text-orange-400">{stress}</div>
                      <div className="text-[9px] font-bold text-slate-400 mt-0.5">스트레스</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Other Types Grid */}
              <div className="mt-8 mb-4 w-full animate-fade-in-up z-10">
                <h3 className="text-xs font-bold text-slate-400 text-center mb-4">다른 15가지 유형도 구경해봐요! 👀</h3>
                <div className="grid grid-cols-4 gap-2">
                  {ENDINGS.filter(e => e.id !== ending.id).map(item => (
                    <div
                      key={item.id}
                      className="flex flex-col items-center justify-center p-2 bg-slate-800 rounded-xl shadow-sm border border-slate-700 hover:scale-105 hover:shadow-md transition-all active:scale-95"
                    >
                      <span className="text-2xl mb-1 drop-shadow-sm">{item.emoji}</span>
                      <span className="text-[0.6rem] font-bold text-slate-400 text-center leading-tight break-keep">{getShortTitle(item.title)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <motion.div
              key={`event-${currentMonth}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-white rounded-3xl shadow-xl overflow-hidden absolute inset-x-4 top-0 border border-slate-100"
            >
              {/* ── 이벤트 딜레마 카드 ── */}
              <div className="flex flex-col h-full min-h-[460px]">
                <div className="bg-slate-900 p-6 flex flex-col items-center text-center gap-3 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                  <span className="text-6xl drop-shadow-md z-10">{event.emoji}</span>
                  <div className="z-10">
                    <span className="inline-block bg-slate-800 text-blue-300 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest mb-2">{event.month}월의 사건</span>
                    <h2 className="text-xl font-black text-white leading-tight break-keep">{event.title}</h2>
                  </div>
                </div>

                <div className="p-6 text-slate-700 font-bold whitespace-pre-line flex-1 text-[15px] leading-relaxed break-keep flex items-center justify-center text-center bg-slate-50">
                  {event.description}
                </div>

                <div className="p-4 grid grid-cols-1 gap-2.5 bg-white border-t border-slate-100">
                  <button
                    onClick={() => handleChoice("A")}
                    className="p-4 bg-white border-2 border-slate-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 active:bg-blue-100 active:scale-95 transition-all duration-100 group text-left shadow-sm flex flex-col justify-center min-h-[80px]"
                  >
                    <div className="text-[10px] font-black text-blue-600 mb-1">{event.choiceA.label}</div>
                    <div className="text-sm font-bold text-slate-800 break-keep leading-snug">{event.choiceA.text}</div>
                  </button>
                  <button
                    onClick={() => handleChoice("B")}
                    className="p-4 bg-white border-2 border-slate-200 rounded-2xl hover:border-red-500 hover:bg-red-50 active:bg-red-100 active:scale-95 transition-all duration-100 group text-left shadow-sm flex flex-col justify-center min-h-[80px]"
                  >
                    <div className="text-[10px] font-black text-red-600 mb-1">{event.choiceB.label}</div>
                    <div className="text-sm font-bold text-slate-800 break-keep leading-snug">{event.choiceB.text}</div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {!isGameOver && <div className="h-[460px]" />}

        {/* Footer Actions (Only shown on Ending) */}
        {isGameOver && (
          <div className="w-full space-y-3 mt-auto pb-40 pt-8 z-10">
            <button
              onClick={shareResult}
              className="active:scale-95 w-full bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-200 flex items-center justify-center gap-2 transition"
            >
              <i className="fa-solid fa-share-nodes"></i> 친구에게 결과 공유하기
            </button>
            <button
              onClick={handleRestart}
              className="w-full py-3 text-slate-400 text-sm hover:text-orange-500 transition"
            >
              <i className="fa-solid fa-rotate-right mr-1"></i> 다시 테스트하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
