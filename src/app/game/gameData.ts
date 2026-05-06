export interface Persona {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  traits: Record<string, number>;
}

export interface QuestionOption {
  text: string;
  scores: Record<string, number>;
}

export interface Question {
  q: string;
  a: QuestionOption;
  b: QuestionOption;
}

export const PERSONAS: Persona[] = [
  { id: 'safety_guard', name: '청와대 경호실장형', emoji: '👮‍♂️', desc: '안전이 최우선! 집 가는 길 치안 등급부터 방범창 유무까지 꼼꼼히 체크하는 당신. 마음 편히 꿀잠 잘 수 있는 요새 같은 집이 필요해요.', traits: { safety: 10, quality: 5 } },
  { id: 'traffic_teleport', name: '순간이동 능력자형', emoji: '⚡', desc: '역세권이 곧 복지다! 지하철역 도보 5분 컷 아니면 외출을 거부하는 효율 중심파. 출퇴근 시간 단축이 인생의 목표시군요.', traits: { traffic: 10, infra: 5 } },
  { id: 'infra_cvs', name: '프로 편의점 러버형', emoji: '🏪', desc: '슬리퍼 신고 모든 걸 해결해야 직성이 풀리는 타입. 편의점, 코인세탁소, 다이소가 내 집 냉장고고 드레스룸이죠.', traits: { infra: 10, cost: 5 } },
  { id: 'cost_saver', name: '실속파 갓생러형', emoji: '💰', desc: '잠만 자는 방에 돈 쓰기 싫어! 월세를 아껴서 투자하고 미래를 준비하는 야망가. 가성비 좋은 숨은 보석을 찾아내는 능력이 탁월해요.', traits: { cost: 10, traffic: 5 } },
  { id: 'infra_edu', name: '대치동 학원가 드리프트형', emoji: '🎓', desc: '맹모삼천지교! 내 직장보다 아이 학원 위치가 더 중요한 교육열 만렙 부모님. 학군 좋고 유해시설 없는 클린한 동네를 선호해요.', traits: { infra: 8, safety: 7, nature: -2 } },
  { id: 'nature_hermit', name: '숲세권 은둔 고수형', emoji: '🌲', desc: '창문 열면 벽뷰는 질색! 숲뷰, 공원뷰를 보며 힐링해야 하는 자연인. 도심 속에서도 새소리를 들을 수 있는 숲세권을 찾아다니네요.', traits: { nature: 10, traffic: -2 } },
  { id: 'infra_food', name: '배달의민족 VVIP형', emoji: '🛵', desc: '맛집 배달 안 되는 지역은 유배지나 다름없음. 배달비 0원 구역과 먹자골목 근처를 사랑하는 진정한 미식가!', traits: { infra: 8, cost: 2 } },
  { id: 'traffic_gangnam', name: '강남행 교두보 헌터형', emoji: '🏙️', desc: '몸테크해서라도 강남 진입을 노린다! 강남 접근성이 좋다면 낡은 빌라도 OK. 성공을 향해 달리는 당신의 열정을 응원합니다.', traits: { traffic: 9, cost: -5, quality: -2 } },
  { id: 'nature_active', name: '한강공원 러닝 크루형', emoji: '🏃', desc: '한강 러닝 못 하면 근손실 오는 타입. 운동하기 좋고 산책로가 잘 정비된 수변 공원 근처가 당신의 로망 하우스!', traits: { nature: 9, infra: 5 } },
  { id: 'quality_option', name: '풀옵션 미니멀리스트형', emoji: '🧳', desc: '가구 살 돈도, 시간도 아깝다! 몸만 들어가면 해결되는 풀옵션 신축 오피스텔을 선호하는 심플 라이프 추구자.', traits: { quality: 9, cost: -2 } },
  { id: 'quality_parking', name: '주차장 보안 요원형', emoji: '🚗', desc: '내 차 긁히면 전쟁이야! 기계식 주차는 NO, 자주식 주차장 1.2대 이상 필수. 차를 끔찍이 아끼는 오너 드라이버.', traits: { quality: 8, traffic: 5 } },
  { id: 'quality_sound', name: '프로 집콕러형', emoji: '🎧', desc: '집은 최고의 휴식처. 층간소음은 절대 용납 못 해! 방음 잘 되고 조용한 주택가에서 나만의 시간을 즐기고 싶어해요.', traits: { quality: 10, infra: -2 } },
  { id: 'safety_community', name: '우리 동네 보안관형', emoji: '👮‍♀️', desc: '밤길 무서운 건 딱 질색. 24시간 경비원이 상주하고 커뮤니티 치안이 확실한 대단지나 오피스텔을 선호하시네요.', traits: { safety: 9, infra: 6 } },
  { id: 'quality_new', name: '가성비 신도시 이주민형', emoji: '🏗️', desc: '서울의 낡은 빌라 사느니 경기도 신축 아파트 간다! 쾌적한 주거 환경과 넓은 평수를 중요하게 생각하는 실리파.', traits: { quality: 9, traffic: -5 } },
  { id: 'infra_living', name: '1인 가구 세탁 요정형', emoji: '🧺', desc: '빨래방, 수선집, 24시 마트가 가까워야 해! 혼자 살아도 불편함 없이 살 수 있는 생활 밀착형 인프라를 중요시해요.', traits: { infra: 9, safety: 3 } },
  { id: 'quality_community', name: '커뮤니티 정복자형', emoji: '🏊', desc: '수영장, 헬스장, 독서실 딸린 아파트가 내 로망. 집 밖으로 안 나가도 단지 내에서 모든 걸 해결하고 싶은 리조트족.', traits: { quality: 10, nature: 5 } },
];

