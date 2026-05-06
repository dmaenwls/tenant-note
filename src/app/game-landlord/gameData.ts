export interface Choice {
  label: string;
  text: string;
  money: number;
  karma: number;
  stress: number;
  result: string;
}

export interface GameEvent {
  month: number;
  emoji: string;
  title: string;
  description: string;
  choiceA: Choice;
  choiceB: Choice;
}

export const EVENTS: GameEvent[] = [
  {
    month: 1, emoji: "🍜", title: "마라탕집 사장님의 눈물",
    description: "1층 마라탕집 사장님이 장사가 안 된다며 월세를 깎아달라고 운다.\n\"사장님... 저 여기서 3년인데... 제발요...\"",
    choiceA: { label: "A: 봐준다", text: "이번 달만 반값으로 깎아준다", money: -5, karma: 25, stress: -10, result: "사장님이 감동받아 마라탕 서비스를 보내왔다. 근데 월세는..?" },
    choiceB: { label: "B: 얄짤없다", text: "못 내면 나가세요. 명도소송 경고장", money: 15, karma: -10, stress: 10, result: "사장님이 울면서 나갔다. 동네 맘카페에 '악덕 건물주' 글이 올라왔다." },
  },
  {
    month: 2, emoji: "💧", title: "한파에 터진 수도관",
    description: "영하 15도 한파에 건물 수도관이 터졌다.\n2층 미용실 원장님이 새벽 2시에 전화한다.\n\"사장님! 물 폭포예요!\"",
    choiceA: { label: "A: 즉시 수리", text: "업체 불러서 긴급 수리. 비용은 내가 다 낸다", money: -10, karma: 20, stress: -15, result: "150만원 날렸지만 세입자들의 신뢰를 얻었다." },
    choiceB: { label: "B: 못 들은 척", text: "새벽이라 안 받음. 내일 아침에 연락할게~", money: 0, karma: -10, stress: 10, result: "아침에 보니 1층까지 침수됐다. 수리비가 3배로 불어났다." },
  },
  {
    month: 3, emoji: "🐀", title: "치킨집 바퀴벌레 대란",
    description: "3층 원룸 세입자가 사진을 보내왔다.\n바퀴벌레가 줄지어 행진 중이다.\n원인은 1층 치킨집 기름받이.",
    choiceA: { label: "A: 방역 올인", text: "전층 방역 + 치킨집에 시설 개선 요구", money: -10, karma: 25, stress: -10, result: "50만원 들어 전층 방역 완료. 세입자들이 \"역시 우리 건물주님\" 칭찬." },
    choiceB: { label: "B: 네 방은 네가 알아서", text: "각자 방은 각자 관리하세요. 세스코는 본인 부담", money: 10, karma: -10, stress: 10, result: "세입자 2명이 이사 통보했다. 공실 2개 발생." },
  },
  {
    month: 4, emoji: "🌸", title: "봄맞이 월세 인상 타이밍",
    description: "전세 시세가 올라서 주변 건물들은 전부 월세를 올렸다.\n내 건물만 3년째 동결 상태.\n\"나도 올려야 하나...\"",
    choiceA: { label: "A: 5% 인상", text: "법적 범위 내에서 소폭 인상. 미리 통보", money: 20, karma: 0, stress: 5, result: "세입자들이 투덜거리지만 이해해줬다. 통장 잔고가 좀 늘었다." },
    choiceB: { label: "B: 동결 유지", text: "힘든 세상, 올리기 미안하다. 그냥 둔다", money: 0, karma: 30, stress: -15, result: "세입자들이 감동받아 건물 관리를 자발적으로 도와준다." },
  },
  {
    month: 5, emoji: "🔊", title: "층간소음 전쟁 발발",
    description: "2층: \"3층에서 새벽 3시에 줄넘기를 한다.\"\n3층: \"2층 음식 냄새 때문에 못 살겠다.\"\n둘 다 건물주한테 해결해달라며 전화 폭탄.",
    choiceA: { label: "A: 중재 나선다", text: "세 사람 모여서 대화. 중간에서 조율한다", money: 0, karma: 20, stress: 5, result: "3시간 동안 전쟁터. 간신히 화해시켰지만 내 스트레스는 만렙." },
    choiceB: { label: "B: 개입 안 함", text: "세입자끼리 해결하세요. 저는 판사가 아닙니다", money: 0, karma: -5, stress: 5, result: "2층 세입자가 국민신문고에 민원 넣었다. 건물주 소환 통보." },
  },
  {
    month: 6, emoji: "🏗️", title: "옆 건물 신축 공사 소음",
    description: "옆 건물이 재건축에 들어갔다.\n하루종일 \"쾅쾅쾅\" 소리에 세입자들 단체 항의.\n\"사장님, 이거 월세 깎아줘야 하는 거 아니에요?\"",
    choiceA: { label: "A: 방음 공사", text: "이중창 교체 + 방음재 시공. 내 돈으로 해결", money: -15, karma: 25, stress: -10, result: "300만원 증발. 하지만 세입자들이 현수막을 걸어줬다." },
    choiceB: { label: "B: 이건 내 탓이 아님", text: "옆 건물 문제를 왜 나한테? 참고 사세요", money: 10, karma: -10, stress: 5, result: "세입자 절반이 계약 만료 후 이사 예고. 공실 공포." },
  },
  {
    month: 7, emoji: "🌊", title: "폭우에 지하 침수",
    description: "기록적 폭우로 지하 주차장이 완전 침수됐다.\n세입자 차량 3대가 물에 잠겼다.\n\"사장님, 차 보상해주셔야죠!?\"",
    choiceA: { label: "A: 일부 보상", text: "내 보험으로 처리 + 위로금 지급. 배수 시설 보강", money: -15, karma: 30, stress: 0, result: "500만원 나갔다. 하지만 소송 대신 감사 인사를 받았다." },
    choiceB: { label: "B: 천재지변임", text: "불가항력입니다. 각자 보험으로 처리하세요", money: 0, karma: -15, stress: 10, result: "세입자 연합이 변호사를 선임했다. 뉴스에 제보됐다." },
  },
  {
    month: 8, emoji: "🐶", title: "반려동물 무단 입주",
    description: "계약서에 '반려동물 불가'인데,\n4층 세입자가 골든 리트리버를 키우고 있다.\n다른 세입자들이 \"짖는 소리 때문에 못 살겠다\"고 항의.",
    choiceA: { label: "A: 눈 감아준다", text: "조용히만 키우면 봐줄게. 대신 보증금 추가", money: 10, karma: 15, stress: 0, result: "강아지가 잘 적응했다. 근데 다른 세입자도 고양이를 들여왔다." },
    choiceB: { label: "B: 계약 위반 퇴거", text: "계약서 들이밀며 시정 요구. 2주 안에 조치", money: 0, karma: -10, stress: 5, result: "세입자가 SNS에 '강아지 쫓아내는 악덕 건물주' 영상 올림. 조회수 50만." },
  },
  {
    month: 9, emoji: "💸", title: "월세 3개월 밀린 세입자",
    description: "5층 자취생이 월세를 3개월째 안 낸다.\n연락하면 \"다음 달에 꼭요...\" 만 반복.\n알고 보니 취업 실패로 형편이 어려운 상황.",
    choiceA: { label: "A: 분할 납부 허용", text: "사정이 딱하니 6개월 분할로 밀린 거 받겠다", money: -10, karma: 30, stress: 0, result: "세입자가 취업 성공해 밀린 월세를 한꺼번에 갚았다!" },
    choiceB: { label: "B: 내용증명 발송", text: "더 이상 못 참아. 법적 절차 들어갑니다", money: 15, karma: -10, stress: 10, result: "세입자가 야반도주했다. 방에 쓰레기 산더미. 원상복구비 200만원." },
  },
  {
    month: 10, emoji: "🎃", title: "건물 외벽 균열 발견",
    description: "가을 점검 중 건물 외벽에 균열이 발견됐다.\n구청에서 안전진단 받으라고 통보.\n수리비 견적이 어마어마하다.",
    choiceA: { label: "A: 즉시 보수", text: "안전이 최우선. 대출받아서라도 바로 공사", money: -15, karma: 20, stress: 5, result: "통장이 텅 비었지만, 건물 수명이 20년 연장됐다." },
    choiceB: { label: "B: 최소한만 땜빵", text: "표면만 메우고 일단 넘긴다. 돈이 없어...", money: 0, karma: -5, stress: 10, result: "겨울에 균열이 더 벌어졌다. 구청 시정명령 + 과태료 통보." },
  },
  {
    month: 11, emoji: "🔥", title: "보일러 동시 고장",
    description: "첫 한파에 보일러가 3개 층에서 동시에 고장.\n세입자들이 \"추워서 못 살겠다\"며 단체 채팅방 폭발.\n견적: 개당 80만원 × 3대 = 240만원.",
    choiceA: { label: "A: 전부 교체", text: "3대 전부 새 보일러로 교체. 카드 할부", money: -15, karma: 30, stress: -10, result: "세입자들이 따뜻한 겨울. 감사 선물이 왔다. 통장은 얼어붙었다." },
    choiceB: { label: "B: 수리로 버틴다", text: "교체는 무리. 수리 기사 불러서 응급처치만", money: 0, karma: -5, stress: 10, result: "수리한 보일러가 일주일 만에 또 고장. \"진짜 이러실 겁니까?\"" },
  },
  {
    month: 12, emoji: "🎄", title: "연말 세금 폭탄",
    description: "종합부동산세 + 재산세 + 건강보험료 인상 통보가 한꺼번에.\n합산하니 올해 수익의 절반이 세금.\n\"건물주가 이렇게 힘든 거였어...?\"",
    choiceA: { label: "A: 순순히 납부", text: "세금은 국민의 의무지... 울면서 낸다", money: -10, karma: 20, stress: 5, result: "통장 잔고: 37원. 하지만 양심은 깨끗하다." },
    choiceB: { label: "B: 절세 전략 가동", text: "세무사 고용해서 감가상각, 경비 처리 최대한 활용", money: 0, karma: 0, stress: 0, result: "합법적으로 세금을 줄였다. 세무사 비용 100만원은 아깝지 않다." },
  },
];

