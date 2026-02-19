'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    RadarController
} from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, RadarController);

// ----------------------------------------------------------------------
// HELPER FUNCTIONS (Static)
// ----------------------------------------------------------------------
const getPolygonCenter = (path: any[]) => {
    let latSum = 0;
    let lngSum = 0;
    path.forEach(p => {
        latSum += p.getLat();
        lngSum += p.getLng();
    });
    return new window.kakao.maps.LatLng(latSum / path.length, lngSum / path.length);
};

// ----------------------------------------------------------------------
// DATA CONSTANTS (Restored from reviews.html)
// ----------------------------------------------------------------------


const HOUSING_TYPE_LABELS: Record<string, string> = {
    'APT': '아파트',
    'OP': '오피스텔',
    'YH': '연립/다세대',
    'DD': '단독/다가구'
};


declare global {
    interface Window {
        kakao: any;
    }
}

export default function MapPage() {
    // ----------------------------------------------------------------------
    // STATE
    // ----------------------------------------------------------------------
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null); // To prevent re-initialization
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // UI State
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [layerPanelOpen, setLayerPanelOpen] = useState(false);
    const [isLegendOpen, setIsLegendOpen] = useState(false); // Map Legend State

    // Selection State
    const [selectedListing, setSelectedListing] = useState<any>(null);
    const [selectedZone, setSelectedZone] = useState<any>(null); // New Zone Selection State

    const [isPyeong, setIsPyeong] = useState(true);

    // Layer State
    const [activeLayers, setActiveLayers] = useState({
        noise: false,
        academy: false,
        hill: false,
        cctv: false,
        polygon: true,
        reviews: false
    });
    const [currentViewMode, setCurrentViewMode] = useState('total');

    // Filters
    const [activeDealType, setActiveDealType] = useState('all');
    const [activeHousingTypes, setActiveHousingTypes] = useState<string[]>(['APT', 'OP', 'YH', 'DD']);
    const [activeGrades, setActiveGrades] = useState<string[]>(['A', 'B', 'C', 'D']); // New: Property Grade Filter
    const [activeSize, setActiveSize] = useState('all');
    const [activeYear, setActiveYear] = useState('all');
    const [budget, setBudget] = useState({
        depositMin: '',
        depositMax: '',
        rentMin: '',
        rentMax: ''
    });

    // Data State (Lazy Loaded)
    const [originalListings, setOriginalListings] = useState<any[]>([]); // 📦 필터 전 원본 데이터 (매매+전월세 통합)
    const [listings, setListings] = useState<any[]>([]); // 🎯 필터 적용 후 화면 표시용
    const [seoulGeoJson, setSeoulGeoJson] = useState<any>(null); // GeoJSON Data
    const [cctvData, setCctvData] = useState<any[]>([]); // Real CCTV Data

    const [isLoadingListings, setIsLoadingListings] = useState(false); // 매매 로딩
    const [toastMessage, setToastMessage] = useState<string | null>(null); // 토스트 메시지

    // Map Objects References 
    const markersRef = useRef<any[]>([]);
    const layerObjectsRef = useRef<any[]>([]);
    const clustererRef = useRef<any>(null); // ✅ 클러스터러 Ref 추가
    const cctvMarkersRef = useRef<any[]>([]); // (To be removed or unused)



    const polygonsRef = useRef<any[]>([]);

    // Interaction Refs
    const isDraggingRef = useRef(false);
    const hoverDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Chart Refs
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<ChartJS | null>(null);

    // ----------------------------------------------------------------------
    // HELPER FUNCTIONS
    // ----------------------------------------------------------------------

    const formatPrice = (price: string) => price;

    const formatArea = (size: number) => {
        if (isPyeong) return `${size}평`;
        return `${(size / 0.3025).toFixed(1)}㎡`;
    };

    const parsePrice = (priceStr: string) => {
        let type = '';
        let deposit = 0;
        let rent = 0;

        if (priceStr.includes('전세')) type = 'jeonse';
        else if (priceStr.includes('월세')) type = 'monthly';
        else if (priceStr.includes('매매')) type = 'sale';

        const cleanStr = priceStr.replace(/전세|월세|매매/g, '').trim();

        if (type === 'monthly') {
            const parts = cleanStr.split('/');
            if (parts.length === 2) {
                if (parts[0].includes('억')) {
                    deposit = parseFloat(parts[0].replace('억', '')) * 10000;
                } else {
                    deposit = parseFloat(parts[0]);
                }
                rent = parseFloat(parts[1]);
            }
        } else {
            if (cleanStr.includes('억')) {
                const parts = cleanStr.split('억');
                const big = parseFloat(parts[0]) || 0;
                const small = parts[1] ? parseFloat(parts[1]) : 0;
                deposit = big * 10000 + small;
            } else {
                deposit = parseFloat(cleanStr);
            }
        }
        return { type, deposit, rent };
    };

    const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // ----------------------------------------------------------------------
    // API HANDLERS (CCTV)
    // ----------------------------------------------------------------------
    const fetchCCTVData = async () => {
        console.warn("🚨 [DEBUG] 3. fetchCCTVData 함수 진입 성공!");

        if (!mapRef.current) {
            console.error("❌ [DEBUG] 지도가 아직 로드되지 않아 500ms 후 재시도합니다.");
            setTimeout(fetchCCTVData, 500);
            return;
        }

        const level = mapRef.current.getLevel();
        console.log(`🔍 현재 줌 레벨: ${level}`);

        // [수정] 6레벨 이상(넓은 지역)이면 데이터 요청 안 함
        if (level > 5) {
            console.warn("⚠️ 범위가 너무 넓습니다. CCTV 데이터를 비웁니다 (성능 보호).");
            setCctvData([]);
            if (clustererRef.current) clustererRef.current.clear();
            return;
        }

        const bounds = mapRef.current.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();

        console.log(`📡 [API 요청] 좌표 범위: (${sw.getLat()}, ${sw.getLng()}) ~ (${ne.getLat()}, ${ne.getLng()})`);

        try {
            const res = await fetch(
                `/api/cctv?minLat=${sw.getLat()}&maxLat=${ne.getLat()}&minLng=${sw.getLng()}&maxLng=${ne.getLng()}`
            );
            const json = await res.json();
            console.warn(`📦 [API 응답] 받아온 데이터 개수: ${json.features?.length || 0}개`);

            if (json.features) {
                setCctvData(json.features);
            }
        } catch (err) {
            console.error("🔥 [API 에러]", err);
        }
    };

    // ----------------------------------------------------------------------
    // 가격 포맷 헬퍼 (만원 → "억/천" 표기)
    // ----------------------------------------------------------------------
    const formatMoney = useCallback((amount: number) => {
        if (!amount || amount === 0) return '0';
        if (amount >= 10000) {
            const eok = Math.floor(amount / 10000);
            const rest = amount % 10000;
            return rest > 0 ? `${eok}억${rest}` : `${eok}억`;
        }
        return `${amount}`;
    }, []);

    // 토스트 표시 헬퍼
    const showToast = useCallback((msg: string, duration = 3000) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), duration);
    }, []);

    // ----------------------------------------------------------------------
    // API HANDLERS (매매 실거래가 — listings 메인 데이터)
    // ----------------------------------------------------------------------
    const fetchListings = useCallback(async () => {
        if (!mapRef.current) return;

        const level = mapRef.current.getLevel();
        const zoom = Math.max(1, 14 - level + 1); // 카카오 레벨 → 대략적 zoom 변환

        // 줌 레벨 방어: 카카오 레벨 7 이상 (넓은 범위)이면 요청 안 함
        if (level > 6) {
            console.warn('⚠️ 범위가 너무 넓습니다. 매매 데이터를 비웁니다.');
            setOriginalListings(prev => prev.filter(l => l.dealType !== 'sale'));
            showToast('🔍 지도를 더 확대해주세요 — 매물이 표시됩니다.');
            return;
        }

        const bounds = mapRef.current.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();

        setIsLoadingListings(true);
        console.log(`🏢 [매매 API 요청] zoom:${zoom} 좌표: (${sw.getLat()}, ${sw.getLng()}) ~ (${ne.getLat()}, ${ne.getLng()})`);

        try {
            const res = await fetch(
                `/api/listings?type=sales&minLat=${sw.getLat()}&maxLat=${ne.getLat()}&minLng=${sw.getLng()}&maxLng=${ne.getLng()}&zoom=${zoom}`
            );
            const json = await res.json();
            console.log(`🏢 [매매 API 응답] ${json.total || 0}건 수신`);

            if (json.listings) {
                const mapped = json.listings.map((item: any) => {
                    // 1. 거래 유형(dealType) 결정
                    let dealType = 'jeonse';
                    if (item.deal_amount > 0) dealType = 'sale';
                    else if (item.monthly_rent > 0) dealType = 'monthly';

                    // 2. 가격 객체 생성 (필터용)
                    const price = {
                        d: item.deal_amount || item.deposit || 0,
                        r: item.monthly_rent || 0,
                    };

                    // 3. 주거 유형 추론
                    let housingType = item.house_type || 'YH';
                    if (item.building_name?.includes('아파트')) housingType = 'APT';
                    else if (item.building_name?.includes('오피스텔')) housingType = 'OP';

                    // 4. 가격 표시 문자열
                    const priceLabel = dealType === 'sale'
                        ? `매매 ${formatMoney(item.deal_amount)}`
                        : dealType === 'jeonse'
                            ? `전세 ${formatMoney(item.deposit)}`
                            : `월세 ${formatMoney(item.deposit)}/${item.monthly_rent}`;

                    return {
                        ...item, // 원본 데이터 보존
                        id: item.id,
                        name: item.building_name || '이름 없음',
                        title: item.building_name || '이름 없음',
                        lat: item.lat,
                        lng: item.lng,
                        type: housingType,
                        dealType,
                        price,
                        priceLabel,
                        size: item.area_exclusive || 0,
                        floor: item.floor ? `${item.floor}층` : '-',
                        grade: item.grade || 'B',
                        reviewCount: 0,
                        rating: 0,
                        scores: item.scores || { security_safety: 80, traffic: 80, living_comfort: 70, living_infra: 75, property_building: 65, environment: 70 },
                        swot: item.swot || { s: [], w: [], o: [], t: [] },
                    };
                });
                // 원본 데이터 갱신: 기존 전월세 유지 + 새 매매 교체
                setOriginalListings(prev => [
                    ...prev.filter(l => l.dealType !== 'sale'),
                    ...mapped,
                ]);
            }
        } catch (err) {
            console.error('🔥 [매매 API 에러]', err);
        } finally {
            setIsLoadingListings(false);
        }
    }, [formatMoney, showToast]);

    // ----------------------------------------------------------------------
    // API HANDLERS (전월세 실거래가)
    // ----------------------------------------------------------------------
    const fetchRentListings = useCallback(async () => {
        if (!mapRef.current) return;

        const level = mapRef.current.getLevel();
        const zoom = Math.max(1, 14 - level + 1);

        // 줌 레벨 7 이상(넓은 지역)이면 요청 안 함
        if (level > 6) {
            console.warn('⚠️ 범위가 너무 넓습니다. 전월세 데이터를 비웁니다.');
            setOriginalListings(prev => prev.filter(l => l.dealType === 'sale'));
            return;
        }

        const bounds = mapRef.current.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();

        setIsLoadingListings(true);
        console.log(`🏠 [전월세 API 요청] zoom:${zoom} 좌표: (${sw.getLat()}, ${sw.getLng()}) ~ (${ne.getLat()}, ${ne.getLng()})`);

        try {
            const res = await fetch(
                `/api/listings?type=rent&minLat=${sw.getLat()}&maxLat=${ne.getLat()}&minLng=${sw.getLng()}&maxLng=${ne.getLng()}&zoom=${zoom}`
            );
            const json = await res.json();
            console.log(`🏠 [전월세 API 응답] ${json.total || 0}건 수신`);

            if (json.listings) {
                const mapped = json.listings.map((item: any) => {
                    // 1. 거래 유형(dealType) 결정
                    let dealType = 'jeonse';
                    if (item.deal_amount > 0) dealType = 'sale';
                    else if (item.monthly_rent > 0) dealType = 'monthly';

                    // 2. 가격 객체 생성 (필터용)
                    const price = {
                        d: item.deal_amount || item.deposit || 0,
                        r: item.monthly_rent || 0,
                    };

                    // 3. 주거 유형 추론
                    let housingType = item.house_type || 'YH';
                    if (item.building_name?.includes('아파트')) housingType = 'APT';
                    else if (item.building_name?.includes('오피스텔')) housingType = 'OP';

                    // 4. 가격 표시 문자열
                    const priceLabel = dealType === 'sale'
                        ? `매매 ${formatMoney(item.deal_amount)}`
                        : dealType === 'jeonse'
                            ? `전세 ${formatMoney(item.deposit)}`
                            : `월세 ${formatMoney(item.deposit)}/${item.monthly_rent}`;

                    return {
                        ...item, // 원본 데이터 보존
                        id: item.id,
                        name: item.building_name || '이름 없음',
                        title: item.building_name || '이름 없음',
                        lat: item.lat,
                        lng: item.lng,
                        type: housingType,
                        dealType,
                        price,
                        priceLabel,
                        size: item.area_exclusive || 0,
                        floor: item.floor ? `${item.floor}층` : '-',
                        grade: item.grade || 'B',
                        contract_type: dealType === 'jeonse' ? '전세' : (dealType === 'monthly' ? '월세' : '매매'),
                        reviewCount: 0,
                        rating: 0,
                        scores: item.scores || { security_safety: 80, traffic: 80, living_comfort: 70, living_infra: 75, property_building: 65, environment: 70 },
                        swot: item.swot || { s: [], w: [], o: [], t: [] },
                    };
                });

                // 원본 데이터 갱신: 기존 매매 유지 + 새 전월세 교체
                setOriginalListings(prev => [
                    ...prev.filter(l => l.dealType === 'sale'),
                    ...mapped,
                ]);
            }
        } catch (err) {
            console.error('🔥 [전월세 API 에러]', err);
        } finally {
            setIsLoadingListings(false);
        }
    }, [formatMoney]);

    // Debounce Ref for Map Movement
    const mapDebounceTimer = useRef<NodeJS.Timeout | null>(null);

    // ✅ 1. 버튼이 켜지면 무조건 데이터부터 가져온다. (Trigger)
    useEffect(() => {
        if (activeLayers.cctv) {
            console.warn("🚨 [DEBUG] 2-1. CCTV 레이어 활성화 감지 -> 데이터 요청 시작");
            fetchCCTVData();
        }
    }, [activeLayers.cctv]);

    // ✅ 5. CCTV 렌더링 (툴팁 버그 수정 버전)
    useEffect(() => {
        if (!mapRef.current || !window.kakao) return;

        // 1. 클러스터러 초기화
        if (!clustererRef.current) {
            clustererRef.current = new window.kakao.maps.MarkerClusterer({
                map: mapRef.current,
                averageCenter: true,
                minLevel: 6,
                gridSize: 60,
                disableClickZoom: false,
            });
        }

        // 2. 기존 마커 비우기
        clustererRef.current.clear();

        // 🚨 핵심 수정: 루프 밖에서 인포윈도우를 하나만 생성 (전역 관리 효과)
        const infowindow = new window.kakao.maps.InfoWindow({ zIndex: 100 });

        // 3. 데이터 렌더링
        if (activeLayers.cctv && cctvData.length > 0) {

            const markers = cctvData.map((cctv) => {
                const marker = new window.kakao.maps.Marker({
                    position: new window.kakao.maps.LatLng(cctv.lat, cctv.lng),
                    // 아이콘은 일단 기본값 유지 (기능 우선)
                });

                // 🐭 마우스 오버: 내용 채우고 열기
                window.kakao.maps.event.addListener(marker, 'mouseover', function () {
                    const content = `
              <div style="padding:5px 10px; font-size:12px; background:white; border:1px solid #ccc; white-space:nowrap; color:black;">
                <span style="font-weight:bold; color:#0052cc;">📹 ${cctv.purpose}</span><br>
                <span style="color:#666; font-size:11px;">${cctv.address || '주소 정보 없음'}</span>
              </div>
            `;
                    infowindow.setContent(content);
                    infowindow.open(mapRef.current, marker);
                });

                // 🐭 마우스 아웃: 무조건 닫기
                window.kakao.maps.event.addListener(marker, 'mouseout', function () {
                    infowindow.close();
                });

                return marker;
            });

            // 클러스터러에 추가
            clustererRef.current.addMarkers(markers);
        }
    }, [cctvData, activeLayers.cctv]);


    // ✅ 지도 이동/줌 변경 시 데이터 자동 갱신 (Debounce 적용)
    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current;

        const handleMapUpdate = () => {
            // CCTV 레이어가 켜져 있을 때만 작동
            if (activeLayers.cctv) {
                if (mapDebounceTimer.current) {
                    clearTimeout(mapDebounceTimer.current);
                }

                // 0.5초 동안 추가 움직임이 없으면 데이터 요청 (서버 부하 방지)
                mapDebounceTimer.current = setTimeout(() => {
                    console.log("🔄 [지도 이동] CCTV 데이터 재요청...");
                    fetchCCTVData();
                }, 500);
            }
        };

        if (activeLayers.cctv) {
            // 이벤트 등록
            window.kakao.maps.event.addListener(map, 'dragend', handleMapUpdate);
            window.kakao.maps.event.addListener(map, 'zoom_changed', handleMapUpdate);
        }

        // 뒷정리 (Cleanup): 스위치를 끄거나 페이지를 나가면 이벤트 해제
        return () => {
            window.kakao.maps.event.removeListener(map, 'dragend', handleMapUpdate);
            window.kakao.maps.event.removeListener(map, 'zoom_changed', handleMapUpdate);
        };
    }, [activeLayers.cctv]); // 스위치 상태가 바뀔 때마다 리스너 재설정

    // ✅ 매매 + 전월세 데이터: 지도 idle 이벤트 시 자동 갱신 (Debounce)
    const listingsDebounceTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!mapRef.current || !window.kakao) return;
        const map = mapRef.current;

        const handleMapIdle = () => {
            if (listingsDebounceTimer.current) {
                clearTimeout(listingsDebounceTimer.current);
            }
            listingsDebounceTimer.current = setTimeout(() => {
                console.log('🔄 [지도 idle] 매매 + 전월세 데이터 재요청...');
                fetchListings();
                fetchRentListings();
            }, 500);
        };

        // 카카오 맵에는 idle 이벤트가 없으므로 dragend + zoom_changed 조합
        window.kakao.maps.event.addListener(map, 'dragend', handleMapIdle);
        window.kakao.maps.event.addListener(map, 'zoom_changed', handleMapIdle);

        return () => {
            window.kakao.maps.event.removeListener(map, 'dragend', handleMapIdle);
            window.kakao.maps.event.removeListener(map, 'zoom_changed', handleMapIdle);
        };
    }, [isMapLoaded, fetchListings, fetchRentListings]);


    // ----------------------------------------------------------------------
    // EFFECTS
    // ----------------------------------------------------------------------

    // Initialize Map
    useEffect(() => {
        if (!isMapLoaded || !mapContainerRef.current) return;

        if (mapRef.current) return;

        const { kakao } = window;
        const centerLat = 37.4842;
        const centerLng = 126.9296;

        const options = {
            center: new kakao.maps.LatLng(centerLat, centerLng),
            level: 5
        };
        const mapInstance = new kakao.maps.Map(mapContainerRef.current, options);

        const zoomControl = new kakao.maps.ZoomControl();
        mapInstance.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

        // Interaction Listeners for Global State
        kakao.maps.event.addListener(mapInstance, 'dragstart', () => { isDraggingRef.current = true; });
        kakao.maps.event.addListener(mapInstance, 'dragend', () => { isDraggingRef.current = false; });

        mapRef.current = mapInstance;

        // ✅ 초기 데이터 로드 — 실제 API에서 매매 + 전월세 가져오기
        setTimeout(() => {
            fetchListings();
            fetchRentListings();
            setInitialLoading(false);
        }, 500);

        // Fetch Slope GeoJSON
        fetch('/data/seoul_slope_v2.json')
            .then(res => res.json())
            .then(data => setSeoulGeoJson(data))
            .catch(err => console.error("Failed to load slope data:", err));

    }, [isMapLoaded]);

    // Re-render markers when listings change or UNIT/LAYER changes
    useEffect(() => {
        if (!mapRef.current) return;
        const mapInstance = mapRef.current;
        const data = listings;

        // Clear existing markers
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        data.forEach((item) => {
            const position = new window.kakao.maps.LatLng(item.lat, item.lng);

            // Marker Style Variation based on Review Layer
            const isReviewLayerActive = activeLayers.reviews;

            const content = document.createElement('div');

            if (isReviewLayerActive) {
                // Purple Marker for Review Layer
                content.className = `listing-marker bg-purple-600 border-purple-800 text-white`;
                content.innerHTML = `
                    <span class="font-bold text-xs"><i class="fa-solid fa-star text-[10px] mr-1"></i>${item.reviewCount}</span>
                `;
            } else {
                // Marker Colored by Grade (A: Green, B: Yellow, C: Orange, D: Red)
                let bgClass = 'bg-gray-500';
                let borderClass = 'border-gray-700';

                if (item.grade === 'A') { bgClass = 'bg-[#22C55E]'; borderClass = 'border-[#16a34a]'; } // Green-500
                else if (item.grade === 'B') { bgClass = 'bg-[#EAB308]'; borderClass = 'border-[#ca8a04]'; } // Yellow-500
                else if (item.grade === 'C') { bgClass = 'bg-[#F97316]'; borderClass = 'border-[#ea580c]'; } // Orange-500
                else if (item.grade === 'D') { bgClass = 'bg-[#EF4444]'; borderClass = 'border-[#dc2626]'; } // Red-500

                content.className = `listing-marker ${bgClass} ${borderClass} text-white`;
                content.innerHTML = `
                    ${item.priceLabel}
                    <i class="fa-solid fa-chevron-right text-[10px] ml-1 opacity-70"></i>
                `;
            }

            content.onclick = () => {
                showDetail(item);
            };

            const customOverlay = new window.kakao.maps.CustomOverlay({
                position: position,
                content: content,
                yAnchor: 1
            });

            customOverlay.setMap(mapInstance);
            markersRef.current.push(customOverlay);
        });
    }, [listings, isPyeong, activeLayers.reviews]); // Depend on reviews layer



    // Re-render Layers (Noise, Academy, Hill, CCTV, Polygon)
    useEffect(() => {
        console.warn("🚨 [DEBUG] 2. Effect 감지됨! ActiveLayers:", activeLayers);
        if (!mapRef.current) return;
        const { kakao } = window;
        const map = mapRef.current;

        // 1. Clear Existing Overlays
        layerObjectsRef.current.forEach(obj => obj.setMap(null));
        layerObjectsRef.current = [];
        // cctvMarkersRef cleanup removed (Handled by Clusterer Ref)
        polygonsRef.current.forEach(p => p.setMap(null));
        polygonsRef.current = [];

        // 2. Draw Noise Zones (Red) + Labels
        if (activeLayers.noise) {
            [
                { center: { lat: 37.481, lng: 126.925 }, radius: 250, label: '🚗 대로변 소음 주의' },
                { center: { lat: 37.485, lng: 126.921 }, radius: 150, label: '🚄 철도 소음 주의' }
            ].forEach((zone: any) => {
                // Circle
                const circle = new kakao.maps.Circle({
                    center: new kakao.maps.LatLng(zone.center.lat, zone.center.lng),
                    radius: zone.radius,
                    strokeWeight: 1,
                    strokeColor: '#ef4444',
                    strokeOpacity: 0.8,
                    strokeStyle: 'solid',
                    fillColor: '#ef4444',
                    fillOpacity: 0.3
                });
                circle.setMap(map);
                layerObjectsRef.current.push(circle);

                // Label
                const content = document.createElement('div');
                content.className = 'bg-red-500 text-white text-[10px] px-2 py-1 rounded-full shadow-md font-bold flex items-center gap-1 opacity-90 border-2 border-white';
                content.innerHTML = `<i class="fa-solid fa-volume-high"></i> ${zone.label}`;

                const labelOverlay = new kakao.maps.CustomOverlay({
                    position: new kakao.maps.LatLng(zone.center.lat, zone.center.lng),
                    content: content,
                    yAnchor: 1.5
                });
                labelOverlay.setMap(map);
                layerObjectsRef.current.push(labelOverlay);
            });
        }

        // 3. Draw Academy Zones (Purple) + Labels
        if (activeLayers.academy) {
            [
                { center: { lat: 37.478, lng: 126.952 }, radius: 300, label: '🎓 봉천동 학원가' }
            ].forEach((zone: any) => {
                const circle = new kakao.maps.Circle({
                    center: new kakao.maps.LatLng(zone.center.lat, zone.center.lng),
                    radius: zone.radius,
                    strokeWeight: 1,
                    strokeColor: '#8b5cf6',
                    strokeOpacity: 0.8,
                    strokeStyle: 'dashed',
                    fillColor: '#8b5cf6',
                    fillOpacity: 0.3
                });
                circle.setMap(map);
                layerObjectsRef.current.push(circle);

                // Label
                const content = document.createElement('div');
                content.className = 'bg-purple-600 text-white text-[10px] px-2 py-1 rounded-full shadow-md font-bold flex items-center gap-1 opacity-90 border-2 border-white';
                content.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> ${zone.label}`;

                const labelOverlay = new kakao.maps.CustomOverlay({
                    position: new kakao.maps.LatLng(zone.center.lat, zone.center.lng),
                    content: content,
                    yAnchor: 1.5
                });
                labelOverlay.setMap(map);
                layerObjectsRef.current.push(labelOverlay);
            });
        }

        // 4. Draw Hill Zones (Brown) + Labels
        // 4. Draw Hill Zones (Slope Choropleth)
        if (activeLayers.hill && seoulGeoJson) {

            // CustomOverlay for Hover (Tooltip) - Replaces InfoWindow to fix flickering
            const tooltipOverlay = new kakao.maps.CustomOverlay({
                zIndex: 20,
                yAnchor: 1.5 // Offset above cursor
            });

            seoulGeoJson.features.forEach((feature: any) => {
                const geometry = feature.geometry;
                const props = feature.properties;
                const slope = props.mean_slope || 0;

                // Color Logic
                let fillColor = '#22c55e';
                let fillOpacity = 0.1;

                if (slope >= 15) {
                    fillColor = '#7f1d1d'; // Danger (Very Steep)
                    fillOpacity = 0.7;
                } else if (slope >= 10) {
                    fillColor = '#c2410c'; // High (Steep)
                    fillOpacity = 0.6;
                } else if (slope >= 5) {
                    fillColor = '#fbbf24'; // Medium (Hill)
                    fillOpacity = 0.4;
                } else {
                    // Low (Flat) - transparent or light green
                    fillColor = '#22c55e';
                    fillOpacity = 0.1;
                }

                // Create Polygon Path
                // GeoJSON coordinates are [lng, lat]. Kakao needs LatLng.
                // Handle MultiPolygon if necessary (though simple Polygon usually)
                // Assuming Polygon type for simplicity (SHP to GeoJSON usually matches)

                const coordinates = geometry.coordinates;
                // Check if Polygon or MultiPolygon. 
                // Shapefile conversion usually creates Polygon or MultiPolygon.
                // Simple iteration for Polygon (depth 3 usually: [ [ [x,y]... ] ])
                // MultiPolygon (depth 4: [ [ [ [x,y]... ] ] ])

                const createKakaoPath = (ring: any[]) => {
                    return ring.map(coord => new window.kakao.maps.LatLng(coord[1], coord[0]));
                };

                const paths: any[] = [];

                if (geometry.type === 'Polygon') {
                    coordinates.forEach((ring: any[]) => {
                        paths.push(createKakaoPath(ring));
                    });
                } else if (geometry.type === 'MultiPolygon') {
                    coordinates.forEach((polygon: any[]) => {
                        polygon.forEach((ring: any[]) => {
                            paths.push(createKakaoPath(ring));
                        });
                    });
                }

                paths.forEach(path => {
                    const polygon = new kakao.maps.Polygon({
                        path: path,
                        strokeWeight: 1,
                        strokeColor: '#7f1d1d', // Border color same as max danger? Or generic?
                        strokeOpacity: slope >= 5 ? 0.5 : 0.1, // Less visible border for flat
                        strokeStyle: 'solid',
                        fillColor: fillColor,
                        fillOpacity: fillOpacity
                    });

                    polygon.setMap(map);
                    polygonsRef.current.push(polygon);

                    // 4-1. Add Label for Steep Zones (>= 10 degrees)
                    if (slope >= 10) {
                        const center = getPolygonCenter(path);
                        const labelContent = document.createElement('div');
                        // Orange/Brown Style
                        labelContent.className = 'bg-amber-800 text-white text-[10px] px-2 py-1 rounded-full shadow-md font-bold flex items-center gap-1 opacity-90 border-2 border-white pointer-events-none whitespace-nowrap';
                        labelContent.innerHTML = `<i class="fa-solid fa-mountain"></i> ${props.ADM_NM || props.adm_nm} ${slope.toFixed(1)}°`;

                        const labelOverlay = new kakao.maps.CustomOverlay({
                            position: center,
                            content: labelContent,
                            yAnchor: 1.5,
                            zIndex: 5
                        });
                        labelOverlay.setMap(map);
                        // Add to layer objects to clear later
                        layerObjectsRef.current.push(labelOverlay);
                    }

                    // 4-2. Optimized Interactions
                    let mouseDownPos: any = null;

                    kakao.maps.event.addListener(polygon, 'mousedown', function (e: any) {
                        mouseDownPos = e.latLng;
                    });

                    kakao.maps.event.addListener(polygon, 'mouseover', function (mouseEvent: any) {
                        if (isDraggingRef.current) return;

                        // Debounce Hover Effect
                        if (hoverDebounceTimerRef.current) clearTimeout(hoverDebounceTimerRef.current);

                        hoverDebounceTimerRef.current = setTimeout(() => {
                            if (isDraggingRef.current) return;
                            polygon.setOptions({ fillOpacity: Math.min(fillOpacity + 0.2, 0.9) });

                            const content = `<div style="padding:4px 8px; font-size:11px; font-weight:bold; color:#333; background:rgba(255,255,255,0.95); border:1px solid #ccc; border-radius:4px; white-space:nowrap; pointer-events:none; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                                                ${props.ADM_NM || props.adm_nm} <br>
                                                <span style="color:#666; font-weight:normal;">평균 경사도:</span> <span style="color:#d97706;">${slope.toFixed(2)}°</span>
                                              </div>`;

                            tooltipOverlay.setContent(content);
                            tooltipOverlay.setPosition(mouseEvent.latLng);
                            tooltipOverlay.setMap(map);
                        }, 20); // Reduced delay for responsiveness
                    });

                    kakao.maps.event.addListener(polygon, 'mousemove', function (mouseEvent: any) {
                        if (isDraggingRef.current) {
                            tooltipOverlay.setMap(null);
                            return;
                        }
                        tooltipOverlay.setPosition(mouseEvent.latLng);
                    });

                    kakao.maps.event.addListener(polygon, 'mouseout', function () {
                        if (hoverDebounceTimerRef.current) clearTimeout(hoverDebounceTimerRef.current);
                        polygon.setOptions({ fillOpacity: fillOpacity });
                        tooltipOverlay.setMap(null);
                    });

                    // Click with Drag Check
                    kakao.maps.event.addListener(polygon, 'click', function (mouseEvent: any) {
                        if (!mouseDownPos) return;
                        const upPos = mouseEvent.latLng;

                        // Calculate distance to check for drag
                        // Simple Manhattan distance approx is enough for pixels, but we have LatLng
                        const latDiff = Math.abs(mouseDownPos.getLat() - upPos.getLat());
                        const lngDiff = Math.abs(mouseDownPos.getLng() - upPos.getLng());

                        // Threshold (approx 0.0001 deg is small enough to be a click, large enough to be a drag)
                        if (latDiff > 0.0001 || lngDiff > 0.0001) {
                            return; // It was a drag
                        }

                        // Handle actual click (optional: center map or show details)
                        // handleZoneClick(...)
                        handleZoneClick({
                            name: props.ADM_NM || props.adm_nm,
                            grade: slope >= 15 ? "D" : slope >= 10 ? "C" : slope >= 5 ? "B" : "A",
                            score: 100 - (slope * 3), // Rough Calc
                            stats: { cctv: "조회", police: 1, rentAvg: "-" },
                            report: {
                                safety: "경사도 분석 데이터입니다.",
                                infra: "경사도가 높을수록 도보 이동이 어려울 수 있습니다.",
                                traffic: "마을버스 노선을 확인하세요."
                            },
                            scores: {
                                traffic: Math.max(0, 100 - slope * 5),
                                environment: 80,
                                living_comfort: Math.max(0, 90 - slope * 3),
                                living_infra: 70,
                                property_building: 60,
                                security_safety: 80
                            }
                        });
                    });
                });
            });
        }

        // 5. Draw CCTV (Real Data) - Moved to separate Clusterer Efffect
        // verify clean up logic is handled in the separate effect

        // 6. Draw Polygons (Administrative District)
        if (activeLayers.polygon) {
            let fillColor = '#22d3ee'; // Default Cyan
            if (currentViewMode === 'total' || currentViewMode === 'security') fillColor = '#4ade80'; // Green
            else if (currentViewMode === 'building') fillColor = '#fbbf24'; // Yellow
            else if (currentViewMode === 'traffic') fillColor = '#f87171'; // Red

            const path = [
                new kakao.maps.LatLng(37.490, 126.920),
                new kakao.maps.LatLng(37.490, 126.940),
                new kakao.maps.LatLng(37.470, 126.940),
                new kakao.maps.LatLng(37.470, 126.920)
            ];

            const polygon = new kakao.maps.Polygon({
                path: path,
                strokeWeight: 2,
                strokeColor: '#004c80',
                strokeOpacity: 0.8,
                strokeStyle: 'solid',
                fillColor: fillColor,
                fillOpacity: 0.2
            });
            polygon.setMap(map);
            polygonsRef.current.push(polygon);

            // Added Polygon Click Event
            kakao.maps.event.addListener(polygon, 'click', function () {
                handleZoneClick({
                    name: '\uad00\uc545\uad6c \uc2e0\ub9bc\ub3d9',
                    grade: 'B',
                    score: 78,
                    stats: { police: 2, cctv: '많음', rentAvg: '500/40', jeonseRisk: '85%' },
                    report: {
                        safety: '유동인구가 많아 밤길 안전은 양호하나, 주취자 시비가 잦은 편입니다.',
                        infra: '편의점 밀집도가 서울시 최상위권이며, 1인 가구 맞춤 상권이 발달했습니다.',
                        traffic: '2호선 신림역 이용이 편리하나, 출퇴근 시간대 혼잡도가 매우 높습니다.'
                    },
                    scores: { security_safety: 70, property_building: 60, living_comfort: 80, living_infra: 95, traffic: 90, environment: 60 }
                });
            });
        }

    }, [activeLayers, currentViewMode, seoulGeoJson, cctvData]);


    // Chart Rendering Effect (Handling both Listing and Zone Selection)
    useEffect(() => {
        const targetData = selectedListing || selectedZone;

        if (targetData && chartRef.current) {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            const ctx = chartRef.current.getContext('2d');
            if (!ctx) return;

            chartInstance.current = new ChartJS(ctx, {
                type: 'radar',
                data: {
                    labels: ['치안/안전', '물건/건물', '주거쾌적', '생활인프라', '교통', '환경'],
                    datasets: [{
                        label: '안심 점수',
                        data: [
                            targetData.scores.security_safety,
                            targetData.scores.property_building,
                            targetData.scores.living_comfort,
                            targetData.scores.living_infra,
                            targetData.scores.traffic,
                            targetData.scores.environment
                        ],
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: '#3B82F6',
                        borderWidth: 2,
                        pointBackgroundColor: '#3B82F6'
                    }]
                },
                options: {
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            min: 0,
                            max: 100,
                            ticks: { display: false, stepSize: 20 },
                            pointLabels: {
                                font: { size: 11, family: 'Pretendard', weight: 'bold' },
                                color: '#64748b'
                            }
                        }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }

        return () => {
            // Cleanup handled in effect re-run
        };
    }, [selectedListing, selectedZone]); // Trigger on either selection

    // ----------------------------------------------------------------------
    // LOGIC HANDLERS
    // ----------------------------------------------------------------------

    const handleScriptLoad = () => {
        window.kakao.maps.load(() => {
            setIsMapLoaded(true);
        });
    };


    const toggleLayer = (layerName: string) => {
        console.warn("🚨 [DEBUG] 1. 버튼 클릭 감지됨! Layer:", layerName);
        setActiveLayers(prev => ({
            ...prev,
            [layerName]: !prev[layerName as keyof typeof prev]
        }));
    };

    const showDetail = (item: any) => {
        setSelectedZone(null); // Clear zone selection
        setSelectedListing(item);
        setSidebarOpen(true);

        if (mapRef.current) {
            const moveLatLon = new window.kakao.maps.LatLng(item.lat, item.lng);
            mapRef.current.panTo(moveLatLon);
        }
    };

    // 🏠 전월세 매물 상세 보기
    const showRentDetail = (item: any) => {
        setSelectedZone(null);
        setSelectedListing({
            ...item,
            _isRent: true, // 전월세 데이터 표시 플래그
            title: item.building_name || `${item.jibun}`,
        });
        setSidebarOpen(true);

        if (mapRef.current) {
            const moveLatLon = new window.kakao.maps.LatLng(item.lat, item.lng);
            mapRef.current.panTo(moveLatLon);
        }
    };

    const handleZoneClick = (zoneData: any) => {
        setSelectedListing(null); // Clear listing selection
        setSelectedZone(zoneData);
        setSidebarOpen(true);
    };

    const restoreList = () => {
        setSelectedListing(null);
        setSelectedZone(null);
    };

    // ... Filters Handlers ...
    const toggleDealType = (type: string) => setActiveDealType(type);

    const toggleHousingType = (type: string) => {
        if (activeHousingTypes.includes(type)) {
            setActiveHousingTypes(activeHousingTypes.filter(t => t !== type));
        } else {
            setActiveHousingTypes([...activeHousingTypes, type]);
        }
    };

    const toggleGrade = (grade: string) => {
        if (activeGrades.includes(grade)) {
            setActiveGrades(activeGrades.filter(g => g !== grade));
        } else {
            setActiveGrades([...activeGrades, grade]);
        }
    };

    const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setBudget(prev => ({ ...prev, [name]: value }));
    };

    const applyFilter = useCallback(() => {
        // originalListings에서 필터링 → listings 상태에 반영 (비파괴적 필터)
        const filtered = originalListings.filter((item: any) => {
            // 주거 유형 필터 (APT, OP, YH, DD)
            if (!activeHousingTypes.includes(item.type)) return false;

            // 거래 유형 필터 — 'all'이면 통과
            if (activeDealType !== 'all' && item.dealType !== activeDealType) return false;

            // 예산 필터 (price 객체 기반: { d, r })
            const pDeposit = item.price?.d || 0;
            const pRent = item.price?.r || 0;

            const minDep = budget.depositMin ? parseInt(budget.depositMin) : 0;
            const maxDep = budget.depositMax ? parseInt(budget.depositMax) : Infinity;
            const minRentVal = budget.rentMin ? parseInt(budget.rentMin) : 0;
            const maxRentVal = budget.rentMax ? parseInt(budget.rentMax) : Infinity;

            if (pDeposit < minDep || pDeposit > maxDep) return false;
            if (item.dealType === 'monthly') {
                if (pRent < minRentVal || pRent > maxRentVal) return false;
            }

            // 평형대 필터
            const pSize = item.size;
            if (activeSize === 'under10' && pSize > 10) return false;

            // 리뷰 필터
            if (activeLayers.reviews && item.reviewCount === 0) return false;

            // 등급 필터
            if (!activeGrades.includes(item.grade)) return false;

            // 거래 연도 필터
            if (activeYear !== 'all') {
                const dateStr = item.contract_date || item.dealYear || '';
                const year = parseInt(String(dateStr).substring(0, 4), 10);
                if (isNaN(year)) return false;
                if (activeYear === '2022~') {
                    if (year > 2022) return false;
                } else {
                    if (year !== parseInt(activeYear, 10)) return false;
                }
            }

            return true;
        });
        setListings(filtered);
    }, [originalListings, activeDealType, activeHousingTypes, activeSize, budget, activeLayers.reviews, activeGrades, activeYear]);

    // originalListings 또는 필터 조건 변경 시 필터 재적용
    useEffect(() => {
        if (!initialLoading) {
            applyFilter();
        }
    }, [applyFilter, initialLoading]);


    // ----------------------------------------------------------------------
    // RENDER HELPER
    // ----------------------------------------------------------------------

    const renderListingItem = (item: any) => (
        <div key={item.id}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer mb-3 group"
            onClick={() => showDetail(item)}
        >
            <div className="flex justify-between items-start mb-2">
                <div>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-1 ${item.type === 'APT' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                        }`}>
                        {HOUSING_TYPE_LABELS[item.type]}
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
                        {item.title}
                    </h3>
                </div>
                <div className="text-right">
                    <span className="block font-bold text-blue-600 text-sm">{item.priceLabel}</span>
                    <span className="text-[10px] text-slate-400">
                        {formatArea(item.size)} · {item.floor}
                    </span>
                    {item.contract_date && (
                        <span className="block text-[10px] text-gray-400 mt-0.5">
                            {item.contract_date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, (_: string, y: string, m: string, d: string) => `${y.slice(2)}.${m}.${d}`)} 거래
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4 py-2 border-t border-slate-50 mt-2">
                <div className="text-center flex-1">
                    <span className="block text-[10px] text-slate-400 mb-0.5">안심등급</span>
                    <span className={`font-bold text-sm ${item.grade === 'A' ? 'text-green-500' :
                        item.grade === 'B' ? 'text-yellow-500' : 'text-red-500'
                        }`}>Grade {item.grade}</span>
                </div>
                <div className="w-[1px] h-6 bg-slate-100"></div>
                <div className="text-center flex-1">
                    <span className="block text-[10px] text-slate-400 mb-0.5">실거주민</span>
                    <span className="font-bold text-sm text-slate-700">★ {item.rating}</span>
                </div>
            </div>
        </div>
    );

    // 🏠 전월세 상세 패널 렌더링
    const renderRentDetailView = () => {
        if (!selectedListing) return null;
        const item = selectedListing;
        const isJeonse = item.contract_type === '전세';

        const formatMoney = (amount: number) => {
            if (!amount) return '0';
            if (amount >= 10000) return `${(amount / 10000).toFixed(amount % 10000 === 0 ? 0 : 1)}억`;
            return `${amount.toLocaleString()}만원`;
        };

        return (
            <div className="animate-fade-in-up">
                <div className="p-4 space-y-4">
                    {/* 목록으로 돌아가기 버튼 */}
                    <button onClick={() => { setSelectedListing(null); setSelectedZone(null); }}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-bold mb-2 transition-colors">
                        <i className="fa-solid fa-arrow-left text-xs"></i> 목록으로
                    </button>
                    {/* 가격 헤더 */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className={`p-5 ${isJeonse ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-sky-500 to-sky-600'} text-white`}>
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-2 ${isJeonse ? 'bg-emerald-400/30' : 'bg-sky-400/30'}`}>
                                {isJeonse ? '전세' : '월세'}
                            </span>
                            <h2 className="text-2xl font-bold mb-1">
                                {isJeonse ? (
                                    <>보증금 {formatMoney(item.deposit)}</>
                                ) : (
                                    <>{formatMoney(item.deposit)} / 월 {item.monthly_rent?.toLocaleString()}만원</>
                                )}
                            </h2>
                            <p className="text-sm opacity-80">{item.title}</p>
                        </div>

                        <div className="p-5 space-y-3">
                            {/* 건물 정보 그리드 */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 p-3 rounded-xl">
                                    <span className="block text-[10px] text-slate-400 mb-0.5">🏢 건물명</span>
                                    <span className="font-bold text-sm text-slate-800">{item.building_name || '-'}</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl">
                                    <span className="block text-[10px] text-slate-400 mb-0.5">📍 지번</span>
                                    <span className="font-bold text-sm text-slate-800">{item.jibun || '-'}</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl">
                                    <span className="block text-[10px] text-slate-400 mb-0.5">🏗️ 층</span>
                                    <span className="font-bold text-sm text-slate-800">{item.floor ? `${item.floor}층` : '-'}</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl">
                                    <span className="block text-[10px] text-slate-400 mb-0.5">📐 면적</span>
                                    <span className="font-bold text-sm text-slate-800">
                                        {item.area_m2 ? `${item.area_m2}㎡ (${(item.area_m2 * 0.3025).toFixed(1)}평)` : '-'}
                                    </span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl">
                                    <span className="block text-[10px] text-slate-400 mb-0.5">🗓️ 건축년도</span>
                                    <span className="font-bold text-sm text-slate-800">{item.build_year ? `${item.build_year}년` : '-'}</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl">
                                    <span className="block text-[10px] text-slate-400 mb-0.5">📝 계약일</span>
                                    <span className="font-bold text-sm text-slate-800">{item.contract_date || '-'}</span>
                                </div>
                            </div>

                            {/* 가격 상세 */}
                            <div className={`p-4 rounded-xl border ${isJeonse ? 'bg-emerald-50 border-emerald-200' : 'bg-sky-50 border-sky-200'}`}>
                                <h4 className="text-xs font-bold text-slate-600 mb-2">💰 가격 정보</h4>
                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-xs text-slate-500">보증금</span>
                                        <span className="text-sm font-bold text-slate-800">{formatMoney(item.deposit)}</span>
                                    </div>
                                    {!isJeonse && (
                                        <div className="flex justify-between">
                                            <span className="text-xs text-slate-500">월세</span>
                                            <span className="text-sm font-bold text-slate-800">{item.monthly_rent?.toLocaleString()}만원</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 지역코드 */}
                            {item.region_code && (
                                <div className="text-xs text-slate-400 text-center pt-2">
                                    법정동 코드: {item.region_code}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderDetailView = () => {
        if (!selectedListing) return null;
        // 🏠 전월세 데이터인 경우 전용 렌더 사용
        if (selectedListing._isRent) return renderRentDetailView();
        const item = selectedListing;
        const gradeColor = item.grade === 'A' ? "text-green-600 bg-green-50 border-green-200" : "text-yellow-600 bg-yellow-50 border-yellow-200";
        const gradeComment = item.grade === 'A' ? "안심하세요! 융자 비율과 권리 관계가 깨끗한 추천 매물입니다." : "주변 시세 대비 합리적입니다. 등기부등본을 한번 더 확인하세요.";

        const searchKeyword = "관악구 신림동 " + item.title;
        const naverUrl = "https://m.land.naver.com/search/result/" + encodeURIComponent(searchKeyword);

        let slopeBadge = '';
        if (item.slope <= 3) slopeBadge = '<span class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">🟢 완전 평지</span>';
        else if (item.slope <= 8) slopeBadge = '<span class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">🟡 완만한 언덕</span>';
        else if (item.slope <= 15) slopeBadge = '<span class="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">🟠 오르막길</span>';
        else slopeBadge = '<span class="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">🔴 급경사 주의</span>';

        return (
            <div className="animate-fade-in-up">
                <div className="p-4 space-y-4">
                    {/* 목록으로 돌아가기 버튼 */}
                    <button onClick={() => { setSelectedListing(null); setSelectedZone(null); }}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-bold mb-2 transition-colors">
                        <i className="fa-solid fa-arrow-left text-xs"></i> 목록으로
                    </button>
                    {/* Safety Analysis Report */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-4">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
                            <span>🛡️ 안심 분석 리포트</span>
                            <span className={`px-2 py-1 rounded text-xs border ${gradeColor}`}>Grade {item.grade}</span>
                        </h3>

                        {/* Radar Chart */}
                        <div className="relative h-64 w-full flex justify-center mb-4">
                            <canvas ref={chartRef}></canvas>
                        </div>

                        {/* SWOT Analysis Section */}
                        <div className="mb-2 pt-4 border-t border-slate-100">
                            <div className="flex items-end gap-2 mb-3">
                                <h3 className="font-bold text-sm text-slate-800">🔮 미래 가치 분석 (SWOT)</h3>
                                <span className="text-[10px] text-slate-400 font-medium pb-0.5">"영원한 건 절대 없어!"</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                                    <h4 className="text-[11px] font-bold text-blue-700 mb-1 flex items-center"><i className="fa-solid fa-thumbs-up mr-1.5"></i>S (강점)</h4>
                                    <ul className="text-[10px] text-slate-600 space-y-0.5 list-disc list-inside">
                                        {item.swot?.s.map((t: string, i: number) => <li key={i} className="truncate">{t}</li>)}
                                    </ul>
                                </div>
                                <div className="bg-red-50 p-2.5 rounded-lg border border-red-100">
                                    <h4 className="text-[11px] font-bold text-red-700 mb-1 flex items-center"><i className="fa-solid fa-triangle-exclamation mr-1.5"></i>W (약점)</h4>
                                    <ul className="text-[10px] text-slate-600 space-y-0.5 list-disc list-inside">
                                        {item.swot?.w.map((t: string, i: number) => <li key={i} className="truncate">{t}</li>)}
                                    </ul>
                                </div>
                                <div className="bg-green-50 p-2.5 rounded-lg border border-green-100">
                                    <h4 className="text-[11px] font-bold text-green-700 mb-1 flex items-center"><i className="fa-solid fa-seedling mr-1.5"></i>O (기회)</h4>
                                    <ul className="text-[10px] text-slate-600 space-y-0.5 list-disc list-inside">
                                        {item.swot?.o.map((t: string, i: number) => <li key={i} className="truncate">{t}</li>)}
                                    </ul>
                                </div>
                                <div className="bg-orange-50 p-2.5 rounded-lg border border-orange-100">
                                    <h4 className="text-[11px] font-bold text-orange-700 mb-1 flex items-center"><i className="fa-solid fa-skull-crossbones mr-1.5"></i>T (위협)</h4>
                                    <ul className="text-[10px] text-slate-600 space-y-0.5 list-disc list-inside">
                                        {item.swot?.t.map((t: string, i: number) => <li key={i} className="truncate">{t}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className={`p-3 rounded-xl border text-xs leading-relaxed ${gradeColor}`}>
                            {gradeComment}
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
                        <div className="h-32 bg-slate-100 flex items-center justify-center relative">
                            <i className="fa-solid fa-house text-4xl text-slate-300"></i>
                            <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/60 to-transparent">
                                <span className="text-white font-bold text-xl">{item.priceLabel}</span>
                            </div>
                        </div>
                        <div className="p-5">
                            <div className="flex gap-2 mb-3">
                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">{HOUSING_TYPE_LABELS[item.type]}</span>
                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">{formatArea(item.size)}</span>
                            </div>

                            <h2 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h2>
                            <p className="text-xs text-slate-500 mb-2 flex items-center gap-2">
                                <i className="fa-solid fa-location-dot"></i> 신림역 인근 · {item.floor}
                            </p>

                            <div className="flex items-center gap-2 mb-6">
                                <span dangerouslySetInnerHTML={{ __html: slopeBadge }}></span>
                                <span className="text-xs text-gray-400">경사도 {item.slope}°</span>
                            </div>

                            <a href={naverUrl} target="_blank" className="flex items-center justify-center gap-2 w-full py-3 bg-[#03C75A] hover:bg-[#02b351] text-white font-bold rounded-xl shadow-md transition-colors text-sm">
                                <span className="font-extrabold text-base">N</span> 네이버 부동산 시세 보기 ↗️
                            </a>

                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <h4 className="text-xs font-bold text-slate-500 mb-2">🗣️ 입주민 찐 후기</h4>
                                <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                                    <div className="flex items-center gap-1 mb-1">
                                        <span className="text-xs font-bold text-purple-700">★ {item.rating}</span>
                                        <span className="text-[10px] text-purple-400">({item.reviewCount}개 리뷰)</span>
                                    </div>
                                    <p className="text-xs text-slate-700 font-medium">"{item.pros}"</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderZoneReport = () => {
        if (!selectedZone) return null;
        const zone = selectedZone;

        return (
            <div className="animate-fade-in-up">
                <div className="p-4 space-y-4">
                    {/* Zone Header */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-4">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{zone.name}</h2>
                                <p className="text-xs text-slate-500 mt-1">서울 관악구</p>
                            </div>
                            <div className="text-center">
                                <span className="block text-2xl font-bold text-blue-600">{zone.grade}</span>
                                <span className="text-[10px] text-slate-400">통합 등급</span>
                            </div>
                        </div>

                        {/* Radar Chart */}
                        <div className="relative h-64 w-full flex justify-center mb-4">
                            <canvas ref={chartRef}></canvas>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-slate-50 p-3 rounded-xl text-center">
                                <span className="block text-[10px] text-slate-400 mb-1">CCTV 설치</span>
                                <span className="font-bold text-slate-700">{zone.stats.cctv}</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl text-center">
                                <span className="block text-[10px] text-slate-400 mb-1">경찰관서</span>
                                <span className="font-bold text-slate-700">{zone.stats.police}개소</span>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Report */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                        <h3 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">
                            <i className="fa-solid fa-clipboard-list text-blue-500"></i> 상세 분석 리포트
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <h4 className="text-xs font-bold text-slate-700 mb-1">👮 치안/안전</h4>
                                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg">
                                    {zone.report.safety}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-700 mb-1">🏪 생활 인프라</h4>
                                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg">
                                    {zone.report.infra}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-700 mb-1">🚇 교통 환경</h4>
                                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg">
                                    {zone.report.traffic}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ----------------------------------------------------------------------
    // RENDER MAIN
    // ----------------------------------------------------------------------
    return (
        <>
            <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white relative">
                {/* ⚠️ [Required] libraries=services,clusterer is essential for MarkerClusterer */}
                <Script
                    src="//dapi.kakao.com/v2/maps/sdk.js?appkey=693e61b56c8dfdcac6b196b6fa46e513&libraries=services,clusterer,drawing&autoload=false"
                    strategy="afterInteractive"
                    onLoad={handleScriptLoad}
                />

                {/* ================================================================ */}
                {/* [패널 1] 리스트 패널 (항상 렌더링)                                  */}
                {/* 모바일: 상세 열리면 숨김 / PC: 항상 표시                             */}
                {/* ================================================================ */}
                <aside className={`w-full md:w-[400px] z-30 flex-col bg-white border-r shrink-0 ${(selectedListing || selectedZone) ? 'hidden md:flex' : 'flex'}`}>
                    {/* Search & Filter Header */}
                    <div className="p-4 border-b border-slate-100 bg-white shrink-0 space-y-4">
                        <div className="relative">
                            <i className="fa-solid fa-magnifying-glass absolute left-3 top-3 text-slate-400"></i>
                            <input type="text" defaultValue="관악구 신림동" readOnly
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none cursor-default" />
                        </div>

                        <div className="bg-slate-100 p-1 rounded-lg flex">
                            <button onClick={() => toggleDealType('all')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeDealType === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                                전체
                            </button>
                            <button onClick={() => toggleDealType('sale')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeDealType === 'sale' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                                매매
                            </button>
                            <button onClick={() => toggleDealType('jeonse')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeDealType === 'jeonse' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                                전세
                            </button>
                            <button onClick={() => toggleDealType('monthly')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeDealType === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                                월세
                            </button>
                        </div>

                        <div>
                            <span className="text-xs font-bold text-slate-400 mb-1.5 block">주거 유형 (중복 선택)</span>
                            <div className="flex gap-2">
                                {['APT', 'OP', 'YH', 'DD'].map(type => (
                                    <button key={type} onClick={() => toggleHousingType(type)}
                                        className={`filter-type-btn flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${activeHousingTypes.includes(type)
                                            ? 'active'
                                            : 'border-slate-200 bg-gray-50 text-slate-500'
                                            }`}>
                                        {HOUSING_TYPE_LABELS[type] || type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <span className="text-xs font-bold text-slate-400 mb-1.5 block">평형대</span>
                            <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
                                <button onClick={() => setActiveSize('all')}
                                    className={`filter-size-btn px-3 py-1.5 rounded-full border border-slate-200 text-xs font-medium whitespace-nowrap ${activeSize === 'all' ? 'active' : 'text-slate-500'}`}>전체</button>
                                <button onClick={() => setActiveSize('under10')}
                                    className={`filter-size-btn px-3 py-1.5 rounded-full border border-slate-200 text-xs font-medium whitespace-nowrap ${activeSize === 'under10' ? 'active' : 'text-slate-500'}`}>
                                    {isPyeong ? '~10평' : '~33㎡'}
                                </button>
                                <button onClick={() => setActiveSize('10to20')}
                                    className={`filter-size-btn px-3 py-1.5 rounded-full border border-slate-200 text-xs font-medium whitespace-nowrap ${activeSize === '10to20' ? 'active' : 'text-slate-500'}`}>
                                    {isPyeong ? '10~20평' : '33~66㎡'}
                                </button>
                                <button onClick={() => setActiveSize('over30')}
                                    className={`filter-size-btn px-3 py-1.5 rounded-full border border-slate-200 text-xs font-medium whitespace-nowrap ${activeSize === 'over30' ? 'active' : 'text-slate-500'}`}>
                                    {isPyeong ? '30평~' : '99㎡~'}
                                </button>
                            </div>
                        </div>

                        {/* 거래 연도 필터 */}
                        <div>
                            <span className="text-xs font-bold text-slate-400 mb-1.5 block">거래 연도</span>
                            <div className="flex gap-1.5">
                                {[{ value: 'all', label: '전체' }, { value: '2024', label: '2024년' }, { value: '2023', label: '2023년' }, { value: '2022~', label: '2022년~' }].map(opt => (
                                    <button key={opt.value} onClick={() => setActiveYear(opt.value)}
                                        className={`filter-size-btn flex-1 px-2 py-1.5 rounded-full border border-slate-200 text-xs font-medium whitespace-nowrap transition-colors ${activeYear === opt.value ? 'active' : 'text-slate-500'}`}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Budget Filter */}
                        <div className="mt-2 mb-2 pt-2 border-t border-slate-50">
                            <h3 className="text-xs font-bold text-slate-500 mb-2">예산 설정 (단위: 만원)</h3>
                            <div className="space-y-2">
                                <div>
                                    <label className="text-[10px] text-slate-400 mb-1 block">보증금/전세금</label>
                                    <div className="flex items-center gap-2">
                                        <input type="number" name="depositMin" placeholder="최소"
                                            value={budget.depositMin} onChange={handleBudgetChange}
                                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-sm font-bold text-slate-900 outline-none focus:border-blue-500" />
                                        <span className="text-slate-400">~</span>
                                        <input type="number" name="depositMax" placeholder="최대"
                                            value={budget.depositMax} onChange={handleBudgetChange}
                                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-sm font-bold text-slate-900 outline-none focus:border-blue-500" />
                                    </div>
                                </div>
                                {activeDealType === 'monthly' && (
                                    <div>
                                        <label className="text-[10px] text-slate-400 mb-1 block">월세</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" name="rentMin" placeholder="최소"
                                                value={budget.rentMin} onChange={handleBudgetChange}
                                                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-sm font-bold text-slate-900 outline-none focus:border-blue-500" />
                                            <span className="text-slate-400">~</span>
                                            <input type="number" name="rentMax" placeholder="최대"
                                                value={budget.rentMax} onChange={handleBudgetChange}
                                                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-sm font-bold text-slate-900 outline-none focus:border-blue-500" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 사이드바 콘텐츠: 항상 리스트만 표시 (상세는 오른쪽 패널에서) */}
                    <div id="sidebar-content" className="flex-1 overflow-y-auto bg-slate-50 p-4 relative">
                        <div className="space-y-3">
                            {initialLoading ? (
                                <div className="text-center py-10">
                                    <i className="fa-solid fa-circle-notch fa-spin text-blue-600 text-lg mb-2"></i>
                                    <p className="text-xs text-slate-400">매물을 불러오는 중...</p>
                                </div>
                            ) : listings.length === 0 ? <p className="text-center text-slate-400 text-sm py-10">매물이 없습니다.</p> :
                                listings.map(item => renderListingItem(item))
                            }
                        </div>
                    </div>
                </aside>

                {/* ================================================================ */}
                {/* [패널 2] 상세 정보 패널 (선택 시에만 렌더링)                         */}
                {/* ================================================================ */}
                {(selectedListing || selectedZone) && (
                    <aside className="fixed inset-0 z-40 md:static md:z-20 md:w-[400px] bg-white md:border-r md:shadow-2xl flex flex-col animate-slide-in-right">
                        {/* 헤더 영역 */}
                        <div className="p-4 border-b flex justify-between items-center bg-slate-50 shrink-0">
                            <h3 className="font-bold text-lg text-slate-800">상세 정보</h3>
                            <button onClick={restoreList} className="p-2 hover:bg-slate-200 rounded-full transition">
                                <i className="fa-solid fa-xmark text-xl text-slate-600"></i>
                            </button>
                        </div>
                        {/* 상세 내용 영역 */}
                        <div className="flex-1 overflow-y-auto custom-scroll">
                            {selectedZone ? renderZoneReport() : renderDetailView()}
                        </div>
                    </aside>
                )}

                {/* ================================================================ */}
                {/* [지도 영역]                                                       */}
                {/* ================================================================ */}
                <div className="flex-1 relative bg-gray-100 w-full h-full">
                    <section id="map-container" className="w-full h-full relative">
                        <div ref={mapContainerRef} id="map" className="w-full h-full"></div>

                        {/* Layer Options Wrapper */}
                        <div className="absolute top-4 right-4 z-20" id="layer-options-wrapper">
                            {/* Trigger Button */}
                            <button onClick={() => setLayerPanelOpen(!layerPanelOpen)} title="지도 옵션"
                                className="w-10 h-10 bg-white rounded-lg shadow-md border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer focus:outline-none">
                                <i className="fa-solid fa-layer-group text-slate-700 text-lg"></i>
                            </button>

                            {/* Unit Toggle Button */}
                            <button onClick={() => setIsPyeong(!isPyeong)} title="단위 변환"
                                className="mt-2 w-10 h-10 bg-white rounded-lg shadow-md border border-slate-200 flex flex-col items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer focus:outline-none text-[10px] font-bold text-slate-600">
                                <span className={isPyeong ? 'text-blue-600' : 'text-slate-400'}>평</span>
                                <span className="w-full h-[1px] bg-slate-100 my-0.5"></span>
                                <span className={!isPyeong ? 'text-blue-600' : 'text-slate-400'}>㎡</span>
                            </button>

                            {/* Popover Panel (Pixel-Perfect from Legacy) */}
                            {layerPanelOpen && (
                                <div id="layer-options-panel" className="absolute top-12 right-0 bg-white rounded-xl shadow-xl p-4 w-64 border border-slate-100 transition-all duration-200 ease-in-out animate-fade-in-up">
                                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                                        <i className="fa-solid fa-layer-group text-blue-600"></i> 레이어 옵션
                                    </h4>

                                    {/* View Mode Selector */}
                                    <div className="mb-4">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">👀 지도 채색 기준</label>
                                        <select
                                            value={currentViewMode}
                                            onChange={(e) => setCurrentViewMode(e.target.value)}
                                            className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 text-slate-700 focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="total">🏅 종합 안심 등급</option>
                                            <option value="security">👮 치안/안전 등급</option>
                                            <option value="building">🏢 물건/건물 등급</option>
                                            <option value="comfort">🌿 주거 쾌적성 등급</option>
                                            <option value="infra">🏪 생활 인프라 등급</option>
                                            <option value="traffic">🚇 교통 접근성 등급</option>
                                            <option value="env">🔊 환경/소음 등급</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full bg-green-500/50 border border-green-500"></span>
                                            <span className="text-sm font-medium text-gray-700">🛡️ 동네 등급 (행정동)</span>
                                        </div>
                                        <button
                                            onClick={() => toggleLayer('polygon')}
                                            className={`w-11 h-6 rounded-full relative transition-colors ${activeLayers.polygon ? 'bg-blue-600' : 'bg-gray-200'}`}
                                        >
                                            <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${activeLayers.polygon ? 'translate-x-5' : 'translate-x-0'}`}></span>
                                        </button>
                                    </div>

                                    {/* Special Zones */}
                                    <div className="mb-3 pt-3 border-t border-slate-50">
                                        <h4 className="text-xs font-bold text-slate-500 mb-2">특수 정보</h4>
                                        <div className="space-y-2">
                                            <label className="flex items-center justify-between cursor-pointer group">
                                                <div className="flex items-center gap-2">
                                                    <i className="fa-solid fa-volume-high text-red-500 text-xs"></i>
                                                    <span className="text-sm text-slate-600 group-hover:text-slate-800">소음/유해 구역</span>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={activeLayers.noise}
                                                    onChange={() => toggleLayer('noise')}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                                />
                                            </label>
                                            <label className="flex items-center justify-between cursor-pointer group">
                                                <div className="flex items-center gap-2">
                                                    <i className="fa-solid fa-graduation-cap text-purple-500 text-xs"></i>
                                                    <span className="text-sm text-slate-600 group-hover:text-slate-800">학원가/상권</span>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={activeLayers.academy}
                                                    onChange={() => toggleLayer('academy')}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                                />
                                            </label>
                                            <label className="flex items-center justify-between cursor-pointer group">
                                                <div className="flex items-center gap-2">
                                                    <i className="fa-solid fa-mountain text-amber-800 text-xs"></i>
                                                    <span className="text-sm text-slate-600 group-hover:text-slate-800">지형/경사도</span>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={activeLayers.hill}
                                                    onChange={() => toggleLayer('hill')}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                                />
                                            </label>
                                        </div>
                                    </div>


                                    <div className="mb-4">
                                        <h4 className="text-xs font-bold text-slate-500 mb-2">🏠 개별 물건 등급</h4>
                                        <div className="flex gap-2">
                                            {['A', 'B', 'C', 'D'].map(g => (
                                                <button key={g}
                                                    onClick={() => toggleGrade(g)}
                                                    className={`flex-1 py-1 text-[10px] font-bold text-white rounded shadow-sm hover:opacity-80 transition-opacity
                                                    ${g === 'A' ? 'bg-green-500' : g === 'B' ? 'bg-yellow-500' : g === 'C' ? 'bg-orange-500' : 'bg-red-500'}
                                                    ${!activeGrades.includes(g) ? 'opacity-20 hover:opacity-40 grayscale' : ''}
                                                    `}>
                                                    Grade {g}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full bg-purple-600 flex items-center justify-center">
                                                <i className="fa-solid fa-star text-[6px] text-white"></i>
                                            </span>
                                            <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">찐 후기 (입주민)</span>
                                        </div>
                                        <button
                                            onClick={() => toggleLayer('reviews')}
                                            className={`w-11 h-6 rounded-full relative transition-colors ${activeLayers.reviews ? 'bg-purple-600' : 'bg-gray-200'}`}
                                        >
                                            <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${activeLayers.reviews ? 'translate-x-5' : 'translate-x-0'}`}></span>
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center">
                                                <i className="fa-solid fa-video text-[6px] text-white"></i>
                                            </span>
                                            <span className="text-sm font-medium text-gray-700">안심 CCTV (방범용)</span>
                                        </div>
                                        <button
                                            onClick={() => toggleLayer('cctv')}
                                            className={`w-11 h-6 rounded-full relative transition-colors ${activeLayers.cctv ? 'bg-blue-600' : 'bg-gray-200'}`}
                                        >
                                            <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${activeLayers.cctv ? 'translate-x-5' : 'translate-x-0'}`}></span>
                                        </button>
                                    </div>

                                </div>
                            )}
                        </div>

                        {/* Map Loader */}
                        {!isMapLoaded && (
                            <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center backdrop-blur-sm">
                                <div className="bg-white p-4 rounded-xl shadow-xl flex flex-col items-center">
                                    <i className="fa-solid fa-circle-notch fa-spin text-2xl text-blue-600 mb-2"></i>
                                    <span className="text-xs font-bold text-slate-600">지도 로딩 중...</span>
                                </div>
                            </div>
                        )}

                        {/* Map Legend Toggle */}
                        <button
                            onClick={() => setIsLegendOpen(!isLegendOpen)}
                            className="absolute bottom-6 right-4 z-50 bg-white text-slate-700 p-3 rounded-full shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                            title="지도 범례"
                        >
                            <i className="fa-solid fa-circle-question text-xl text-blue-600"></i>
                        </button>

                        {/* Map Legend Panel */}
                        {isLegendOpen && (
                            <div className="absolute bottom-20 right-4 z-50 bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-white/50 w-72 animate-fade-in-up">
                                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                        <i className="fa-solid fa-map-location-dot text-blue-600"></i> 지도 범례
                                    </h4>
                                    <button onClick={() => setIsLegendOpen(false)} className="text-slate-400 hover:text-slate-600">
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    {/* 1. Zone Grade */}
                                    <div>
                                        <h5 className="text-[11px] font-bold text-slate-500 mb-2">🛡️ 동네 등급 (행정동 배경색)</h5>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded bg-green-500 shadow-sm"></span>
                                                <span className="text-xs text-slate-600">A (상위 15%)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded bg-yellow-400 shadow-sm"></span>
                                                <span className="text-xs text-slate-600">B (안심)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded bg-orange-400 shadow-sm"></span>
                                                <span className="text-xs text-slate-600">C (보통)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded bg-red-500 shadow-sm"></span>
                                                <span className="text-xs text-slate-600">D (주의)</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Property Grade */}
                                    <div>
                                        <h5 className="text-[11px] font-bold text-slate-500 mb-2">🏠 매물 안전 등급 (마커 색상)</h5>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full bg-[#22C55E] shadow-sm"></span>
                                                <span className="text-xs text-slate-600">A (안심)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full bg-[#EAB308] shadow-sm"></span>
                                                <span className="text-xs text-slate-600">B (양호)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full bg-[#F97316] shadow-sm"></span>
                                                <span className="text-xs text-slate-600">C (보통)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full bg-[#EF4444] shadow-sm"></span>
                                                <span className="text-xs text-slate-600">D (주의)</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. Special Info */}
                                    <div>
                                        <h5 className="text-[11px] font-bold text-slate-500 mb-2">✨ 특수 정보 (아이콘)</h5>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="w-4 h-4 rounded-full border border-red-500 bg-red-500/30 flex items-center justify-center">
                                                    <i className="fa-solid fa-volume-high text-[8px] text-red-600"></i>
                                                </span>
                                                <span className="text-xs text-slate-600">소음/유해 구역</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-4 h-4 rounded-full border border-purple-500 bg-purple-500/30 flex items-center justify-center">
                                                    <i className="fa-solid fa-graduation-cap text-[8px] text-purple-600"></i>
                                                </span>
                                                <span className="text-xs text-slate-600">학원가/상권</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-4 h-4 rounded-full border border-amber-800 bg-amber-800/40 flex items-center justify-center">
                                                    <i className="fa-solid fa-mountain text-[8px] text-amber-900"></i>
                                                </span>
                                                <span className="text-xs text-slate-600">지형/경사도</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {/* 토스트 알림 */}
            {toastMessage && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] animate-bounce">
                    <div className="bg-slate-900/90 text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-medium backdrop-blur-sm border border-slate-700">
                        {toastMessage}
                    </div>
                </div>
            )}

            {/* 로딩 오버레이 */}
            {isLoadingListings && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999]">
                    <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-slate-200 text-sm text-slate-600 flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        매물 데이터 로딩 중...
                    </div>
                </div>
            )}
        </>
    );
}