export const QUESTIONS: Question[] = [
  { q: '집을 구할 때 더 마음이 가는 문구는?', a: { text: 'CCTV·현관 보안 완벽 (안심 귀가)', scores: { safety: 5, quality: 2 } }, b: { text: '밤늦게까지 핫한 힙플레이스', scores: { infra: 5, safety: -2 } } },
  { q: '아침 출근길, 나의 허용 범위는?', a: { text: '지옥철 30분 서서 가기 (시간 단축)', scores: { traffic: 5, quality: -2 } }, b: { text: '앉아서 1시간 가기 (편안함)', scores: { quality: 3, traffic: -5 } } },
  { q: '주말 점심, 밥 먹으러 나갈 때', a: { text: '슬리퍼 신고 3분 컷 편의점/분식집', scores: { infra: 5 } }, b: { text: '차 타고 나가서 맛집 탐방', scores: { quality: 2, traffic: 2 } } },
  { q: '월세 10만원 더 내면?', a: { text: '신축 풀옵션, 몸만 오세요', scores: { quality: 5, cost: -5 } }, b: { text: '좀 낡았지만 저축 가능, 갓성비', scores: { cost: 5, quality: -2 } } },
  { q: '창문을 열었을 때 보이는 뷰는?', a: { text: '탁 트인 공원/숲 뷰 (힐링)', scores: { nature: 5, traffic: -2 } }, b: { text: '화려한 시티뷰 (성공의 맛)', scores: { traffic: 3, infra: 2 } } },
  { q: '골목길 가로등이 어둡다면?', a: { text: '절대 계약 안 함. 무서워!', scores: { safety: 5 } }, b: { text: '월세 싸면 뭐... 핸드폰 불 켜지', scores: { cost: 5, safety: -2 } } },
  { q: '친구 약속, 주로 어디서 잡아?', a: { text: '강남/홍대 무조건 핫플', scores: { traffic: 5, infra: 2 } }, b: { text: '우리 동네 홈파티 or 조용한 곳', scores: { quality: 3, infra: -2 } } },
  { q: '가장 참을 수 없는 것은?', a: { text: '윗집 쿵쿵 층간소음', scores: { quality: 5 } }, b: { text: '집 앞 도로 차 소리', scores: { nature: 2, traffic: -2 } } },
  { q: "배달 어플을 켰는데 '배달 불가' 지역이라면?", a: { text: '당장 이사 간다', scores: { infra: 5 } }, b: { text: '직접 해먹으면 되지 뭐 (요리왕)', scores: { cost: 2 } } },
  { q: '둘 중 하나만 선택한다면?', a: { text: '좁아도 신축+풀옵션', scores: { quality: 5, cost: -2 } }, b: { text: '구축이라도 운동장만한 방', scores: { cost: 3, quality: -2 } } },
  { q: '퇴근 후 나의 루틴은?', a: { text: '집 근처 공원 러닝/산책', scores: { nature: 5, quality: 2 } }, b: { text: '넷플릭스 보면서 뒹굴뒹굴', scores: { quality: 3, infra: 2 } } },
  { q: '차가 있는데 주차장이 없다면?', a: { text: '공영주차장 알아본다', scores: { cost: 3 } }, b: { text: '그 집에 어떻게 살아? 절대 불가', scores: { quality: 5 } } },
  { q: '1층 공동현관 보안문이 고장 났다면?', a: { text: '택배 받기 편하고 좋네 (긍정왕)', scores: { infra: 2, safety: -3 } }, b: { text: '불안해서 집주인에게 바로 전화', scores: { safety: 5 } } },
  { q: '대단지 아파트 커뮤니티 시설 (헬스장, 독서실)', a: { text: '있으면 무조건 쓴다. 로망임', scores: { quality: 5, cost: -2 } }, b: { text: '관리비만 비싸지... 안 씀', scores: { cost: 5 } } },
  { q: '언덕 위에 있는 뷰 맛집', a: { text: '매일 등산? 절대 못 해', scores: { traffic: 5 } }, b: { text: '뷰가 깡패다. 낭만 선택', scores: { nature: 5, traffic: -3 } } },
  { q: '부동산 구할 때 1순위 필터는?', a: { text: '가격 (보증금/월세)', scores: { cost: 8 } }, b: { text: '위치 (역세권/안전)', scores: { traffic: 4, safety: 4 } } },
];

export const TRAIT_LABELS: Record<string, string> = {
  safety: '#안전제일',
  traffic: '#역세권',
  infra: '#슬세권',
  cost: '#가성비',
  nature: '#숲세권',
  quality: '#신축/옵션',
};
