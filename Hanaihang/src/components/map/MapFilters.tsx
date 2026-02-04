import React, { useState } from 'react';
import { X, Filter, MapPin, Clock, Building, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
        newFilters.status.includes(mall.status || '')
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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute top-4 left-4 z-[400] w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden"
        >
          <div className="p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <Filter className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 font-kanit text-lg">ตัวกรองแผนที่</h3>
              </div>
              <div className="flex items-center space-x-2">
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs font-bold text-primary hover:text-primary-700 bg-primary/5 hover:bg-primary/10 px-2 py-1 rounded-lg transition-colors font-prompt"
                  >
                    ล้างทั้งหมด
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Search */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 font-prompt">
                  ค้นหาห้าง
                </label>
                <input
                  type="text"
                  value={filters.searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="พิมพ์ชื่อห้าง..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-sm font-prompt transition-all"
                />
              </div>

              {/* Status Filter */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Building className="w-4 h-4 text-gray-400" />
                  <h4 className="text-sm font-semibold text-gray-900 font-kanit">สถานะ</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'Published', label: 'เผยแพร่แล้ว' },
                    { value: 'Draft', label: 'ฉบับร่าง' },
                    { value: 'Archived', label: 'เก็บถาวร' }
                  ].map((status) => {
                    const isSelected = filters.status.includes(status.value);
                    return (
                      <button
                        key={status.value}
                        onClick={() => handleStatusToggle(status.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 font-prompt flex items-center space-x-1.5 ${isSelected
                          ? 'bg-primary/10 border-primary/20 text-primary'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{status.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Distance Filter */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <h4 className="text-sm font-semibold text-gray-900 font-kanit">ระยะทาง (กม.)</h4>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 5, 10, 20].map((distance) => (
                    <button
                      key={distance}
                      onClick={() => handleDistanceChange(filters.distance === distance ? null : distance)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-200 font-prompt text-center ${filters.distance === distance
                        ? 'bg-secondary/10 border-secondary/20 text-secondary-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                    >
                      &lt; {distance} กม.
                    </button>
                  ))}
                </div>
              </div>

              {/* Results Count */}
              <div className="pt-4 border-t border-dashed border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span className="font-prompt">ผลลัพธ์ที่พบ</span>
                  </div>
                  <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-lg font-kanit">
                    {malls.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MapFilters;
