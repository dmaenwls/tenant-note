const UIHandler = {
    state: {
        activeLayers: new Set(),
        isReportVisible: false,
        currentRegion: null
    },

    init: function () {
        console.log("✅ UIHandler: UI 초기화 완료");
        // 초기 로드시 신림동 데이터로 리포트 업데이트 테스트
        // 실제로는 지도에서 지역 선택 시 호출됨
        // this.updateReport('sinlim'); 
    },

    // 1. 리포트 표시 (지역 데이터 연동)
    showReport: function (regionKey) {
        const data = PublicData[regionKey];
        if (!data) return;

        this.state.currentRegion = regionKey;

        // DOM 요소 업데이트
        document.getElementById('report-title').innerText = `${data.name} 분석 리포트`;

        // 종합 점수 (안전 점수 기준)
        document.getElementById('report-score').innerText = `${data.scores.safety}점`;

        const gradeEl = document.getElementById('report-grade');
        gradeEl.innerText = `(${data.grades.safety})`;
        this.applyGradeStyle(gradeEl, data.grades.safety);

        // 상세 리포트 텍스트 업데이트
        // 치안: 등급 + 멘트 + 경찰서 수
        document.getElementById('report-safety').innerText =
            `[${data.grades.safety}] ${data.report.safety} (경찰서 ${data.stats.police}곳)`;

        // 편의: 점수 + 멘트
        document.getElementById('report-infra').innerText =
            `[${data.grades.infra}] ${data.report.infra}`;

        // 시세: 등급 + 멘트 + 평균 월세
        document.getElementById('report-rent').innerText =
            `[${data.grades.cost}] ${data.report.cost} (평균 ${data.stats.rentAvg})`;

        // 리포트 패널 보이기
        this.toggleReportPanel(true);
    },

    // 2. 등급별 스타일 적용 (A/B/C/F)
    applyGradeStyle: function (element, grade) {
        // 기존 색상 클래스 초기화
        element.className = 'text-sm font-bold ml-1 px-2 py-0.5 rounded';

        // A+, B- 등에서 첫 글자만 따서 판별
        const firstChar = grade.charAt(0).toUpperCase();

        if (firstChar === 'A') {
            element.classList.add('badge-grade-a');
        } else if (firstChar === 'B') {
            element.classList.add('badge-grade-b');
        } else if (firstChar === 'C') {
            element.classList.add('badge-grade-c');
        } else if (firstChar === 'D' || firstChar === 'F') {
            element.classList.add('badge-grade-f');
        } else {
            element.classList.add('bg-gray-100', 'text-gray-600');
        }
    },

    toggleLayer: function (layerType, buttonElement) {
        // 1. 상태 토글
        if (this.state.activeLayers.has(layerType)) {
            this.state.activeLayers.delete(layerType);
            this.deactivateButton(buttonElement);
            console.log(`Layer OFF: ${layerType}`);

            // 레이어 끄기 로직
            if (layerType === 'safety' || layerType === 'price') {
                if (typeof MapCore !== 'undefined') MapCore.clearAnalysisOverlay();
            } else if (layerType === 'convenience') {
                // 편의시설 마커 제거 로직 (구현 필요 시 추가)
                // MapCore.clearCategoryMarkers(); 
            }

        } else {
            // 다른 분석 레이어가 켜져있다면 끄기 (상호 배타적 동작 유도)
            if (this.state.activeLayers.has('safety')) this.toggleLayer('safety', this.getButtonByType('safety'));
            if (this.state.activeLayers.has('price')) this.toggleLayer('price', this.getButtonByType('price'));
            if (this.state.activeLayers.has('convenience')) this.toggleLayer('convenience', this.getButtonByType('convenience'));

            this.state.activeLayers.add(layerType);
            this.activateButton(buttonElement);
            console.log(`Layer ON: ${layerType}`);

            // 레이어 켜기 로직
            if (layerType === 'safety') {
                if (typeof MapCore !== 'undefined') MapCore.showAnalysisOverlay('safety');
            } else if (layerType === 'convenience') {
                if (typeof MapCore !== 'undefined' && MapCore.searchPlaces) {
                    MapCore.searchPlaces('CS2');
                } else {
                    console.log("편의시설 검색 로직은 아직 구현되지 않았습니다.");
                }
            } else if (layerType === 'price') {
                if (typeof MapCore !== 'undefined') MapCore.showAnalysisOverlay('cost');
            }
        }

        // 2. 리포트 패널 연동 (하나라도 켜지면 리포트 표시, 다 꺼지면 숨김)
        if (this.state.activeLayers.size > 0) {
            this.toggleReportPanel(true);
        } else {
            this.toggleReportPanel(false);
        }
    },

    // 버튼 요소 찾기 헬퍼 (단순화를 위해 document.querySelectorAll 사용)
    getButtonByType: function (type) {
        // 실제로는 더 정확한 선택자가 필요하지만, 현재 구조상 텍스트나 onclick 속성으로 찾거나, 
        // 토글 시 this를 넘겨주므로 상호 배타적 로직을 위해 전체 버튼을 관리하는 게 좋음.
        // 여기서는 간단히 생략하거나, 필요한 경우 구현.
        // 데모 목적상 상호 배타적 로직인 '다른 레이어 끄기' 부분의 this.toggleLayer 호출 시 buttonElement가 필요함.
        // 현재로선 buttonElement를 찾기 어려우므로 상호 배타적 로직을 주석처리하거나, activeLayers만 관리.
        return null; // 실제 구현 시 수정 필요
    },

    toggleReportPanel: function (show) {
        const reportPanel = document.getElementById('analysis-report');
        if (!reportPanel) return;

        this.state.isReportVisible = show;
        if (show) {
            reportPanel.classList.remove('hidden');
        } else {
            reportPanel.classList.add('hidden');
            // 리포트를 끌 때 레이어 상태도 초기화할지 여부는 기획에 따라 결정 (여기선 유지)
        }
    },

    activateButton: function (btn) {
        if (!btn) return;
        // 활성화 스타일 적용 (Tailwind)
        btn.classList.add('bg-blue-50', 'border-blue-200');
        btn.classList.remove('bg-white', 'border-gray-100');
    },

    deactivateButton: function (btn) {
        if (!btn) return;
        // 비활성화 스타일 적용
        btn.classList.add('bg-white', 'border-gray-100');
        btn.classList.remove('bg-blue-50', 'border-blue-200');
    }
};