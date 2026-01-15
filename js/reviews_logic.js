// ==========================================
// 1. Constants & Configuration
// ==========================================
const SILLIM_CENTER = { lat: 37.4842, lng: 126.9296 };

const TypeNames = {
    'APT': '아파트', 'OP': '오피스텔', 'YH': '연립/다세대', 'DD': '단독/다가구'
};

const TypeColors = {
    'APT': '#3B82F6', // Blue
    'OP': '#8B5CF6',  // Purple
    'YH': '#F97316',  // Orange
    'DD': '#22C55E'   // Green
};

const NAMES = [
    "신림 푸르지오", "관악 휴먼시아", "봉천 두산", "서울대입구 아이원", "대학동 고시촌", "삼성산 주공",
    "신림 현대", "관악 파크", "봉천 우성", "서울대 자르비", "신림 동부", "봉천 벽산",
    "관악 산림", "일성 트루엘", "현대 이뮨", "신림 두산", "봉천 관악", "서울대 풍림"
];

const VILLA_NAMES = [
    "빌리지", "맨션", "캐슬", "하이츠", "스위트", "타워", "스테이트", "하우스", "팰리스", "뷰"
];

// GIS Mock Zones
const mockNoiseZones = [
    { center: new kakao.maps.LatLng(37.481, 126.925), radius: 250, label: '🚗 대로변 소음 주의' },
    { center: new kakao.maps.LatLng(37.485, 126.921), radius: 150, label: '🚄 철도 소음 주의' }
];
const mockAcademyZones = [
    { center: new kakao.maps.LatLng(37.478, 126.952), radius: 300, label: '🎓 봉천동 학원가' }
];
const mockHillZones = [
    { center: new kakao.maps.LatLng(37.470, 126.940), radius: 400, label: '⛰️ 급경사 구간' }
];

const recommendationData = {
    '1': ['신림동', '봉천동', '서원동'],
    '2': ['대학동', '조원동', '미성동']
};

const PersonaTypeNames = {
    '1': '청와대 경호실장형', '2': '순간이동 능력자형', '3': '프로 편의점 러버형', '4': '실속파 갓생러형',
    '5': '대치동 학원가 드리프트형', '6': '숲세권 은둔 고수형', '7': '배달의민족 VVIP형', '8': '강남행 교두보 헌터형',
    '9': '한강공원 러닝 크루형', '10': '풀옵션 미니멀리스트형', '11': '주차장 보안 요원형', '12': '프로 집콕러형',
    '13': '우리 동네 보안관형', '14': '가성비 신도시 이주민형', '15': '1인 가구 세탁 요정형', '16': '커뮤니티 정복자형'
};

// ==========================================
// 2. State Management
// ==========================================
let map;
let mapObjects = { zones: [], markers: [], cctv: [], overlays: [] };
let seoulData = null;
let listings = []; // Global Listings Data
let filteredData = []; // Filtered Result
let chartInstance = null;

// Filter State
let filterState = {
    types: new Set(['APT', 'OP', 'YH', 'DD']),
    size: 'all',
    dealType: 'monthly',
    budget: { depMin: 0, depMax: 999999, rentMin: 0, rentMax: 999999 },
    grades: new Set(['A', 'B', 'C', 'D'])
};

// UI View Modes
let currentViewMode = 'total';
let isPyeong = true;
let isPolygonVisible = true;
let isMarkerVisible = true;
let isReviewVisible = false;
let isCctvVisible = false;
let specialLayers = { noise: false, academy: false, hill: false };
let visibleCount = 20;

// ==========================================
// 3. Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    if (btn && menu) {
        btn.addEventListener('click', () => { menu.classList.toggle('hidden'); });
    }

    // 2. Generate Mock Data
    listings = generateMockListings(100);

    // 3. Init Map & List
    initMap();
    renderInitialList();
});

window.addEventListener('load', () => {
    activateSearch();
    const params = new URLSearchParams(window.location.search);
    const currentType = params.get('type') || params.get('persona');
    if (currentType) {
        setTimeout(() => applyPersonalization(currentType), 500);
    }
});

