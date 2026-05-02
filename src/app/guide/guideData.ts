export interface ChecklistItem {
  id: string;
  text: string;
}

export interface GuideInfo {
  title: string;
  desc: string;
}

export interface Step {
  id: number;
  mainFlow: boolean;
  title: string;
  icon: string;
  items: ChecklistItem[];
  guide: GuideInfo | null;
}

export const STEPS: Step[] = [
  {
    id: 1, mainFlow: true, title: '탐색/검증', icon: 'fa-magnifying-glass',
    items: [
      { id: 's1-1', text: '예산 설정 및 대출 가능도 조회하기' },
      { id: 's1-2', text: '부동산 앱으로 매물 리스트업 (3개 이상)' },
      { id: 's1-3', text: '등기부등본 열람 및 융자 확인' },
      { id: 's1-4', text: '가계약금 입금 및 영수증/문자 보관' },
    ],
    guide: {
      title: '등기부등본, 3초 컷 확인법!',
      desc: "'갑구'의 실제 소유자가 신분증과 일치하는지, '을구'의 채권최고액이 집값의 70%를 넘지 않는지 반드시 확인해야 안전합니다.",
    },
  },
  {
    id: 2, mainFlow: true, title: '계약/확정', icon: 'fa-file-signature',
    items: [
      { id: 's2-1', text: '특약사항(누수, 위반건축물 등) 넣기' },
      { id: 's2-2', text: '임대차 계약서 작성 및 날인' },
      { id: 's2-3', text: '주민센터/인터넷 등기소에서 확정일자 받기' },
      { id: 's2-4', text: '전세자금대출 신청 (확정일자부 계약서 필요)' },
    ],
    guide: {
      title: '확정일자, 미루면 큰일나요!',
      desc: "계약 당일에 바로 받아야 대항력이 가장 빨리 생깁니다. 주민센터 갈 시간이 없다면 '대법원 인터넷 등기소'에서 24시간 신청 가능하니 절대 미루지 마세요.",
    },
  },
  {
    id: 3, mainFlow: true, title: '입주 준비', icon: 'fa-boxes-packing',
    items: [
      { id: 's3-1', text: '이사업체 견적 비교 및 예약' },
      { id: 's3-2', text: '입주청소 업체 예약' },
      { id: 's3-3', text: '폐가전 무상수거 신청 (폐가전 방문수거)' },
      { id: 's3-4', text: '도시가스 전출 예약 (이즈톡/고객센터)' },
    ],
    guide: {
      title: '짐 싸기 전, 버리는 게 반!',
      desc: "이사 견적은 짐 양에 비례합니다. 1년 이상 안 쓴 물건은 과감히 버리세요. 냉장고 파먹기는 이사 2주 전부터 시작하는 것이 국룰입니다.",
    },
  },
  {
    id: 4, mainFlow: true, title: '입주/정산', icon: 'fa-truck-house',
    items: [
      { id: 's4-1', text: '잔금 이체 (이체한도 미리 증액 필수)' },
      { id: 's4-2', text: '관리비 정산 및 장기수선충당금 받기' },
      { id: 's4-3', text: '전입신고 (정부24 혹은 주민센터)' },
      { id: 's4-4', text: '현관 비밀번호 변경 및 와이파이 설치' },
    ],
    guide: {
      title: '전입신고는 이사 당일에!',
      desc: "잔금 치르고 짐 풀자마자 '전입신고'부터 하세요. 그래야 다음날 0시부터 보증금을 지키는 대항력이 생깁니다.",
    },
  },
  {
    id: 5, mainFlow: false, title: '거주/갱신', icon: 'fa-house-user',
    items: [
      { id: 's5-1', text: '[수리] 집주인 부담 vs 세입자 부담 확인하기' },
      { id: 's5-2', text: '[행정] 전입신고/확정일자 서류 잘 보관하기' },
      { id: 's5-3', text: '[만기] 계약 만료 3개월 전 통보 알림 설정' },
      { id: 's5-4', text: '[갱신] 묵시적 갱신 여부 체크' },
    ],
    guide: null,
  },
];
