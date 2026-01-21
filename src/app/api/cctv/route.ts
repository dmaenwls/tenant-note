import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    // distance implementation is limited in standard API, but we'll fetch allowing for client-side filtering or basic region filtering if possible. 
    // For "Standard Data", we'll just fetch a batch. Ideally we filter by Institution but we don't know it.
    // We will fetch a reasonable amount.

    const apiKey = process.env.DATA_GO_KR_CCTV_KEY;
    if (!apiKey) {
        console.error("❌ [API] DATA_GO_KR_CCTV_KEY is missing in .env.local");
        return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    // Endpoint: Standard Public Data API
    const baseUrl = 'http://api.data.go.kr/openapi/tn_pubr_public_cctv_api';

    // Construct Query
    const queryParams = new URLSearchParams({
        serviceKey: apiKey, // The key must be decoded if passed to searchParams? Next.js/Node fetch handles it? 
        // Use 'serviceKey' as string concatenation if encoding issues arise, but try standard first.
        // Actually, public data keys often need Decode. If env has Decode key, it should be sent as is?
        // Usually, we send the DECODED key if using `URLSearchParams` because it encodes it.
        // If the key in env IS decoded, `URLSearchParams` will encode it (double encode?).
        // If the key in env IS encoded, `URLSearchParams` will double encode it.
        // Public Data Portal usually expects the Decoded Key so the library encodes it, OR the Encoded Key passed as string.
        // Best practice: Append string manually to avoid double encoding if unsure.
        pageNo: '1',
        numOfRows: '100', // Fetch 100 for now
        type: 'json'
    });

    // Manual URL construction to ensure Key safety (avoiding double-encoding if using URLSearchParams on already encoded chars, though Decoding key is standard)
    // We assume the stored key is the DECODED key.
    const finalUrl = `${baseUrl}?${queryParams.toString()}`;

    // 1. [DEBUG] Log the actual URL
    console.log(`📡 [API Request] GET ${finalUrl}`);

    try {
        const response = await fetch(finalUrl);

        // 2. [DEBUG] Log Response Status
        console.log(`✅ [API Response] Status: ${response.status}`);

        const textBody = await response.text();

        // 3. [DEBUG] Check for Service Error (XML format often returned even if JSON requested on error)
        if (textBody.includes('<OpenAPI_ServiceResponse>') || textBody.includes('SERVICE_KEY_IS_NOT_REGISTERED')) {
            console.error(`🔥 [API Error] Service Key or Logic Error:\n${textBody}`);
            return NextResponse.json({ error: "External API Error", details: textBody }, { status: 502 });
        }

        try {
            const data = JSON.parse(textBody);

            // Check for result code in JSON
            if (data.response?.header?.resultCode !== '00') {
                console.warn(`⚠️ [API Result] Code: ${data.response?.header?.resultCode}, Msg: ${data.response?.header?.resultMsg}`);
            }

            const items = data.response?.body?.items || [];
            console.log(`📦 [API Data] fetched ${items.length} items`);

            // Transform Data
            const cctvs = items.map((item: any) => ({
                name: item.institutionNm,
                address: item.rdnmadr || item.lnmadr,
                lat: parseFloat(item.latitude),
                lng: parseFloat(item.longitude),
                count: parseInt(item.cameraCo || '1'),
                purpose: item.installationPurpsType
            })).filter((c: any) => !isNaN(c.lat) && !isNaN(c.lng));

            return NextResponse.json({ features: cctvs });

        } catch (parseError) {
            console.error(`💥 [API Parse Error] Failed to parse JSON. Body:\n${textBody.substring(0, 500)}...`);
            return NextResponse.json({ error: "Invalid JSON response", body: textBody }, { status: 502 });
        }

    } catch (error: any) {
        console.error(`☠️ [API Network Error] ${error.message}`);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