function initMap() {
    const container = document.getElementById('map');
    const options = { center: new kakao.maps.LatLng(SILLIM_CENTER.lat, SILLIM_CENTER.lng), level: 4 };
    map = new kakao.maps.Map(container, options);

    // Dev Badge
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '' || window.location.protocol === 'file:') {
        let badge = document.getElementById('dev-mode-badge');
        if (!badge) {
            badge = document.createElement('div');
            badge.id = 'dev-mode-badge';
            badge.innerText = '[DEV MODE]';
            badge.style.cssText = 'position:fixed; bottom:10px; left:10px; background:red; color:white; padding:4px 8px; font-size:12px; font-weight:bold; border-radius:4px; z-index:99999; pointer-events:none; font-family:sans-serif;';
            document.body.appendChild(badge);
        }
    }

    // Load GeoJSON Data
    kakao.maps.load(() => {
        const dataSource = (window.TENANT_NOTE_CONFIG && window.TENANT_NOTE_CONFIG.dataPath) ? window.TENANT_NOTE_CONFIG.dataPath : './data/seoul_hybrid_data.json';
        fetch(dataSource)
            .then(r => r.json())
            .then(data => {
                seoulData = data;
                drawPolygons(data);
                renderSpecialZones();
            })
            .catch(e => console.error("Data Load Error", e));
    });

    // Initial Render
    applyFilter();
    updateLayerPanelUI();

    // Zoom Event
    kakao.maps.event.addListener(map, 'zoom_changed', () => {
        const level = map.getLevel();
        if (level <= 3 && isCctvVisible && mapObjects.cctv.length === 0) {
            toggleLayer('cctv');
        }
    });
}

// ==========================================
// 4. Data Generators
// ==========================================
function generateMockListings(count) {
    const data = [];
    const types = ['APT', 'OP', 'YH', 'DD'];

    for (let i = 0; i < count; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        let name = '';

        if (type === 'APT') {
            name = NAMES[Math.floor(Math.random() * NAMES.length)];
        } else {
            name = VILLA_NAMES[Math.floor(Math.random() * VILLA_NAMES.length)] + ' ' + (Math.floor(Math.random() * 900) + 100) + '호';
        }

        // Heating
        let heatingMethod = '개별난방';
        let heatingFuel = '도시가스';
        const rHeat = Math.random();
        if (type === 'APT') {
            if (rHeat < 0.4) { heatingMethod = '지역난방'; heatingFuel = '열병합'; }
            else if (rHeat < 0.8) { heatingMethod = '개별난방'; heatingFuel = '도시가스'; }
            else { heatingMethod = '중앙난방'; heatingFuel = '도시가스'; }
        } else if (type === 'OP') {
            if (rHeat < 0.3) { heatingMethod = '지역난방'; heatingFuel = '열병합'; }
        } else {
            if (Math.random() < 0.05) heatingFuel = '기름/LPG';
        }

        const lat = 37.47 + (Math.random() * 0.03);
        const lng = 126.93 + (Math.random() * 0.04);

        // Properties
        const slope = (type === 'APT') ? Math.floor(Math.random() * 10) : Math.floor(Math.random() * 21);
        const noiseLevel = Math.floor(Math.random() * 40) + 40;
        const infraScore = Math.floor(Math.random() * 100);

        // Scores
        const scores = {
            traffic: Math.floor(Math.random() * 100),
            property_building: Math.floor(Math.random() * 60) + 40,
            security_safety: Math.floor(Math.random() * 60) + 40,
            living_comfort: Math.max(10, (Math.floor(Math.random() * 40) + 60) - (Math.max(0, slope - 5) * 3)),
            living_infra: infraScore,
            environment: Math.max(10, Math.floor(Math.random() * 100) - (noiseLevel >= 65 ? 20 : 0))
        };

        const weightedScore =
            (scores.traffic * 0.25) +
            (scores.property_building * 0.25) +
            (scores.living_infra * 0.15) +
            (scores.security_safety * 0.15) +
            (scores.living_comfort * 0.15) +
            (scores.environment * 0.05);

        let grade = 'C';
        if (weightedScore >= 85) grade = 'A';
        else if (weightedScore >= 55) grade = 'B';
        else if (weightedScore >= 20) grade = 'C';
        else grade = 'D';

        // Features
        const features = [];
        if (slope < 5) features.push("완전 평지");
        else if (slope > 15) features.push("등산 코스");
        if (noiseLevel > 70) features.push("소음 주의");
        if (infraScore > 80) features.push("역세권");
        if (scores.traffic > 80) features.push("초역세권");

        const item = {
            id: i,
            name: name,
            type: type,
            lat: lat,
            lng: lng,
            price: {
                d: Math.floor(Math.random() * 50000) + 5000,
                r: Math.floor(Math.random() * 200)
            },
            size: Math.floor(Math.random() * 30) + 10,
            slope: slope,
            noiseLevel: noiseLevel,
            heating: { method: heatingMethod, fuel: heatingFuel },
            scores: scores,
            finalScore: weightedScore,
            grade: grade,
            features: features,
            swot: null
        };
        item.swot = generateSWOT(item);
        data.push(item);
    }
    return data;
}

