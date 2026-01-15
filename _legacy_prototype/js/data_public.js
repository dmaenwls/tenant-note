const PublicData = {
    sinlim: {
        name: "관악구 신림동",
        location: { lat: 37.4842, lng: 126.9296 },
        // 사각형 폴리곤 좌표 (중심 기준 대략적 영역)
        polygonPath: [
            { lat: 37.4880, lng: 126.9240 },
            { lat: 37.4880, lng: 126.9350 },
            { lat: 37.4800, lng: 126.9350 },
            { lat: 37.4800, lng: 126.9240 }
        ],
        colors: {
            safety: "#fbbf24", // B등급 (노랑)
            cost: "#10b981"    // 저렴함 (초록)
        },
        scores: { safety: 78, infra: 92, cost: 95 },
        grades: { safety: "B-", infra: "A+", cost: "A" },
        report: {
            safety: "CCTV는 많으나 유동인구가 많아 밤길 주의 필요",
            infra: "편의점, 코인세탁소 밀집도 서울 상위 10%",
            cost: "월세 평균 45만원으로 가성비 최상"
        },
        stats: {
            police: 4,
            cctv: "많음",
            rentAvg: "500/45",
            jeonseRisk: "85%"
        }
    },
    yeoksam: {
        name: "강남구 역삼동",
        location: { lat: 37.5008, lng: 127.0369 },
        polygonPath: [
            { lat: 37.5050, lng: 127.0310 },
            { lat: 37.5050, lng: 127.0420 },
            { lat: 37.4960, lng: 127.0420 },
            { lat: 37.4960, lng: 127.0310 }
        ],
        colors: {
            safety: "#10b981", // A등급 (초록)
            cost: "#ef4444"    // 비쌈 (빨강)
        },
        scores: { safety: 95, infra: 98, cost: 40 },
        grades: { safety: "A", infra: "A+", cost: "D" },
        report: {
            safety: "오피스 밀집 지역으로 24시간 밝은 거리 유지",
            infra: "모든 편의시설 도보 5분 내, 대형마트 인접",
            cost: "평균 월세 90만원 시작, 관리비 별도 주의"
        },
        stats: {
            police: 6,
            cctv: "최고 수준",
            rentAvg: "1000/90",
            jeonseRisk: "55%"
        }
    },
    yeouido: {
        name: "영등포구 여의도동",
        location: { lat: 37.5215, lng: 126.9242 },
        polygonPath: [
            { lat: 37.5260, lng: 126.9180 },
            { lat: 37.5260, lng: 126.9300 },
            { lat: 37.5160, lng: 126.9300 },
            { lat: 37.5160, lng: 126.9180 }
        ],
        colors: {
            safety: "#10b981", // A등급
            cost: "#ef4444"    // 매우 비쌈
        },
        scores: { safety: 90, infra: 85, cost: 30 },
        grades: { safety: "A-", infra: "B+", cost: "D-" },
        report: {
            safety: "거주 구역과 업무 구역이 분리되어 쾌적함",
            infra: "백화점, 공원 등 대형 인프라 우수하나 생활물가 높음",
            cost: "직장인 수요 높아 전월세 매우 비쌈"
        },
        stats: {
            police: 3,
            cctv: "많음",
            rentAvg: "2000/120",
            jeonseRisk: "60%"
        }
    },
    itaewon: {
        name: "용산구 이태원동",
        location: { lat: 37.5340, lng: 126.9940 },
        polygonPath: [
            { lat: 37.5390, lng: 126.9880 },
            { lat: 37.5390, lng: 127.0000 },
            { lat: 37.5290, lng: 127.0000 },
            { lat: 37.5290, lng: 126.9880 }
        ],
        colors: {
            safety: "#f59e0b", // C+ (주황/노랑)
            cost: "#3b82f6"    // 보통 (파랑)
        },
        scores: { safety: 72, infra: 88, cost: 70 },
        grades: { safety: "C+", infra: "B", cost: "B" },
        report: {
            safety: "주말 심야 시간대 소음 및 취객 주의 필요",
            infra: "이국적인 식당/카페 많음, 생활편의는 보통",
            cost: "구릉지 빌라 위주로 가격대 다양함"
        },
        stats: {
            police: 2,
            cctv: "보통",
            rentAvg: "1000/80",
            jeonseRisk: "65%"
        }
    },
    hongdae: {
        name: "마포구 서교동 (홍대)",
        location: { lat: 37.5563, lng: 126.9229 },
        polygonPath: [
            { lat: 37.5610, lng: 126.9160 },
            { lat: 37.5610, lng: 126.9290 },
            { lat: 37.5510, lng: 126.9290 },
            { lat: 37.5510, lng: 126.9160 }
        ],
        colors: {
            safety: "#fbbf24", // B (노랑)
            cost: "#3b82f6"    // 보통 (파랑)
        },
        scores: { safety: 82, infra: 99, cost: 85 },
        grades: { safety: "B", infra: "A+", cost: "A-" },
        report: {
            safety: "상권 발달해 늦게까지 밝으나 소음 발생 가능",
            infra: "교통, 문화, 편의시설 서울 최상위권",
            cost: "대학가 주변으로 쉐어하우스 등 옵션 다양"
        },
        stats: {
            police: 5,
            cctv: "많음",
            rentAvg: "1000/70",
            jeonseRisk: "75%"
        }
    }
};
