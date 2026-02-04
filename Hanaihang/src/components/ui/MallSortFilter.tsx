import React from 'react';
import { MapPin, Clock, Store, Star, Filter, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

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
  { value: 'distance', label: 'ใกล้ฉัน', icon: MapPin },
  { value: 'name', label: 'ชื่อ A-Z', icon: Star },
  { value: 'open-now', label: 'เปิดตอนนี้', icon: Clock },
  { value: 'store-count', label: 'ร้านอาหารเยอะ', icon: Store },
] as const;

const filterOptions = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'open-now', label: 'เปิดตอนนี้' },
  { value: 'shopping-center', label: 'ศูนย์การค้า' },
  { value: 'community-mall', label: 'คอมมูนิตี้' },
  { value: 'high-end', label: 'ลักชูรี' },
  { value: 'outlet', label: 'เอาท์เล็ต' },
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
    <div className={`flex flex-col sm:flex-row gap-4 sm:items-center ${className}`}>
      {/* Search/Filter Container */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-gray-100/50 backdrop-blur-sm rounded-2xl border border-gray-100">
        {sortOptions.map((option) => {
          const isActive = sortBy === option.value;
          const Icon = option.icon;

          return (
            <button
              key={option.value}
              onClick={() => onSortChange(option.value as SortOption)}
              className={`
                relative flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
                ${isActive
                  ? 'text-primary'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="sort-pill"
                  className="absolute inset-0 bg-white shadow-sm border border-gray-100 rounded-xl"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className={`relative w-3.5 h-3.5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
              <span className="relative">{option.label}</span>
            </button>
          );
        })}
      </div>

      {showFilters && (
        <div className="flex items-center space-x-2">
          <div className="h-6 w-[1px] bg-gray-200 hidden sm:block"></div>
          <div className="relative group">
            <select
              value={filterBy}
              onChange={(e) => onFilterChange(e.target.value as FilterOption)}
              className="appearance-none bg-white border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer hover:bg-gray-50 min-w-[140px]"
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors" />
          </div>
        </div>
      )}
    </div>
  );
}

export default MallSortFilter;