function generateSWOT(item) {
    const s = [], w = [], o = [], t = [];
    // Strength
    if (item.scores.traffic > 80) s.push("지하철역 도보 5분 초역세권");
    if (item.scores.living_comfort > 80) s.push("숲세권/팍세권 쾌적함");
    if (item.type === 'YH' && item.price.d < 20000) s.push("서울에서 보기 드문 가성비");
    if (item.grade === 'A') s.push("공인중개사 추천 특급 매물");
    // Weakness
    if (item.scores.traffic < 40) w.push("지하철역까지 마을버스 필요");
    if (item.slope > 10) w.push("매일 운동하는 오르막길");
    if (item.scores.property_building < 50) w.push("건물 노후화로 주차 협소");
    // Opportunity
    if (item.type === 'YH' || item.type === 'DD') {
        o.push("모아타운/신속통합기획 후보지 가능성");
        o.push("경전철 서부선 개통 호재");
    } else {
        o.push("주변 상권 리모델링 개발");
    }
    // Threat
    if (item.scores.traffic > 90) t.push("외부차량으로 보증금 인상 우려");
    else t.push("인근 공사로 미세먼지/소음 예상");

    if (s.length === 0) s.push("무난하고 평범한 입지");
    if (w.length === 0) w.push("딱히 큰 단점 없음");

    return { s, w, o, t };
}

function generateMockCCTV(center, count) {
    const data = [];
    for (let i = 0; i < count; i++) {
        let lat = center.lat + (Math.random() - 0.5) * 0.01;
        let lng = center.lng + (Math.random() - 0.5) * 0.01;
        data.push({
            id: `TN_CCTV_${i}`,
            lat: lat,
            lng: lng,
            source: Math.random() > 0.8 ? 'National' : 'Seoul',
            type: '방범용'
        });
    }
    return data;
}

// ==========================================
// 5. Map Rendering Logic
// ==========================================
function drawPolygons(geoJSON) {
    mapObjects.zones.forEach(z => z.setMap(null));
    mapObjects.zones = [];

    if (!geoJSON || !geoJSON.features) return;

    geoJSON.features.forEach(feature => {
        const props = feature.properties;
        const coords = feature.geometry.coordinates[0];
        const path = coords.map(c => new kakao.maps.LatLng(c[1], c[0]));

        // Grade Simulation for View Mode
        let grade = props.grade || 'C';
        if (currentViewMode !== 'total') {
            const hash = (props.adm_cd || '0').split('').reduce((a, b) => a + b.charCodeAt(0), 0) + currentViewMode.length;
            const r = (hash % 100) / 100;
            if (r > 0.7) grade = 'A';
            else if (r > 0.4) grade = 'B';
            else if (r > 0.2) grade = 'C';
            else grade = 'D';
        }

        // Filters
        if (!filterState.grades.has(grade)) return; // Skip rendering if filtered out

        // Styling
        let fillColor = '#f97316';
        if (grade === 'A') fillColor = '#22c55e';
        else if (grade === 'B') fillColor = '#eab308';
        else if (grade === 'C') fillColor = '#f97316';
        else if (grade === 'D') fillColor = '#ef4444';

        if (!isPolygonVisible) return;

        const polygon = new kakao.maps.Polygon({
            path: path,
            strokeWeight: 2,
            strokeColor: fillColor,
            strokeOpacity: 1,
            fillColor: fillColor,
            fillOpacity: 0.3,
            zIndex: 1
        });
        polygon.setMap(map);
        mapObjects.zones.push(polygon);

        kakao.maps.event.addListener(polygon, 'click', () => {
            alert(`동네 등급: ${grade} (${currentViewMode})`);
        });
    });
}

