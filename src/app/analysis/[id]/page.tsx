import Link from 'next/link';

export default function AnalysisPage({ params }: { params: { id: string } }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="text-center space-y-6">
                <h1 className="text-3xl font-bold text-gray-900">
                    매물 ID: {params.id} 분석 리포트 준비 중...
                </h1>
                <p className="text-gray-600">
                    상세 분석 데이터를 불러오는 중입니다.
                </p>
                <Link
                    href="/map"
                    className="inline-block px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
                >
                    지도 보러 가기
                </Link>
            </div>
        </div>
    );
}
