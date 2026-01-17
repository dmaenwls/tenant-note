import MapContainer from '@/components/map/MapContainer';

export default function MapPage() {
    return (
        <div className="w-full h-screen pt-[60px]"> {/* 헤더 높이만큼 패딩 */}
            <MapContainer />
        </div>
    );
}
