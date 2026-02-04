import React from 'react';
import { Navigation, MapPin, Filter, Layers, Maximize2, Minimize2 } from 'lucide-react';

interface MapControlsProps {
  onCenterUserLocation: () => void;
  onShowAllMalls: () => void;
  onToggleFilters: () => void;
  onToggleLayers: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  userLocation: { lat: number; lng: number } | null;
  mallsCount: number;
}

const MapControls: React.FC<MapControlsProps> = ({
  onCenterUserLocation,
  onShowAllMalls,
  onToggleFilters,
  onToggleLayers,
  onToggleFullscreen,
  isFullscreen,
  userLocation,
  mallsCount
}) => {
  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col space-y-2">
      {/* Center on User Location */}
      <button
        onClick={onCenterUserLocation}
        disabled={!userLocation}
        className={`
          p-3 bg-white rounded-lg shadow-lg border border-gray-200
          hover:bg-gray-50 transition-colors
          ${!userLocation ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'}
        `}
        title={userLocation ? 'ไปยังตำแหน่งของคุณ' : 'ไม่พบตำแหน่งของคุณ'}
      >
        <Navigation className={`w-5 h-5 ${userLocation ? 'text-blue-600' : 'text-gray-400'}`} />
      </button>

      {/* Show All Malls */}
      <button
        onClick={onShowAllMalls}
        className="p-3 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 hover:shadow-xl transition-colors"
        title={`แสดงห้างสรรพสินค้าทั้งหมด (${mallsCount} ห้าง)`}
      >
        <MapPin className="w-5 h-5 text-green-600" />
      </button>

      {/* Filters */}
      <button
        onClick={onToggleFilters}
        className="p-3 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 hover:shadow-xl transition-colors"
        title="ตัวกรอง"
      >
        <Filter className="w-5 h-5 text-purple-600" />
      </button>

      {/* Layers */}
      <button
        onClick={onToggleLayers}
        className="p-3 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 hover:shadow-xl transition-colors"
        title="ชั้นข้อมูล"
      >
        <Layers className="w-5 h-5 text-orange-600" />
      </button>

      {/* Fullscreen Toggle */}
      <button
        onClick={onToggleFullscreen}
        className="p-3 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 hover:shadow-xl transition-colors"
        title={isFullscreen ? 'ออกจากเต็มหน้าจอ' : 'เต็มหน้าจอ'}
      >
        {isFullscreen ? (
          <Minimize2 className="w-5 h-5 text-gray-600" />
        ) : (
          <Maximize2 className="w-5 h-5 text-gray-600" />
        )}
      </button>
    </div>
  );
};

export default MapControls;
