import React, { useState } from 'react';
import { X, Filter, MapPin, Clock, Building } from 'lucide-react';
import { Mall } from '@/types/mall-system';

interface MapFiltersProps {
  malls: Mall[];
  onFiltersChange: (filteredMalls: Mall[]) => void;
  isVisible: boolean;
  onClose: () => void;
}

interface FilterState {
  status: string[];
  distance: number | null;
  searchQuery: string;
}

const MapFilters: React.FC<MapFiltersProps> = ({
  malls,
  onFiltersChange,
  isVisible,
  onClose
}) => {
  const [filters, setFilters] = useState<FilterState>({
    status: ['Published'],
    distance: null,
    searchQuery: ''
  });

  const applyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    
    let filteredMalls = [...malls];

    // Filter by status
    if (newFilters.status.length > 0) {
      filteredMalls = filteredMalls.filter(mall => 
        newFilters.status.includes(mall.status)
      );
    }

    // Filter by search query
    if (newFilters.searchQuery.trim()) {
      const query = newFilters.searchQuery.toLowerCase();
      filteredMalls = filteredMalls.filter(mall =>
        mall.displayName?.toLowerCase().includes(query) ||
        mall.name?.toLowerCase().includes(query) ||
        mall.address?.toLowerCase().includes(query)
      );
    }

    onFiltersChange(filteredMalls);
  };

  const handleStatusToggle = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    
    applyFilters({ ...filters, status: newStatus });
  };

  const handleDistanceChange = (distance: number | null) => {
    applyFilters({ ...filters, distance });
  };

  const handleSearchChange = (searchQuery: string) => {
    applyFilters({ ...filters, searchQuery });
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterState = {
      status: ['Published'],
      distance: null,
      searchQuery: ''
    };
    applyFilters(clearedFilters);
  };

  const hasActiveFilters = filters.status.length !== 1 || 
                          filters.status[0] !== 'Published' ||
                          filters.distance !== null ||
                          filters.searchQuery.trim() !== '';

  if (!isVisible) return null;

  return (
    <div className="absolute top-4 left-4 z-[1000] w-80 bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">ตัวกรองแผนที่</h3>
          </div>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ล้างทั้งหมด
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ค้นหาห้างสรรพสินค้า
            </label>
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="พิมพ์ชื่อห้าง..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Building className="w-4 h-4 text-gray-500" />
              <h4 className="font-medium text-gray-900">สถานะ</h4>
            </div>
            <div className="space-y-2">
              {[
                { value: 'Published', label: 'เปิด' },
                { value: 'Draft', label: 'ร่าง' },
                { value: 'Archived', label: 'ปิด' }
              ].map((status) => (
                <label key={status.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.status.includes(status.value)}
                    onChange={() => handleStatusToggle(status.value)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">{status.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Distance Filter */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <MapPin className="w-4 h-4 text-gray-500" />
              <h4 className="font-medium text-gray-900">ระยะทาง (กม.)</h4>
            </div>
            <div className="space-y-2">
              {[1, 3, 5, 10, 20].map((distance) => (
                <label key={distance} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="distance"
                    checked={filters.distance === distance}
                    onChange={() => handleDistanceChange(distance)}
                    className="border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">
                    ภายใน {distance} กิโลเมตร
                  </span>
                </label>
              ))}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="distance"
                  checked={filters.distance === null}
                  onChange={() => handleDistanceChange(null)}
                  className="border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">ไม่จำกัดระยะทาง</span>
              </label>
            </div>
          </div>

          {/* Results Count */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                แสดง {malls.length} ห้างสรรพสินค้า
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapFilters;
