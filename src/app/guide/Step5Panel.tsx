'use client';

import React, { useState, useRef } from 'react';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

export default function Step5Panel({ onResetCycle }: { onResetCycle: () => void }) {
  const [activeTab, setActiveTab] = useState<'maintenance' | 'renewal'>('maintenance');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', text: '애매한 수리비, 누가 내야 할지 헷갈리시죠?<br/>상황을 말씀해주시면 판결해 드릴게요! ⚖️' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatBoxRef = useRef<HTMLDivElement>(null);

  function getAIReply(msg: string): string {
    if (msg.includes('변기') || msg.includes('막힘')) {
      return "변기 배관 자체의 노후나 정화조 문제라면 <span class='font-bold text-indigo-600'>'임대인'</span> 책임입니다.<br/>하지만 칫솔, 물티슈 등 이물질 투입으로 인한 막힘은 <span class='font-bold text-indigo-600'>'임차인'</span> 부담입니다. 전문가 소견이 중요해요!";
    } else if (msg.includes('태풍') || msg.includes('창문')) {
      return "<span class='font-bold text-indigo-600'>천재지변(태풍, 지진)</span>으로 인한 파손은 <span class='font-bold text-indigo-600'>'임대인'</span>이 수리해야 합니다. 단, 창문을 열어두어 파손된 경우 임차인 과실이 일부 인정될 수 있어요.";
    } else if (msg.includes('보일러') || msg.includes('동파')) {
      return "보일러 노후로 인한 동파는 <span class='font-bold text-indigo-600'>'임대인'</span> 책임이지만, 한파 주의보에도 보일러를 끄고 외출해 동파됐다면 <span class='font-bold text-indigo-600'>'임차인'</span>에게 관리 소홀 책임이 있습니다.";
    }
    return "음, 그 상황은 조금 복잡하네요. <br/>대체로 <span class='font-bold text-indigo-600'>노후/구조적 문제</span>는 집주인, <span class='font-bold text-indigo-600'>사용상 부주의</span>는 세입자 책임입니다. 계약서의 특약사항을 한번 확인해보세요!";
  }

  function sendChat(msg: string) {
    if (!msg.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setChatInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: getAIReply(msg) }]);
      setTimeout(() => {
        if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      }, 50);
    }, 1000);
    setTimeout(() => {
      if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }, 50);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl sticky top-24">
      {/* Tabs */}
      <div className="flex bg-slate-50 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex-1 py-4 text-sm font-bold hover:bg-white hover:text-blue-600 transition-colors border-b-2 ${activeTab === 'maintenance' ? 'text-blue-600 border-b-blue-600 font-bold' : 'text-slate-500 border-transparent'}`}
        >🛠️ 수리 해결사</button>
        <button
          onClick={() => setActiveTab('renewal')}
          className={`flex-1 py-4 text-sm font-bold hover:bg-white hover:text-blue-600 transition-colors border-b-2 ${activeTab === 'renewal' ? 'text-blue-600 border-b-blue-600 font-bold' : 'text-slate-500 border-transparent'}`}
        >🔄 만기/재계약</button>
      </div>

      {/* Maintenance Panel */}
      {activeTab === 'maintenance' && (
        <div className="p-4 space-y-6 h-[500px] overflow-y-auto">
          {/* Dispute Cards */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <i className="fa-solid fa-gavel text-slate-400"></i> 빈번한 수리 분쟁 BEST 3
            </h3>
            {/* Card 1: Mold */}
            <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm relative overflow-hidden group hover:border-red-200 transition-colors">
              <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">분쟁 1위</div>
              <div className="flex items-start gap-3">
                <div className="text-2xl mt-1">🍄</div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">곰팡이 / 결로</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    <span className="font-bold text-red-500">지어질 때부터 단열 문제</span>라면 집주인 책임,<br />
                    <span className="font-bold text-blue-500">환기 부족</span>이라면 세입자 책임입니다.
                  </p>
                </div>
              </div>
            </div>
            {/* Card 2: Options */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm group hover:border-blue-200 transition-colors">
              <div className="flex items-start gap-3">
                <div className="text-2xl mt-1">📺</div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">옵션 가전 (에어컨/냉장고)</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    <span className="font-bold text-slate-700">노후 고장</span>은 집주인이 수리/교체.<br />
                    <span className="font-bold text-slate-700">세입자 과실(파손)</span>은 본인 부담입니다.
                  </p>
                </div>
              </div>
            </div>
            {/* Card 3: Damage */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm group hover:border-blue-200 transition-colors">
              <div className="flex items-start gap-3">
                <div className="text-2xl mt-1">🐶</div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">도배 / 장판 / 못질</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    햇빛 변색은 OK. 단, <span className="font-bold text-slate-700">애완동물 훼손, 흡연, 과도한 못질</span>은 퇴실 시 원상복구 필수!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Chatbot */}
          <div className="border-t border-slate-100 pt-6">
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm">🤖</div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">AI 수리비 판독기</h4>
                  <p className="text-[10px] text-slate-500">무엇이든 물어보세요!</p>
                </div>
              </div>
              <div ref={chatBoxRef} className="h-40 overflow-y-auto space-y-3 mb-3 p-1">
                {messages.map((m, i) =>
                  m.role === 'ai' ? (
                    <div key={i} className="flex items-start gap-2 animate-guide-fade-in-up">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] shrink-0">🤖</div>
                      <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-3 py-2 text-xs text-slate-600 shadow-sm max-w-[85%]" dangerouslySetInnerHTML={{ __html: m.text }} />
                    </div>
                  ) : (
                    <div key={i} className="flex justify-end">
                      <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-none px-3 py-2 text-xs shadow-sm max-w-[85%]">{m.text}</div>
                    </div>
                  )
                )}
              </div>
              <div className="flex gap-1.5 overflow-x-auto mb-3 pb-1 hide-scrollbar">
                {[
                  { label: '☔️ 태풍 창문 파손', msg: '태풍으로 창문이 깨졌어' },
                  { label: '❄️ 보일러 동파', msg: '보일러가 동파됐어' },
                  { label: '🚽 변기 막힘', msg: '변기가 막혔는데 내 돈으로 해?' },
                ].map((chip, i) => (
                  <button key={i} onClick={() => sendChat(chip.msg)} className="whitespace-nowrap bg-white border border-indigo-100 text-indigo-600 px-2.5 py-1.5 rounded-full text-[10px] font-bold hover:bg-indigo-50 transition">
                    {chip.label}
                  </button>
                ))}
              </div>
              <div className="relative">
                <input
                  type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                  placeholder="상황을 입력하세요..."
                  className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  onKeyDown={e => { if (e.key === 'Enter') sendChat(chatInput); }}
                />
                <button onClick={() => sendChat(chatInput)} className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-700 p-1">
                  <i className="fa-solid fa-paper-plane text-xs"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Renewal Panel */}
      {activeTab === 'renewal' && (
        <div className="p-6 w-full text-center">
          <div className="mb-6">
            <p className="text-xs text-slate-400 font-bold uppercase mb-1">Expiration Date</p>
            <div className="text-4xl font-extrabold text-slate-900 mb-2 font-mono">D-90</div>
            <p className="text-sm text-slate-500">계약 만료까지 3개월 남았습니다.</p>
          </div>
          <div className="space-y-3">
            <button onClick={onResetCycle} className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2">
              <i className="fa-solid fa-truck"></i> 이사 갈래요 (Step 1으로)
            </button>
            <button onClick={() => alert('① 묵시적 갱신: 만료 2개월 전까지 말 없으면 자동 연장\n② 5% 상한: 갱신 시 보증금 증액은 5% 이내 제한')} className="w-full py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors">
              🔄 더 살래요 (갱신)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