export interface EndingData {
  id: number;
  title: string;
  emoji: string;
  color: string;
  description: string;
  type: "A" | "B" | "C" | "D";
  quote: string;
}

export const ENDINGS: EndingData[] = [
  // Type A: Money High, Karma Low (Capitalism Monster)
  { id: 1, type: "A", title: "강남 폭군 조물주", emoji: "🤑", color: "from-yellow-400 to-amber-600", description: "피도 눈물도 없는 수익 극대화!\n세입자의 눈물은 당신의 와인입니다.", quote: "세입자의 눈물은 나의 와인! 나는 강남 폭군 조물주다" },
  { id: 2, type: "A", title: "어둠의 디벨로퍼", emoji: "🏗️", color: "from-slate-700 to-black", description: "법의 틈새를 파고드는 젠트리피케이션의 주역.\n당신이 지나간 자리엔 스타벅스만 남습니다.", quote: "내 사전에 양보란 없다. 법대로 합시다." },
  { id: 3, type: "A", title: "엑셀 피도눈물 마스터", emoji: "📊", color: "from-blue-600 to-cyan-600", description: "모든 것은 숫자로 말한다.\n인정사정 없는 칼같은 월세 인상률 5%의 맹수.", quote: "감정은 사치일 뿐, 내 통장 잔고가 진짜다." },
  { id: 4, type: "A", title: "내용증명 콜렉터", emoji: "📜", color: "from-red-700 to-rose-900", description: "말보다 법이 빠른 당신.\n세입자들은 우편물 오토바이 소리만 들어도 떱니다.", quote: "월세 하루 밀렸네요. 내용증명 발송했습니다." },

  // Type B: Karma High, Money Low (Pushover / Angel)
  { id: 5, type: "B", title: "마이너스 마더 테레사", emoji: "👼", color: "from-emerald-300 to-teal-500", description: "세입자들의 칭송을 한몸에 받지만\n당신의 통장은 피눈물을 흘리고 있습니다.", quote: "다들 힘들 텐데 월세 깎아줄게... (내 대출이자는 어쩌지)" },
  { id: 6, type: "B", title: "움직이는 ATM기", emoji: "🏧", color: "from-pink-400 to-rose-400", description: "세입자가 부르면 언제든 지갑을 여는 당신.\n건물주인지 자선사업가인지 헷갈립니다.", quote: "보일러 고장났다고? 당장 최고급으로 바꿔줄게!" },
  { id: 7, type: "B", title: "호구 잡힌 동네 북", emoji: "🥁", color: "from-orange-300 to-amber-500", description: "마음이 약해 거절을 못하는 당신.\n동네방네 착한 건물주로 소문나 진상이 꼬입니다.", quote: "제가 다 잘못했습니다... 월세는 천천히 내세요." },
  { id: 8, type: "B", title: "명예 사회복지사", emoji: "🎗️", color: "from-sky-300 to-blue-500", description: "임대업을 빙자한 사회공헌 활동 중.\n이번 달 국세청에서 상장이라도 줘야 합니다.", quote: "수익률 0%라도 우리 세입자들만 행복하다면..." },

  // Type C: Balanced (Average / Survival)
  { id: 9, type: "C", title: "밀당의 고수", emoji: "🤹", color: "from-purple-500 to-fuchsia-500", description: "당근과 채찍을 완벽하게 구사하는 당신.\n이 시대가 원하는 진정한 K-건물주입니다.", quote: "줄 건 주고, 받을 건 확실히 받는다!" },
  { id: 10, type: "C", title: "무념무상 은둔 고수", emoji: "🧘", color: "from-zinc-400 to-stone-500", description: "적당히 타협하고 적당히 무시합니다.\n스트레스 안 받는 게 최고의 수익률이죠.", quote: "알아서들 사시겠지... 내 알 바 아님." },
  { id: 11, type: "C", title: "얄미운 박쥐형 조물주", emoji: "🦇", color: "from-indigo-500 to-purple-700", description: "눈치 하나로 1년을 버텼습니다.\n강자에게 약하고 약자에게 강한 생존의 달인.", quote: "아이고 사장님~ (뒤돌아서) 월세 5% 인상 고지서 보내." },
  { id: 12, type: "C", title: "소시민 꼬마 건물주", emoji: "🏪", color: "from-lime-500 to-green-600", description: "큰 욕심 없이 소소한 월세 수익에 만족.\n가끔 1층 편의점에서 맥주 까는 게 유일한 낙입니다.", quote: "오늘도 무사히... 이번 달 대출 이자 냈다!" },

  // Type D: Game Over (Instant or Extreme conditions)
  { id: 13, type: "D", title: "탈모 갤러리 정회원", emoji: "👨‍🦲", color: "from-gray-700 to-gray-900", description: "스트레스 폭발로 머리가 다 빠졌습니다.\n결국 건물을 던지고 산으로 들어갔습니다.", quote: "건물주 하면 편할 줄 알았지... 내 머리 돌려놔..." },
  { id: 14, type: "D", title: "강제 경매 파산자", emoji: "💀", color: "from-red-900 to-black", description: "자산이 0이 되어 은행이 건물을 가져갔습니다.\n다시 원룸 세입자로 돌아갑니다.", quote: "내 건물이었던 것... 한순간의 꿈이었구나." },
  { id: 15, type: "D", title: "세금의 노예", emoji: "💸", color: "from-blue-800 to-slate-800", description: "12월 종부세를 내지 못해 국세청에 압류당했습니다.\n월세 받아 세금 내면 남는 게 없습니다.", quote: "건물주라 부르지 마라. 나는 국가의 징수원일 뿐." },
  { id: 16, type: "D", title: "해탈한 생불", emoji: "✨", color: "from-yellow-100 to-amber-200", description: "돈도 잃고 명예도 잃었지만 스트레스도 사라졌습니다.\n속세의 굴레를 벗어던지고 열반에 올랐습니다.", quote: "공수래공수거... 건물 따위 덧없는 것을..." },
];
