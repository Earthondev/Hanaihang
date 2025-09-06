import React, { useState } from 'react';
import { Filter, X, MapPin, Building, Tag, Clock } from 'lucide-react';

interface SearchFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void;
  malls: any[];
  categories: string[];
}

export interface SearchFilters {
  mallIds: string[];
  categories: string[];
  status: string[];
  distance: number | null;
  sortBy: 'relevance' | 'distance' | 'name' | 'category';
  sortOrder: 'asc' | 'desc';
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  onFiltersChange,
  malls,
  categories
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    mallIds: [],
    categories: [],
    status: ['Active'],
    distance: null,
    sortBy: 'relevance',
    sortOrder: 'asc'
  });

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleMallToggle = (mallId: string) => {
    const newMallIds = filters.mallIds.includes(mallId)
      ? filters.mallIds.filter(id => id !== mallId)
      : [...filters.mallIds, mallId];
    handleFilterChange('mallIds', newMallIds);
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(cat => cat !== category)
      : [...filters.categories, category];
    handleFilterChange('categories', newCategories);
  };

  const handleStatusToggle = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    handleFilterChange('status', newStatus);
  };

  const clearAllFilters = () => {
    const clearedFilters: SearchFilters = {
      mallIds: [],
      categories: [],
      status: ['Active'],
      distance: null,
      sortBy: 'relevance',
      sortOrder: 'asc'
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = filters.mallIds.length > 0 || 
                          filters.categories.length > 0 || 
                          filters.status.length !== 1 || 
                          filters.status[0] !== 'Active' ||
                          filters.distance !== null;

  return (
    <div className="relative">
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors
          ${hasActiveFilters 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }
        `}
      >
        <Filter className="w-4 h-4" />
        <span>ตัวกรอง</span>
        {hasActiveFilters && (
          <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
            {filters.mallIds.length + filters.categories.length + (filters.status.length !== 1 ? 1 : 0) + (filters.distance ? 1 : 0)}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">ตัวกรองการค้นหา</h3>
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
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Mall Filter */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Building className="w-4 h-4 text-gray-500" />
                  <h4 className="font-medium text-gray-900">ห้างสรรพสินค้า</h4>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {malls.map((mall) => (
                    <label key={mall.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.mallIds.includes(mall.id)}
                        onChange={() => handleMallToggle(mall.id)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">
                        {mall.displayName || mall.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <h4 className="font-medium text-gray-900">หมวดหมู่</h4>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {categories.map((category) => (
                    <label key={category} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <h4 className="font-medium text-gray-900">สถานะ</h4>
                </div>
                <div className="space-y-2">
                  {['Active', 'Maintenance', 'Closed'].map((status) => (
                    <label key={status} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.status.includes(status)}
                        onChange={() => handleStatusToggle(status)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">
                        {status === 'Active' ? 'เปิด' : 
                         status === 'Maintenance' ? 'ปิดปรับปรุง' : 'ปิด'}
                      </span>
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
                        onChange={() => handleFilterChange('distance', distance)}
                        className="border-gray-300 text-green-600 focus:ring-green-500"
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
                      onChange={() => handleFilterChange('distance', null)}
                      className="border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">ไม่จำกัดระยะทาง</span>
                  </label>
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">เรียงลำดับ</h4>
                <div className="space-y-2">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="relevance">ความเกี่ยวข้อง</option>
                    <option value="distance">ระยะทาง</option>
                    <option value="name">ชื่อร้าน</option>
                    <option value="category">หมวดหมู่</option>
                  </select>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="asc">น้อยไปมาก</option>
                    <option value="desc">มากไปน้อย</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;
