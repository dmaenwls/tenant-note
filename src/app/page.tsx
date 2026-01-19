"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [reviews, setReviews] = useState<
    Array<{
      id: number;
      location: string;
      pro: string;
      con: string;
      rating: string;
      dateDay: number;
    }>
  >([]);

  // Search Logic
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      alert("지역명이나 건물명을 입력해주세요!");
      return;
    }
    router.push('/map');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Review Generation Logic
  useEffect(() => {
    const districts = [
      "관악구 신림동",
      "관악구 봉천동",
      "강남구 역삼동",
      "강남구 논현동",
      "마포구 망원동",
      "마포구 연남동",
      "영등포구 당산동",
      "광진구 화양동",
      "동작구 상도동",
      "성동구 사근동",
    ];

    const prosList = [
      "역에서 뛰면 진짜 1분 컷. 늦잠 자도 지각 안 함. 삶의 질이 달라짐.",
      "집주인 할머니가 명절마다 전이랑 잡채 챙겨주심. 서울의 어머니...",
      "남향이라 낮에 불 안 켜도 됨. 난방비가 확실히 덜 나옴. 채광 맛집.",
      "바로 1층에 편의점 있고 3분 거리에 다이소 있어서 슬세권 최강.",
      "구축이라 걱정했는데 리모델링 싹 돼서 신축 오피스텔보다 깔끔함.",
      "바로 앞에 파출소 있어서 밤늦게 다녀도 무섭지 않음. 치안 최고.",
      "방음이 생각보다 너무 잘됨. 옆집에 사람 사는 줄도 몰랐음.",
      "주차 공간이 지정석이라 퇴근하고 주차 전쟁 안 해도 됨.",
      "관리비에 인터넷, 수도 포함이라 월 고정 지출이 적음.",
      "도보 5분 거리에 대형 마트랑 영화관 있어서 인프라 끝판왕.",
      "수압이 마사지 수준임. 씻을 때마다 피로가 풀림.",
      "엘리베이터가 2대라 출근 시간에도 기다릴 필요 없음.",
      "신축이라 벌레 한 마리도 못 봄. 세스코 필요 없음.",
      "옥상을 개방해놔서 가끔 맥주 한잔하기 딱 좋음. 뷰가 미쳤음.",
      "집 바로 뒤에 산책로가 있어서 저녁 먹고 운동하기 너무 좋음.",
      "분리수거장이 엄청 깨끗하게 관리됨. 냄새 1도 안 남.",
      "창문이 이중창이라 대로변인데도 문 닫으면 세상 조용함.",
      "화장실이 방이랑 분리되어 있어서 습기 걱정 없음. 곰팡이 해방.",
      "벽지가 실크벽지라 고급스럽고 뭐 묻어도 잘 지워짐.",
      "옵션으로 있는 세탁기가 건조 기능까지 있어서 빨래 걱정 끝.",
    ];

    const consList = [
      "옆집 통화 내용까지 다 들림. 어제 남친이랑 싸운 내용 받아적을 뻔.",
      "여름만 되면 하수구에서 냄새가 올라옴. 트랩 설치해도 소용없음.",
      "1층 현관 보안이 허술해서 배달 음식 시키면 자꾸 사라짐.",
      "집주인이 깐깐해서 못 하나 박을 때마다 허락 받아야 함. 스트레스.",
      "결로가 너무 심해서 겨울에 창틀에 물이 흥건함. 곰팡이 파티.",
      "옆집 코니 노래 소리 다 들림. 방음이 그냥 없다고 보면 됨.",
      "집주인이 CCTV로 감시하는 느낌임. 분리수거 조금만 잘못해도 전화 옴.",
      "1층 식당 때문에 여름에 바퀴벌레랑 눈 마주침. 소름 돋음.",
      "언덕 경사가 거의 등산 수준. 눈 오면 집에 못 들어감.",
      "보일러가 너무 오래돼서 온수 나오려면 5분 동안 물 틀어놔야 함.",
      "화장실 환풍구가 옆집이랑 연결된 건지 담배 냄새가 계속 넘어옴.",
      "벽이 합판인가? 옆집 핸드폰 진동 소리에 내가 깸.",
      "관리비는 비싼데 관리는 1도 안 됨. 복도 청소 내가 함.",
      "수압이 너무 약해서 변기 물 내리면 샤워기 물이 끊김.",
      "바로 앞이 술집 골목이라 새벽 3시까지 고성방가 ASMR 강제 청취.",
      "택배 보관함이 없어서 문 앞에 두면 자꾸 없어짐. 스트레스.",
      "주차장이 너무 좁아서 차 뺄 때마다 전화해야 함. 이중주차 지옥.",
      "방 창문이 복도 쪽으로 나 있어서 환기 시킬 때마다 사생활 노출됨.",
      "인터넷이 너무 느려서 게임은 꿈도 못 꿈. 와이파이 자주 끊김.",
      "윗집 발망치 소리에 노이로제 걸릴 지경. 쿵쿵쿵 심장이 울림.",
    ];

    const generatedReviews = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      location: districts[Math.floor(Math.random() * districts.length)],
      pro: prosList[Math.floor(Math.random() * prosList.length)],
      con: consList[Math.floor(Math.random() * consList.length)],
      rating: (Math.random() * (5.0 - 1.5) + 1.5).toFixed(1),
      dateDay: Math.floor(Math.random() * 30) + 1,
    }));
    setReviews(generatedReviews);
  }, []);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -340, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 340, behavior: "smooth" });
    }
  };

  return (
    <>
      {/* 2. Hero Section */}
      <section className="bg-slate-900 text-white pt-24 pb-32 px-4 relative overflow-hidden">
        <div className="container mx-auto text-center relative z-10">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            부동산 사장님은
            <br className="md:hidden" /> 절대 말 안 해주는
            <br />
            <span className="text-blue-400">그 집 이야기</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto break-keep">
            등기부등본엔 없는 곰팡이, 벌레, 층간소음...
            <br />
            먼저 살아본 선배들의 비밀 노트를 훔쳐보세요.
          </p>

          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                id="hero-search-input"
                placeholder="지역명, 건물명으로 찐후기 검색"
                className="w-full p-5 pl-6 outline-none text-slate-900 text-lg placeholder:text-slate-400 bg-white rounded-2xl shadow-2xl focus:ring-4 focus:ring-blue-500/30 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyPress}
              />
              <button
                id="hero-search-btn"
                className="absolute right-2 top-2 bottom-2 bg-slate-900 hover:bg-slate-800 text-white px-6 rounded-xl font-bold transition-colors hidden sm:block"
                onClick={handleSearch}
              >
                검색
              </button>
            </div>
          </div>

          {/* Viral Game Banner */}
          <Link
            href="/game.html"
            className="block mt-8 transform hover:scale-105 transition-transform duration-300 animate-float"
          >
            <div className="bg-gradient-to-r from-violet-600 to-pink-500 rounded-2xl p-1 p-[2px] shadow-2xl">
              <div className="bg-slate-900/90 hover:bg-slate-900/80 backdrop-blur-sm rounded-xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
                <div className="text-left">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-200 to-pink-200 font-bold text-xs uppercase tracking-wider mb-1 block">
                    New • 밸런스 게임
                  </span>
                  <h3 className="text-white font-bold text-lg md:text-xl leading-tight">
                    🤷‍♀️ <span className="text-yellow-300">월세 낼 돈으로 차라리...</span>
                    <br className="md:hidden" /> 내 주거 성향은 무슨 타입일까?
                  </h3>
                </div>
                <div className="bg-white text-violet-600 px-5 py-2.5 rounded-full font-bold text-sm shrink-0 shadow-lg flex items-center gap-2 group">
                  3분 만에 테스트하기
                  <i className="fa-solid fa-chevron-right text-xs group-hover:translate-x-1 transition-transform"></i>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* 2.5 Quick Service Cards */}
      <section className="py-10 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* 1. Reviews */}
            <Link
              href="/reviews.html"
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col items-center justify-center gap-3 group text-center border border-slate-100"
            >
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <i className="fa-solid fa-map-location-dot"></i>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">동네 분석</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  살아본 사람만 아는
                  <br />
                  진실
                </p>
              </div>
            </Link>

            {/* 2. Safety */}
            <Link
              href="/safety.html"
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col items-center justify-center gap-3 group text-center border border-slate-100"
            >
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-2xl group-hover:bg-green-600 group-hover:text-white transition-colors">
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">물건 분석</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  계약할 부동산
                  <br />
                  3초 무료 분석
                </p>
              </div>
            </Link>

            {/* 3. Guide */}
            <Link
              href="/guide.html"
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col items-center justify-center gap-3 group text-center border border-slate-100"
            >
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <i className="fa-solid fa-calendar-check"></i>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">계약/이사 가이드</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  계약~입주
                  <br />
                  D-Day 관리
                </p>
              </div>
            </Link>

            {/* 4. Community */}
            <Link
              href="/community.html"
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col items-center justify-center gap-3 group text-center border border-slate-100"
            >
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center text-2xl group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <i className="fa-solid fa-comments"></i>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">테넌트 라운지</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  실거주자들의
                  <br />찐 소통 공간
                </p>
              </div>
            </Link>

            {/* 5. Insight */}
            <Link
              href="/insight.html"
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col items-center justify-center gap-3 group text-center border border-slate-100"
            >
              <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center text-2xl group-hover:bg-slate-700 group-hover:text-white transition-colors">
                <i className="fa-solid fa-pen-nib"></i>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">인사이트</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  감정평가사의
                  <br />
                  부동산 칼럼
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Section A: Real Reviews */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-8 md:mb-12">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                광고 없는 100% 실거주자 인증 후기
              </h2>
              <p className="text-slate-500">
                솔직해서 더 믿음직한 우리 동네 이야기
              </p>
            </div>
            {/* Controls for PC */}
            <div className="hidden md:flex gap-2">
              <button
                onClick={scrollLeft}
                className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
              >
                ←
              </button>
              <button
                onClick={scrollRight}
                className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
              >
                →
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-4 -mx-4 px-4 md:mx-0 md:px-0"
          >
            {reviews.map((review) => (
              <div
                key={review.id}
                className="min-w-[320px] max-w-[320px] min-h-[200px] snap-center rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md flex flex-col justify-between h-full"
              >
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
                      {review.location}
                    </span>
                    <div className="flex items-center gap-1">
                      <i className="fas fa-star text-yellow-400 text-xs"></i>
                      <span className="text-sm font-bold text-gray-800">
                        {review.rating}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="mb-1 flex items-center gap-1.5">
                        <span className="text-lg">😊</span>
                        <span className="text-sm font-bold text-blue-600">
                          장점
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-gray-600 break-keep whitespace-normal">
                        "{review.pro}"
                      </p>
                    </div>

                    <div>
                      <div className="mb-1 flex items-center gap-1.5">
                        <span className="text-lg">😤</span>
                        <span className="text-sm font-bold text-red-500">
                          단점
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-gray-600 break-keep whitespace-normal">
                        "{review.con}"
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-gray-50 pt-3 text-xs text-gray-400 flex justify-between items-center">
                  <span>실거주 인증 완료 ✅</span>
                  <span>2024.03.{review.dateDay}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Section B: Moving Process */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-bold tracking-widest text-xs uppercase mb-2 block animate-fade-in-up">
              Process Guide
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 animate-fade-in-up delay-75">
              복잡한 계약부터 이사까지,{" "}
              <span className="text-blue-600">단계별로 떠먹여 드립니다</span>
            </h2>
            <p className="text-slate-500 mt-4 animate-fade-in-up delay-100">
              처음이라 막막한 이사 준비, 테넌트 노트가 로드맵을 그려드릴게요.
            </p>
          </div>

          <div className="relative max-w-6xl mx-auto">
            {/* PC: Desktop Timeline Line (Absolute) */}
            <div className="hidden md:block absolute top-[2.5rem] left-0 w-full h-1 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 -z-10 rounded-full"></div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4">
              {/* Step 1 */}
              <div className="relative group">
                {/* Mobile Line */}
                <div className="md:hidden absolute left-[1.65rem] top-12 bottom-0 w-0.5 bg-slate-200 -z-10 h-[calc(100%+2rem)]"></div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative z-10 flex md:block items-start gap-4 md:gap-0">
                  <div className="w-14 h-14 rounded-full bg-blue-600 border-4 border-white shadow-md flex items-center justify-center text-2xl text-white mb-0 md:mb-6 shrink-0 group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </div>

                  <div className="flex-1">
                    <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded inline-block mb-2">
                      STEP 1
                    </span>
                    <h3 className="font-bold text-xl text-slate-900 mb-4">
                      탐색 & 검증 (Search)
                    </h3>
                    <ul className="space-y-2.5">
                      <li className="flex items-center gap-2 text-sm text-slate-600">
                        <i className="fa-solid fa-check text-blue-500 text-xs"></i>{" "}
                        예산 및 대출 정보 확인
                      </li>
                      <li className="flex items-center gap-2 text-sm text-slate-600">
                        <i className="fa-solid fa-check text-blue-500 text-xs"></i>{" "}
                        등기부/건축물대장 확인
                      </li>
                      <li className="flex items-center gap-2 text-sm text-slate-600">
                        <i className="fa-solid fa-check text-blue-500 text-xs"></i>{" "}
                        깡통전세/보증보험 여부
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative group">
                <div className="md:hidden absolute left-[1.65rem] top-12 bottom-0 w-0.5 bg-slate-200 -z-10 h-[calc(100%+2rem)]"></div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative z-10 flex md:block items-start gap-4 md:gap-0">
                  <div className="w-14 h-14 rounded-full bg-white border-4 border-slate-200 shadow-md flex items-center justify-center text-xl text-slate-400 mb-0 md:mb-6 shrink-0 group-hover:border-blue-300 transition-colors">
                    <i className="fa-solid fa-file-signature"></i>
                  </div>
                  <div className="flex-1">
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded inline-block mb-2 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      STEP 2
                    </span>
                    <h3 className="font-bold text-xl text-slate-900 mb-4">
                      계약 & 확정 (Contract)
                    </h3>
                    <ul className="space-y-2.5">
                      <li className="flex items-center gap-2 text-sm text-slate-600">
                        <i className="fa-solid fa-check text-blue-500 text-xs"></i>{" "}
                        임대인 본인 확인 (신분증)
                      </li>
                      <li className="flex items-center gap-2 text-sm text-slate-600">
                        <i className="fa-solid fa-check text-blue-500 text-xs"></i>{" "}
                        필수 특약사항 삽입
                      </li>
                      <li className="flex items-center gap-2 text-sm text-slate-600">
                        <i className="fa-solid fa-check text-blue-500 text-xs"></i>{" "}
                        확정일자 받기/신고
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative group">
                <div className="md:hidden absolute left-[1.65rem] top-12 bottom-0 w-0.5 bg-slate-200 -z-10 h-[calc(100%+2rem)]"></div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative z-10 flex md:block items-start gap-4 md:gap-0">
                  <div className="w-14 h-14 rounded-full bg-white border-4 border-slate-200 shadow-md flex items-center justify-center text-xl text-slate-400 mb-0 md:mb-6 shrink-0 group-hover:border-blue-300 transition-colors">
                    <i className="fa-solid fa-boxes-packing"></i>
                  </div>
                  <div className="flex-1">
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded inline-block mb-2 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      STEP 3
                    </span>
                    <h3 className="font-bold text-xl text-slate-900 mb-4">
                      입주 준비 (Prepare)
                    </h3>
                    <ul className="space-y-2.5">
                      <li className="flex items-center gap-2 text-sm text-slate-600">
                        <i className="fa-solid fa-check text-blue-500 text-xs"></i>{" "}
                        이사업체 예약
                      </li>
                      <li className="flex items-center gap-2 text-sm text-slate-600">
                        <i className="fa-solid fa-check text-blue-500 text-xs"></i>{" "}
                        폐가전 신고
                      </li>
                      <li className="flex items-center gap-2 text-sm text-slate-600">
                        <i className="fa-solid fa-check text-blue-500 text-xs"></i>{" "}
                        공과금 정산 예약
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative group">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative z-10 flex md:block items-start gap-4 md:gap-0">
                  <div className="w-14 h-14 rounded-full bg-white border-4 border-slate-200 shadow-md flex items-center justify-center text-xl text-slate-400 mb-0 md:mb-6 shrink-0 group-hover:border-blue-300 transition-colors">
                    <i className="fa-solid fa-truck-house"></i>
                  </div>
                  <div className="flex-1">
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded inline-block mb-2 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      STEP 4
                    </span>
                    <h3 className="font-bold text-xl text-slate-900 mb-4">
                      입주 & 정산 (Move-in)
                    </h3>
                    <ul className="space-y-2.5">
                      <li className="flex items-center gap-2 text-sm text-slate-600">
                        <i className="fa-solid fa-check text-blue-500 text-xs"></i>{" "}
                        잔금/관리비 정산
                      </li>
                      <li className="flex items-center gap-2 text-sm text-slate-600">
                        <i className="fa-solid fa-check text-blue-500 text-xs"></i>{" "}
                        전입신고
                      </li>
                      <li className="flex items-center gap-2 text-sm text-slate-600">
                        <i className="fa-solid fa-check text-blue-500 text-xs"></i>{" "}
                        비번 변경
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/guide.html"
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-full font-bold shadow-lg hover:bg-slate-800 transition-all hover:scale-105"
            >
              [계약/이사 가이드] 시작하기{" "}
              <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Section: Expert's Note */}
      <section className="py-20 bg-orange-50 border-t border-orange-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-orange-600 font-bold tracking-widest text-xs uppercase mb-2 block">
              Premium Insight
            </span>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              현직 감정평가사의 시선{" "}
              <span className="text-slate-400 font-light">(Expert's Note)</span>
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              인터넷에 떠도는 뇌피셜 말고, 검증된 진짜 정보를 확인하세요.
              <br />
              수천 건의 평가 경험으로 전세 시장의 진실을 기록합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-10">
            {/* Card 1 */}
            <Link
              href="/insight.html"
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 block"
            >
              <div className="h-48 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  alt="Column 1"
                />
                <div className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                  MUST READ
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-orange-600 transition-colors line-clamp-2">
                  전세사기 피하는 법, 등기부등본만 믿지 마세요.
                </h3>
                <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">
                  공인중개사도 놓치는 깡통전세의 신호, 현장에서만 보이는 위험
                  징후를 알려드립니다.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                  <span>by. 김평가사</span>
                  <span>2026.01.05</span>
                </div>
              </div>
            </Link>

            {/* Card 2 */}
            <Link
              href="/insight.html"
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 block"
            >
              <div className="h-48 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  alt="Column 2"
                />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-orange-600 transition-colors line-clamp-2">
                  특약사항에 '이 말' 없으면 보증금 못 돌려받습니다.
                </h3>
                <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">
                  집주인이 웃으면서 도장 찍어줘도 소용없습니다. 내 돈 지키는
                  필수 특약 3가지.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                  <span>by. 김평가사</span>
                  <span>2026.01.02</span>
                </div>
              </div>
            </Link>

            {/* Card 3 */}
            <Link
              href="/insight.html"
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 block"
            >
              <div className="h-48 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1486325212027-8081e485255e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  alt="Column 3"
                />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-orange-600 transition-colors line-clamp-2">
                  2026년 서울 전세 시장 전망
                </h3>
                <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">
                  지금 전세 들어가는 게 맞을까요? 데이터로 분석한 시장 흐름과
                  세입자 대응 전략.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                  <span>by. 김평가사</span>
                  <span>2025.12.28</span>
                </div>
              </div>
            </Link>
          </div>

          <div className="text-center">
            <Link
              href="/insight.html"
              className="inline-flex items-center gap-2 font-bold text-slate-600 hover:text-orange-600 transition-colors border-b-2 border-transparent hover:border-orange-600 pb-1"
            >
              전문가 칼럼 전체보기 <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Safety Banner */}
      <section className="py-16 bg-blue-600 text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">깡통전세 위험, 3초면 끝</h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            내 보증금은 소중하니까. 주소만 입력하면 위험도를 분석해드립니다.
          </p>
          <button className="bg-white text-blue-600 hover:bg-blue-50 font-bold py-4 px-10 rounded-full shadow-lg transition-all hover:scale-105">
            무료로 물건 분석하기 →
          </button>
        </div>
      </section>
    </>
  );
}
