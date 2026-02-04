import React from 'react';
import { MapPin, Clock, Store, Star, Filter } from 'lucide-react';

export type SortOption = 
  | 'distance' 
  | 'name' 
  | 'open-now' 
  | 'store-count' 
  | 'newest';

export type FilterOption = 
  | 'all' 
  | 'open-now' 
  | 'shopping-center' 
  | 'community-mall' 
  | 'high-end' 
  | 'outlet' 
  | 'department-store';

interface MallSortFilterProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  filterBy: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  showFilters?: boolean;
  className?: string;
}

const sortOptions = [
  { value: 'distance', label: 'ใกล้ฉันที่สุด', icon: MapPin },
  { value: 'name', label: 'ชื่อ A-Z', icon: Star },
  { value: 'open-now', label: 'เปิดอยู่ตอนนี้', icon: Clock },
  { value: 'store-count', label: 'จำนวนร้านมากที่สุด', icon: Store },
  { value: 'newest', label: 'ใหม่ล่าสุด', icon: Star }
] as const;

const filterOptions = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'open-now', label: 'เปิดอยู่ตอนนี้' },
  { value: 'shopping-center', label: 'ศูนย์การค้า' },
  { value: 'community-mall', label: 'คอมมูนิตี้มอลล์' },
  { value: 'high-end', label: 'ไฮเอนด์' },
  { value: 'outlet', label: 'เอาท์เล็ต' },
  { value: 'department-store', label: 'ห้างสรรพสินค้า' }
] as const;

export function MallSortFilter({
  sortBy,
  onSortChange,
  filterBy,
  onFilterChange,
  showFilters = true,
  className = ''
}: MallSortFilterProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Sort Options */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          เรียงตาม
        </label>
        <div className="flex flex-wrap gap-2">
          {sortOptions.map((option) => {
            const Icon = option.icon;
            const isActive = sortBy === option.value;
            
            return (
              <button
                key={option.value}
                onClick={() => onSortChange(option.value as SortOption)}
                className={`
                  inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-green-600 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Filter className="w-4 h-4 inline mr-1" />
            กรองตาม
          </label>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => {
              const isActive = filterBy === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => onFilterChange(option.value as FilterOption)}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default MallSortFilter;