function renderSpecialZones() {
    mapObjects.overlays.forEach(o => o.setMap(null));
    mapObjects.overlays = [];

    const renderZone = (zones, color, bgClass) => {
        zones.forEach(z => {
            const circle = new kakao.maps.Circle({
                center: z.center, radius: z.radius, strokeWeight: 1, strokeColor: color,
                fillColor: color, fillOpacity: 0.2, zIndex: 5
            });
            circle.setMap(map);
            mapObjects.overlays.push(circle);

            const content = `<div class="${bgClass} text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-sm">${z.label}</div>`;
            const overlay = new kakao.maps.CustomOverlay({ position: z.center, content: content, yAnchor: 0, zIndex: 6 });
            overlay.setMap(map);
            mapObjects.overlays.push(overlay);
        });
    };

    if (specialLayers.noise) renderZone(mockNoiseZones, '#ef4444', 'bg-red-500');
    if (specialLayers.academy) renderZone(mockAcademyZones, '#8B5CF6', 'bg-purple-500');
    if (specialLayers.hill) renderZone(mockHillZones, '#78350f', 'bg-amber-800');
}

function renderMarkers() {
    mapObjects.markers.forEach(m => m.setMap(null));
    mapObjects.markers = [];

    if (!isMarkerVisible) return;

    // Grouping (Stacking)
    const groups = {};
    filteredData.forEach(item => {
        const key = `${item.lat.toFixed(5)},${item.lng.toFixed(5)}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
    });

    // Create Markers
    Object.values(groups).forEach(group => {
        const item = group[0];
        const count = group.length;
        const bgColor = TypeColors[item.type] || '#3B82F6';

        const content = document.createElement('div');
        content.className = 'listing-marker-v2';
        content.style.cssText = `
            background: ${bgColor}; color: white; padding: 6px 10px; border-radius: 8px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.2); display: flex; flex-direction: column; 
            align-items: center; position: relative; cursor: pointer; min-width: 60px;
        `;

        let badgeHtml = count > 1 ? `<span style="position:absolute; top:-8px; right:-8px; background:red; color:white; font-size:10px; font-weight:bold; padding:2px 6px; border-radius:12px; border:2px solid white;">+${count}</span>` : '';

        content.innerHTML = `
            <div style="font-size:11px; font-weight:bold;">${formatMoney(item.price.d, item.price.r)}</div>
            <div style="font-size:9px; opacity:0.9; margin-top:2px;">${formatArea(item.size)}</div>
            ${badgeHtml}
            <div style="position:absolute; bottom:-6px; left:50%; transform:translateX(-50%); width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:6px solid ${bgColor};"></div>
        `;

        content.onclick = () => {
            map.panTo(new kakao.maps.LatLng(item.lat, item.lng));
            if (count > 1) showGroupDetail(group);
            else showDetail(item);
        };

        const overlay = new kakao.maps.CustomOverlay({
            map: map,
            position: new kakao.maps.LatLng(item.lat, item.lng),
            content: content,
            yAnchor: 1,
            zIndex: 20
        });
        mapObjects.markers.push(overlay);
    });
}

// ==========================================
// 6. UI Rendering & Helpers
// ==========================================
function renderInitialList() {
    const listContainer = document.getElementById('sidebar-content');
    listContainer.innerHTML = `
        <div class="flex items-center justify-between mb-3 px-1 sticky top-0 bg-slate-50 z-10 py-1">
            <span class="text-xs font-bold text-slate-500">검색 결과 <span id="result-count" class="text-blue-600">0</span>건</span>
            <button onclick="resetFilters()" class="text-xs text-slate-400 underline hover:text-slate-600">초기화</button>
        </div>
        
        <div id="top-recommendation" class="hidden mb-4 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-4">
             <h3 class="text-sm font-bold text-indigo-800 mb-3 flex items-center">
                <i class="fa-solid fa-crown text-yellow-500 mr-2"></i>
                <span id="top-title">000</span>님이 선호하는 동네 TOP 3
             </h3>
             <div id="top-list" class="space-y-2"></div>
        </div>

        <div id="result-list" class="space-y-3 pb-8"></div>
        <div id="map-loader" class="hidden text-center py-4 text-xs text-slate-400">
            <i class="fa-solid fa-spinner fa-spin mr-1"></i> 데이터 처리 중..
        </div>
    `;
}

function renderList() {
    const listContainer = document.getElementById('result-list');
    if (!listContainer) return;

    const itemsToShow = filteredData.slice(0, visibleCount);
    listContainer.innerHTML = '';

    if (itemsToShow.length === 0) {
        listContainer.innerHTML = '<div class="text-center p-4 text-xs text-slate-400">결과 없음</div>';
        return;
    }

    itemsToShow.forEach(item => {
        const priceText = formatMoney(item.price.d, item.price.r);
        const areaText = formatArea(item.size);
        const badge = `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">${TypeNames[item.type]}</span>`;

        const div = document.createElement('div');
        div.className = "bg-white p-3 rounded-xl border border-slate-100 shadow-sm hover:border-blue-400 cursor-pointer transition-all";
        div.innerHTML = `
            <div class="flex justify-between items-center mb-1">
                ${badge}
                <span class="text-sm font-bold text-blue-600">${priceText}</span>
            </div>
            <div class="font-bold text-sm text-slate-800 mb-0.5 truncate">${item.name}</div>
            <div class="text-xs text-slate-500">${areaText} ∙ ${item.grade}등급</div>
         `;

        div.onclick = () => {
            map.panTo(new kakao.maps.LatLng(item.lat, item.lng));
            showDetail(item);
        };
        listContainer.appendChild(div);
    });
}

