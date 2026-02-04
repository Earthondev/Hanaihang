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
  const buttonClass = "p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 hover:bg-white hover:scale-105 active:scale-95 transition-all duration-200 text-gray-700 hover:text-primary";

  return (
    <div className="absolute top-4 right-4 z-[400] flex flex-col space-y-3">
      {/* Center on User Location */}
      <button
        onClick={onCenterUserLocation}
        disabled={!userLocation}
        className={`
          ${buttonClass}
          ${!userLocation ? 'opacity-50 cursor-not-allowed grayscale' : ''}
        `}
        title={userLocation ? 'ไปยังตำแหน่งของคุณ' : 'ไม่พบตำแหน่งของคุณ'}
      >
        <Navigation className={`w-5 h-5 ${userLocation ? 'fill-current' : ''}`} />
      </button>

      {/* Show All Malls */}
      <button
        onClick={onShowAllMalls}
        className={buttonClass}
        title={`แสดงห้างสรรพสินค้าทั้งหมด (${mallsCount} ห้าง)`}
      >
        <MapPin className="w-5 h-5" />
      </button>

      {/* Filters */}
      <button
        onClick={onToggleFilters}
        className={buttonClass}
        title="ตัวกรอง"
      >
        <Filter className="w-5 h-5" />
      </button>

      {/* Layers */}
      <button
        onClick={onToggleLayers}
        className={buttonClass}
        title="ชั้นข้อมูล"
      >
        <Layers className="w-5 h-5" />
      </button>

      {/* Fullscreen Toggle */}
      <button
        onClick={onToggleFullscreen}
        className={buttonClass}
        title={isFullscreen ? 'ออกจากเต็มหน้าจอ' : 'เต็มหน้าจอ'}
      >
        {isFullscreen ? (
          <Minimize2 className="w-5 h-5" />
        ) : (
          <Maximize2 className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};

export default MapControls;
