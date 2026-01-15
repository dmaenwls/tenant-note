const MapCore = {
    map: null,
    markers: [],
    regionMarkers: [],
    analysisPolygons: [],

    // 1. 지도 초기화
    init: function (containerId) {
        const container = document.getElementById(containerId);
        const options = {
            center: new kakao.maps.LatLng(Config.DEFAULT_CENTER.lat, Config.DEFAULT_CENTER.lng),
            level: Config.DEFAULT_LEVEL
        };

        this.map = new kakao.maps.Map(container, options);
        console.log("✅ MapCore: 지도 생성 완료");

        // 지도 생성 후 지역 마커 렌더링 (데이터가 있다면)
        if (typeof PublicData !== 'undefined') {
            this.renderRegionMarkers(PublicData);
        }
    },

    // 4. 분석 오버레이(폴리곤) 표시
    showAnalysisOverlay: function (type) {
        // 기존 폴리곤 삭제
        this.clearAnalysisOverlay();

        if (typeof PublicData === 'undefined') return;

        Object.keys(PublicData).forEach(key => {
            const data = PublicData[key];
            if (!data.polygonPath) return;

            // 폴리곤 경로 변환
            const path = data.polygonPath.map(coord => new kakao.maps.LatLng(coord.lat, coord.lng));

            // 색상 결정 (안심/시세)
            let fillColor = '#cccccc';
            if (type === 'safety') {
                fillColor = data.colors.safety || '#cccccc';
            } else if (type === 'cost' || type === 'price') { // UI에서 price로 넘길수도 있음
                fillColor = data.colors.cost || '#cccccc';
            }

            const polygon = new kakao.maps.Polygon({
                map: this.map,
                path: path,
                strokeWeight: 2,
                strokeColor: fillColor,
                strokeOpacity: 0.8,
                fillColor: fillColor,
                fillOpacity: 0.4
            });

            this.analysisPolygons.push(polygon);

            // 폴리곤 클릭 시 리포트 보기
            kakao.maps.event.addListener(polygon, 'click', () => {
                if (typeof UIHandler !== 'undefined' && UIHandler.showReport) {
                    UIHandler.showReport(key);
                }
            });
        });
        console.log(`✅ MapCore: ${type} 분석 레이어 표시 완료`);
    },

    // 분석 폴리곤 지우기
    clearAnalysisOverlay: function () {
        this.analysisPolygons.forEach(p => p.setMap(null));
        this.analysisPolygons = [];
    },

    // 2. 매물 마커 렌더링
    renderMarkers: function (dataList) {
        // 기존 매물 마커 삭제
        this.clearPropertyMarkers();

        dataList.forEach(item => {
            const position = new kakao.maps.LatLng(item.lat, item.lng);

            // 매물 마커는 기본 마커
            const marker = new kakao.maps.Marker({
                position: position,
                title: item.title,
                clickable: true
            });

            marker.setMap(this.map);
            this.markers.push(marker);

            kakao.maps.event.addListener(marker, 'click', () => {
                alert(`[매물] ${item.title}\n가격: ${item.price}`);
            });
        });
        console.log(`✅ MapCore: 매물 마커 ${dataList.length}개 생성 완료`);
    },

    // 3. 지역 분석 마커 렌더링 (원형 마커 등)
    renderRegionMarkers: function (publicData) {
        // 기존 지역 마커 삭제
        this.clearRegionMarkers();

        Object.keys(publicData).forEach(key => {
            const region = publicData[key];
            const position = new kakao.maps.LatLng(region.location.lat, region.location.lng);

            // 지역 마커는 커스텀 오버레이 또는 다른 스타일의 마커 사용
            // 여기서는 구분을 위해 이미지 마커 사용 예시 (또는 그냥 타이틀로 구분)
            // 간단하게: 파란색 마커 이미지 적용 (카카오 샘플 이미지 활용)
            const imageSrc = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png";
            const imageSize = new kakao.maps.Size(24, 35);
            const markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize);

            const marker = new kakao.maps.Marker({
                position: position,
                title: region.name,
                image: markerImage,
                clickable: true
            });

            marker.setMap(this.map);
            this.regionMarkers.push(marker);

            // 클릭 시 리포트 보기
            kakao.maps.event.addListener(marker, 'click', () => {
                console.log(`지역 클릭: ${region.name}`);
                if (typeof UIHandler !== 'undefined' && UIHandler.showReport) {
                    UIHandler.showReport(key);
                }
            });
        });
        console.log(`✅ MapCore: 지역 마커 ${this.regionMarkers.length}개 생성 완료`);
    },

    // 매물 마커 지우기
    clearPropertyMarkers: function () {
        this.markers.forEach(m => m.setMap(null));
        this.markers = [];
    },

    // 지역 마커 지우기
    clearRegionMarkers: function () {
        this.regionMarkers.forEach(m => m.setMap(null));
        this.regionMarkers = [];
    },

    // 전체 초기화
    clearAll: function () {
        this.clearPropertyMarkers();
        this.clearRegionMarkers();
        this.clearAnalysisOverlay();
    }
};