function applyFilter() {
    const loader = document.getElementById('map-loader');
    if (loader) loader.classList.remove('hidden');

    setTimeout(() => {
        const depMin = parseInt(document.getElementById('filter-dep-min')?.value || 0);
        const depMax = parseInt(document.getElementById('filter-dep-max')?.value || 999999);
        const rentMin = parseInt(document.getElementById('filter-rent-min')?.value || 0);
        const rentMax = parseInt(document.getElementById('filter-rent-max')?.value || 999999);

        filteredData = listings.filter(item => {
            if (!filterState.types.has(item.type)) return false;
            if (item.dealType !== filterState.dealType) return false;
            if (item.price.d < depMin || item.price.d > depMax) return false;
            if (item.price.r < rentMin || item.price.r > rentMax) return false;

            const s = item.size;
            if (filterState.size === 'under10' && s >= 10) return false;
            if (filterState.size === '10to20' && (s < 10 || s >= 20)) return false;
            if (filterState.size === 'over30' && s < 30) return false;

            return true;
        });

        const countEl = document.getElementById('result-count');
        if (countEl) countEl.innerText = filteredData.length;

        renderMarkers();
        renderList();
        renderDataGrid();

        if (loader) loader.classList.add('hidden');
    }, 50);
}

function applyPersonalization(typeId) {
    const recs = recommendationData[typeId] || recommendationData['1'];
    const toast = document.getElementById('persona-toast');
    const nameSpan = document.getElementById('persona-name');
    const typeName = PersonaTypeNames[typeId] || '맞춤형 인재';

    if (toast && nameSpan) {
        nameSpan.innerText = typeName;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('opacity-0', 'transition-opacity', 'duration-500');
            setTimeout(() => toast.classList.add('hidden'), 500);
        }, 4000);
    }

    const topRec = document.getElementById('top-recommendation');
    if (topRec) {
        topRec.classList.remove('hidden');
        document.getElementById('top-title').innerText = "고객";
        const list = document.getElementById('top-list');
        list.innerHTML = recs.map((loc, i) => `
            <div class="flex items-center justify-between bg-white/60 p-2 rounded-lg cursor-pointer hover:bg-white transition" onclick="map.panTo(new kakao.maps.LatLng(SILLIM_CENTER.lat, SILLIM_CENTER.lng))">
                <span class="text-xs font-bold text-slate-700">${i + 1}. ${loc}</span>
                <i class="fa-solid fa-chevron-right text-[10px] text-slate-400"></i>
            </div>
        `).join('');
    }
}

