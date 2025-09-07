import React from 'react';

import { Floor } from '../../types/mall-system';

interface FloorTabsProps {
  floors: Floor[];
  activeFloorId?: string;
  onFloorChange: (floorId: string) => void;
  storeCounts?: Record<string, number>;
  className?: string;
  showAll?: boolean;
}

const FloorTabs: React.FC<FloorTabsProps> = ({
  floors,
  activeFloorId,
  onFloorChange,
  storeCounts = {},
  className = "",
  showAll = true
}) => {
  const sortedFloors = [...floors].sort((a, b) => a.order - b.order);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* All Floors Tab */}
      {showAll && (
        <button
          onClick={() => onFloorChange('all')}
          className={`
            px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-200
            ${activeFloorId === 'all' || !activeFloorId
              ? 'bg-green-600 text-white shadow-sm'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          <div className="flex flex-col items-center">
            <span>ทุกชั้น</span>
            {storeCounts.all !== undefined && (
              <span className="text-xs opacity-75">{storeCounts.all} ร้าน</span>
            )}
          </div>
        </button>
      )}

      {/* Individual Floor Tabs */}
      {sortedFloors.map((floor) => (
        <button
          key={floor.id}
          onClick={() => onFloorChange(floor.id!)}
          className={`
            px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-200
            ${activeFloorId === floor.id
              ? 'bg-green-600 text-white shadow-sm'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          <div className="flex flex-col items-center">
            <span>
              {floor.label === 'G' ? 'ชั้นดิน' : `ชั้น ${floor.label}`}
            </span>
            {storeCounts[floor.id!] !== undefined && (
              <span className="text-xs opacity-75">{storeCounts[floor.id!]} ร้าน</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};

export default FloorTabs;
