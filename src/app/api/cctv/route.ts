import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    // 참고: 현재 공공데이터포털 CCTV API는 위경도 기반 검색을 지원하지 않고 전체 목록을 줍니다.
    // 추후 DB 구축 시 사용하기 위해 변수는 남겨둡니다.
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');

    const apiKey = process.env.DATA_GO_KR_CCTV_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "API Key Missing" }, { status: 500 });
    }

    // CCTV 표준 데이터 API 엔드포인트
    const baseUrl = 'http://api.data.go.kr/openapi/tn_pubr_public_cctv_api';
    // 페이지 번호와 요청 개수를 넉넉히 잡습니다.
    const queryParams = `?serviceKey=${apiKey}&pageNo=1&numOfRows=100&type=json`;

    try {
        console.log(`📡 [API Request] CCTV 데이터 요청 시작...`);
        const res = await fetch(`${baseUrl}${queryParams}`);

        // 응답 텍스트 확인 (디버깅용)
        const textBody = await res.text();
        // console.log(`🔍 [Raw Response] ${textBody.substring(0, 200)}...`); // 원본 확인 필요시 주석 해제

        // 1. JSON 파싱 시도
        let data;
        try {
            data = JSON.parse(textBody);
        } catch (e) {
            // XML 에러일 경우 처리
            if (textBody.includes('SERVICE_KEY_IS_NOT_REGISTERED')) {
                console.error("🔥 API 키가 아직 등록되지 않았습니다 (동기화 대기 필요)");
                return NextResponse.json({ error: "Key Not Registered" }, { status: 502 });
            }
            console.error("💥 JSON 파싱 실패 (XML 응답일 가능성)");
            return NextResponse.json({ error: "Invalid JSON", raw: textBody }, { status: 500 });
        }

        // 2. 결과 코드 확인
        const resultCode = data.response?.header?.resultCode;
        if (resultCode !== '00') {
            console.error(`⚠️ API Error Code: ${resultCode} (${data.response?.header?.resultMsg})`);
            return NextResponse.json({ error: data.response?.header?.resultMsg }, { status: 500 });
        }

        // 3. 데이터 구조 유연하게 처리 (핵심 수정!)
        // 구조가 items: [...] 인지, items: { item: [...] } 인지 체크
        const rawItems = data.response?.body?.items;
        let items = [];

        if (Array.isArray(rawItems)) {
            items = rawItems; // 바로 배열인 경우
        } else if (rawItems && Array.isArray(rawItems.item)) {
            items = rawItems.item; // items.item 안에 배열이 있는 경우
        } else if (rawItems) {
            items = [rawItems]; // 데이터가 1개라 객체로 온 경우 배열로 변환
        }

        console.log(`📦 [API Data] 추출된 데이터: ${items.length}건`);

        // 4. 데이터 변환 (한글 필드명 매핑)
        const cctvs = items.map((item: any, index: number) => {
            return {
                id: `cctv-${index}`,
                name: item.institutionNm || item.관리기관명 || 'CCTV',
                // 좌표가 문자열로 올 수 있으므로 parseFloat 처리
                lat: parseFloat(item.latitude || item.WGS84위도 || item.위도 || '0'),
                lng: parseFloat(item.longitude || item.WGS84경도 || item.경도 || '0'),
                address: item.lnmadr || item.rdnmadr || item.소재지도로명주소 || '',
                purpose: item.installationPurpsType || item.설치목적구분 || '다목적'
            };
        }).filter((c: any) => c.lat !== 0 && c.lng !== 0); // 좌표 없는 데이터 제거

        console.log(`✅ [API Success] 최종 변환 데이터: ${cctvs.length}건 반환`);

        return NextResponse.json({ features: cctvs });

    } catch (error: any) {
        console.error(`☠️ Server Error: ${error.message}`);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}