// --- Detail Views ---
function showDetail(item) {
    const container = document.getElementById('sidebar-content');
    const dynamicNaverUrl = `https://m.land.naver.com/search/result/${encodeURIComponent("관악구 신림동 " + item.name)}`;

    let slopeBadge = "";
    if (item.slope < 5) slopeBadge = `<span class="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded">완전 평지</span>`;
    else if (item.slope < 10) slopeBadge = `<span class="bg-yellow-100 text-yellow-700 text-[10px] px-1.5 py-0.5 rounded">완만한 언덕</span>`;
    else slopeBadge = `<span class="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded">급경사 (${item.slope}도)</span>`;

    container.innerHTML = `
        <div class="h-full flex flex-col animate-fade-in-right">
            <button onclick="renderInitialList(); applyFilter();" class="mb-2 text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 shrink-0">
                <i class="fa-solid fa-arrow-left"></i> 목록으로
            </button>
            
            <div class="flex-1 overflow-y-auto">
                <div class="bg-white rounded-2xl border border-slate-200 p-5 mb-4 shadow-sm">
                    <div class="flex justify-between items-start mb-2">
                        <h2 class="text-xl font-bold text-slate-900 leading-tight">${item.name}</h2>
                        <span class="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm shadow-blue-200">${item.grade}등급</span>
                    </div>
                    <div class="flex items-center gap-2 mb-4">
                        ${slopeBadge}
                        <span class="text-xs text-slate-500">${TypeNames[item.type]} ∙ ${formatArea(item.size)}</span>
                    </div>

                    <div class="relative h-64 w-full mb-4">
                        <canvas id="radarChart"></canvas>
                    </div>
                    
                    <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <h4 class="font-bold text-slate-800 text-sm mb-3">미래 가치 분석 (SWOT)</h4>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="bg-white p-3 rounded-lg border border-blue-100">
                                <div class="text-[10px] font-bold text-blue-600 mb-1">STRENGTH (강점)</div>
                                <ul class="text-[10px] text-slate-600 list-disc list-inside">${item.swot.s.map(t => `<li>${t}</li>`).join('')}</ul>
                            </div>
                            <div class="bg-white p-3 rounded-lg border border-red-100">
                                <div class="text-[10px] font-bold text-red-500 mb-1">WEAKNESS (약점)</div>
                                <ul class="text-[10px] text-slate-600 list-disc list-inside">${item.swot.w.map(t => `<li>${t}</li>`).join('')}</ul>
                            </div>
                            <div class="bg-white p-3 rounded-lg border border-green-100">
                                <div class="text-[10px] font-bold text-green-600 mb-1">OPPORTUNITY (기회)</div>
                                <ul class="text-[10px] text-slate-600 list-disc list-inside">${item.swot.o.map(t => `<li>${t}</li>`).join('')}</ul>
                            </div>
                            <div class="bg-white p-3 rounded-lg border border-orange-100">
                                <div class="text-[10px] font-bold text-orange-500 mb-1">THREAT (위협)</div>
                                <ul class="text-[10px] text-slate-600 list-disc list-inside">${item.swot.t.map(t => `<li>${t}</li>`).join('')}</ul>
                            </div>
                        </div>
                    </div>
                    
                    <a href="${dynamicNaverUrl}" target="_blank" class="mt-4 block w-full bg-[#03C75A] text-white font-bold py-3 rounded-xl text-center shadow hover:bg-[#02b351] transition">
                        <span class="text-sm">네이버 부동산 시세 보기</span>
                    </a>
                </div>
            </div>
        </div>
    `;
    setTimeout(() => renderChart(item), 100);
}

