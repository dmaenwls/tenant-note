'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { STEPS } from './guideData';
import Step5Panel from './Step5Panel';

const STORAGE_KEY = 'tenant_guide_progress';
const STORAGE_KEY_S5 = 'tenant_guide_step5_unlocked';

export default function GuidePage() {
  const [currentStepId, setCurrentStepId] = useState(1);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [isStep5Unlocked, setIsStep5Unlocked] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [dDayText, setDDayText] = useState('입주까지 D-20');
  const [toastVisible, setToastVisible] = useState(false);

  // Load persisted state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCompletedItems(new Set(JSON.parse(saved)));
      const s5 = localStorage.getItem(STORAGE_KEY_S5);
      if (s5) setIsStep5Unlocked(JSON.parse(s5));
    } catch { /* ignore */ }
  }, []);

  // Persist state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(completedItems)));
  }, [completedItems]);

  // Progress calculation (only main flow steps 1-4)
  const mainSteps = STEPS.filter(s => s.mainFlow);
  const totalItems = mainSteps.reduce((acc, s) => acc + s.items.length, 0);
  const doneCount = mainSteps.flatMap(s => s.items).filter(item => completedItems.has(item.id)).length;
  const percent = totalItems === 0 ? 0 : Math.round((doneCount / totalItems) * 100);

  const currentStep = STEPS.find(s => s.id === currentStepId)!;

  const toggleItem = useCallback((id: string) => {
    setCompletedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // Check celebration trigger
  useEffect(() => {
    if (totalItems > 0 && doneCount === totalItems && !isStep5Unlocked) {
      setShowCelebration(true);
      // Fire confetti bursts like legacy guide.html
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => {
        confetti({ particleCount: 100, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 100, angle: 120, spread: 55, origin: { x: 1 } });
      }, 500);
    }
  }, [doneCount, totalItems, isStep5Unlocked]);

  function closeCelebrationAndGoStep5() {
    setShowCelebration(false);
    setIsStep5Unlocked(true);
    localStorage.setItem(STORAGE_KEY_S5, JSON.stringify(true));
    setCurrentStepId(5);
  }

  function resetCurrentStep() {
    if (!confirm('현재 단계의 체크리스트를 모두 초기화하시겠습니까?')) return;
    setCompletedItems(prev => {
      const next = new Set(prev);
      currentStep.items.forEach(item => next.delete(item.id));
      return next;
    });
  }

  function resetCycle() {
    if (confirm('🎉 정말 이사를 가시나요? \n새로운 집을 찾기 위해 체크리스트를 초기화하고 Step 1으로 돌아갑니다.')) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY_S5);
      setCompletedItems(new Set());
      setIsStep5Unlocked(false);
      setCurrentStepId(1);
    }
  }

  function toggleDDay() {
    setDDayText(prev => prev.includes('D-20') ? 'D-90 (만기)' : '입주까지 D-20');
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 2000);
    });
  }

  return (
    <div className="text-slate-900 min-h-screen flex flex-col" style={{ background: '#f8fafc' }}>
      {/* Hero Dashboard */}
      <section className="bg-white pt-10 pb-8 border-b border-slate-200">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-6">
            <div>
              <span className="inline-block bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-xs mb-3">🏡 행복한 독립 프로젝트</span>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                김세입님, 이사 준비가 <span className="text-blue-600">{percent}%</span> 진행되었어요!
              </h1>
            </div>
            <div
              className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-3 animate-bounce cursor-pointer"
              onClick={toggleDDay}
            >
              <span className="text-2xl">📅</span>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Target Day</p>
                <p className="text-xl font-bold">{dDayText}</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-slate-100 h-4 rounded-full overflow-hidden relative">
            <div
              className="bg-gradient-to-r from-blue-400 to-blue-600 h-full progress-bar-fill relative"
              style={{ width: `${percent}%` }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-white/50 shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
            </div>
          </div>
          <p className="text-right text-xs text-slate-400 mt-2 font-medium">
            완료 항목 {doneCount} / {totalItems}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-5xl">

          {/* Step Navigation (Subway Style) */}
          <div className="relative flex justify-between items-center mb-12 px-2 md:px-12 overflow-x-auto">
            {/* Line */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 -z-10 mx-8 md:mx-16 min-w-[600px] md:min-w-0"></div>
            {STEPS.map(step => {
              if (step.id === 5 && !isStep5Unlocked) return null;
              const isActive = step.id === currentStepId;
              const isStepCompleted = step.id !== 5 && step.items.every(item => completedItems.has(item.id));
              const stateClass = isActive ? 'active' : isStepCompleted ? 'completed' : '';
              const iconEl = (!isActive && isStepCompleted)
                ? <i className="fa-solid fa-check"></i>
                : <i className={`fa-solid ${step.icon}`}></i>;

              return (
                <div
                  key={step.id}
                  className={`step-item relative flex flex-col items-center gap-2 cursor-pointer group shrink-0 ${stateClass} animate-guide-fade-in-up`}
                  onClick={() => setCurrentStepId(step.id)}
                  style={{ minWidth: 80 }}
                >
                  <div className="step-circle w-10 h-10 md:w-14 md:h-14 bg-white border-4 border-slate-200 rounded-full flex items-center justify-center text-slate-400 group-hover:border-blue-300 transition-all shadow-sm z-10 text-sm md:text-xl">
                    {iconEl}
                  </div>
                  <span className="step-title text-[10px] md:text-sm font-bold text-slate-400 group-hover:text-slate-600 transition-colors whitespace-nowrap">
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Dashboard Split View */}
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Left: Checklist Area */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-slate-900">Step {currentStep.id}. {currentStep.title}</h2>
                <button onClick={resetCurrentStep} className="text-xs text-slate-400 hover:text-red-500 underline">이 단계 초기화</button>
              </div>
              <div className="space-y-3">
                {currentStep.items.map(item => {
                  const isChecked = completedItems.has(item.id);
                  return (
                    <div key={item.id} className="todo-item bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 transition-all duration-200">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          id={item.id}
                          className="custom-checkbox sr-only"
                          checked={isChecked}
                          onChange={() => toggleItem(item.id)}
                        />
                        <label htmlFor={item.id} className="w-6 h-6 border-2 border-slate-300 rounded-lg cursor-pointer flex items-center justify-center hover:border-blue-400 text-transparent transition-colors">
                          <i className={`fa-solid fa-check text-xs font-bold check-icon transition-opacity text-blue-600 ${isChecked ? 'opacity-100' : 'opacity-0'}`}></i>
                        </label>
                      </div>
                      <label htmlFor={item.id} className={`flex-1 cursor-pointer font-medium text-slate-700 select-none check-text transition-all ${isChecked ? 'line-through !text-slate-400' : ''}`}>
                        {item.text}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Guide / Tab Card */}
            <div className="w-full lg:w-[400px] shrink-0">
              {currentStepId === 5 ? (
                <Step5Panel onResetCycle={resetCycle} />
              ) : currentStep.guide ? (
                <div className="bg-white border border-blue-100 rounded-3xl p-6 shadow-lg shadow-blue-50/50 sticky top-24">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl mb-4">💡</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">💡 {currentStep.guide.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">{currentStep.guide.desc}</p>
                  <Link
                    href="/analysis"
                    className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-xl font-bold transition-colors text-sm"
                  >
                    내 집 안전진단 하러가기 →
                  </Link>
                </div>
              ) : null}
            </div>

          </div>
        </div>
      </section>

      {/* Toast */}
      <div className={`fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl transition-opacity pointer-events-none z-50 font-bold text-sm ${toastVisible ? 'opacity-100' : 'opacity-0'}`}>
        텍스트가 복사되었습니다!
      </div>

      {/* Celebration Modal */}
      {showCelebration && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-guide-fade-in-up">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <span className="text-5xl">🏠</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">축하드립니다! 김세입님 🎉</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              그동안 정말 고생 많으셨어요.<br />
              이제 새로운 집에서 행복한 일만 가득하실 거예요!
            </p>
            <button
              onClick={closeCelebrationAndGoStep5}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
            >
              🏠 즐거운 거주 생활 시작하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