function showGroupDetail(group) {
    const container = document.getElementById('sidebar-content');
    container.innerHTML = `
         <div class="h-full flex flex-col p-2 animate-fade-in-right">
            <button onclick="renderInitialList(); applyFilter();" class="mb-2 text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1">
                <i class="fa-solid fa-arrow-left"></i> 목록으로
            </button>
            <h3 class="font-bold text-lg mb-4">이 위치 매물 (${group.length}개)</h3>
            <div class="space-y-3 overflow-y-auto pb-4">
                ${group.map(item => `
                    <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-blue-400" onclick="showDetail(listings[${item.id}])">
                        <h4 class="font-bold text-sm">${item.name}</h4>
                        <div class="text-xs text-slate-500 mt-1">${formatMoney(item.price.d, item.price.r)}</div>
                    </div>
                `).join('')}
            </div>
         </div>
     `;
}

function renderChart(item) {
    const ctx = document.getElementById('radarChart')?.getContext('2d');
    if (!ctx) return;
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['치안/안전', '물건/건물', '주거쾌적', '생활인프라', '교통', '환경'],
            datasets: [{
                label: '안심 점수',
                data: [
                    item.scores.security_safety,
                    item.scores.property_building,
                    item.scores.living_comfort,
                    item.scores.living_infra,
                    item.scores.traffic,
                    item.scores.environment
                ],
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: '#3B82F6',
                borderWidth: 2,
                pointBackgroundColor: '#3B82F6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    min: 0, max: 100,
                    ticks: { display: false, stepSize: 20 },
                    pointLabels: { font: { size: 11, family: 'Pretendard' }, color: '#64748b' }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function formatMoney(d, r) {
    let dStr = '';
    if (d >= 10000) {
        const eok = Math.floor(d / 10000);
        const man = d % 10000;
        dStr = `${eok}억${man > 0 ? ' ' + (man / 1000).toFixed(0) + '천' : ''}`;
    } else if (d > 0) dStr = `${d.toLocaleString()}`;

    if (r > 0) return d > 0 ? `${dStr} / ${r}` : `무보증 ${r}`;
    return dStr || '전세';
}

function formatArea(size) {
    if (isPyeong) return `${size}평`;
    return `${(size * 3.3).toFixed(1)}㎡`;
}

function toggleSidebar(show) {
    const sb = document.getElementById('sidebar');
    if (window.innerWidth < 768 && sb) {
        show ? sb.classList.remove('translate-y-full') : sb.classList.add('translate-y-full');
    }
}

// --- Interaction Handlers ---
function setDealType(t) {
    filterState.dealType = t;
    document.querySelectorAll('.deal-toggle-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`deal-${t}`).classList.add('active');
    applyFilter();
}
function setSize(s) {
    filterState.size = s;
    document.querySelectorAll('.filter-size-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`button[data-size="${s}"]`).classList.add('active');
    applyFilter();
}
function toggleType(t) {
    const btn = document.querySelector(`button[data-type="${t}"]`);
    if (filterState.types.has(t)) {
        filterState.types.delete(t);
        btn.classList.remove('active', 'bg-gray-50', 'text-slate-500'); // styles might need adjustment
        btn.classList.add('opacity-50');
    } else {
        filterState.types.add(t);
        btn.classList.remove('opacity-50');
        btn.classList.add('active');
    }
    applyFilter();
}
function resetFilters() {
    filterState = {
        types: new Set(['APT', 'OP', 'YH', 'DD']),
        size: 'all',
        dealType: 'monthly',
        budget: { depMin: 0, depMax: 999999, rentMin: 0, rentMax: 999999 },
        grades: new Set(['A', 'B', 'C', 'D'])
    };
    // Reset UI inputs
    document.getElementById('filter-dep-min').value = '';
    document.getElementById('filter-dep-max').value = '';
    document.getElementById('filter-rent-min').value = '';
    document.getElementById('filter-rent-max').value = '';
    // Reset Toggles (Visuals skipped for brevity)
    applyFilter();
}

function setMapColorMode(mode) {
    currentViewMode = mode;
    drawPolygons(seoulData);
}

function toggleGradeLayer(grade) {
    const btn = document.getElementById(`btn-grade-${grade}`);
    if (filterState.grades.has(grade)) {
        filterState.grades.delete(grade);
        btn.style.opacity = '0.4';
    } else {
        filterState.grades.add(grade);
        btn.style.opacity = '1.0';
    }
    drawPolygons(seoulData);
}

function toggleSpecialLayer(type, checked) {
    specialLayers[type] = checked;
    renderSpecialZones();
}

function toggleAreaUnit() {
    isPyeong = !isPyeong;
    const btnText = document.getElementById('area-unit-text');
    if (btnText) btnText.innerText = isPyeong ? '평' : '㎡';
    renderMarkers();
    // Also re-render list to update text
    renderList();
}

function toggleGrid() {
    const panel = document.getElementById('data-grid-panel');
    const icon = document.getElementById('grid-toggle-icon');
    if (panel.classList.contains('h-10')) {
        panel.classList.remove('h-10');
        panel.classList.add('h-64');
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
    } else {
        panel.classList.add('h-10');
        panel.classList.remove('h-64');
        icon.classList.add('fa-chevron-up');
        icon.classList.remove('fa-chevron-down');
    }
}

function renderDataGrid() {
    const tbody = document.getElementById('data-grid-body');
    const countSpan = document.getElementById('grid-count');
    if (!tbody) return;

    if (countSpan) countSpan.innerText = filteredData.length;
    tbody.innerHTML = filteredData.map(item => `
        <tr class="hover:bg-blue-50 cursor-pointer transition-colors" onclick="map.panTo(new kakao.maps.LatLng(${item.lat}, ${item.lng})); showDetail(listings[${item.id}]);">
            <td class="px-4 py-2 border-r border-gray-100 font-bold text-slate-500">${TypeNames[item.type]}</td>
            <td class="px-4 py-2 border-r border-gray-100 font-bold text-slate-800">${item.name}</td>
            <td class="px-4 py-2 text-center border-r border-gray-100 w-20">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${item.dealType === 'jeonse' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}">
                    ${item.dealType === 'jeonse' ? '전세' : '월세'}
                </span>
            </td>
            <td class="px-4 py-2 text-right border-r border-gray-100 font-bold text-blue-600">${formatMoney(item.price.d, item.price.r)}</td>
            <td class="px-4 py-2 text-right border-r border-gray-100 text-slate-500">${formatArea(item.size)}</td>
            <td class="px-4 py-2 text-right text-slate-400">2024.01.12</td>
        </tr>
    `).join('');
}

function activateSearch() {
    const searchInput = document.getElementById('keyword-input');
    const searchBtn = document.getElementById('search-btn'); // Note: ensure ID exists or remove
    if (!searchInput) return;

    const ps = new kakao.maps.services.Places();

    const runSearch = () => {
        const keyword = searchInput.value.trim();
        if (!keyword) { alert('검색어를 입력해주세요!'); return; }
        ps.keywordSearch(keyword, (data, status) => {
            if (status === kakao.maps.services.Status.OK) {
                const bounds = new kakao.maps.LatLngBounds();
                for (let i = 0; i < data.length; i++) {
                    bounds.extend(new kakao.maps.LatLng(data[i].y, data[i].x));
                }
                map.setBounds(bounds);
            } else {
                alert('검색 결과가 없습니다.');
            }
        });
    };

    if (searchBtn) searchBtn.onclick = runSearch;
    searchInput.onkeydown = (e) => { if (e.key === 'Enter') runSearch(); };
}
