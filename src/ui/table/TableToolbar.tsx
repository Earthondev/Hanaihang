import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";

import { useDebouncedValue } from "../../legacy/hooks/useDebouncedValue";

type Option = { label: string; value: string };

interface Filter {
  label: string;
  key: string;
  options: Option[];
  value?: string;
  onChange?: (value: string) => void;
}

interface TableToolbarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onReset?: () => void;
  filters?: Filter[];
  className?: string;
}

export default function TableToolbar({ 
  placeholder = "ค้นหา…", 
  onSearch, 
  onReset, 
  filters = [],
  className = ''
}: TableToolbarProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 350);

  // ยิง search เมื่อ debounce แล้ว
  useEffect(() => {
    onSearch(debouncedQuery.trim());
    
    // Analytics tracking
    if (debouncedQuery.trim() && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'table_search', {
        event_category: 'table_actions',
        event_label: 'search',
        custom_parameter: {
          query: debouncedQuery,
          length: debouncedQuery.length
        }
      });
    }
  }, [debouncedQuery, onSearch]);

  const handleReset = () => {
    setQuery("");
    onReset?.();
    
    // Analytics tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'table_reset_filters', {
        event_category: 'table_actions',
        event_label: 'reset'
      });
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-xl ${className}`}>
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="h-11 w-full pl-10 pr-4 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="ค้นหา"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
            aria-label="ล้างการค้นหา"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      {filters.map((filter) => (
        <div key={filter.key} className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            {filter.label}:
          </label>
          <select
            value={filter.value ?? ""}
            onChange={(e) => {
              filter.onChange?.(e.target.value);
              
              // Analytics tracking
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'table_filter_change', {
                  event_category: 'table_actions',
                  event_label: 'filter',
                  custom_parameter: {
                    filter_key: filter.key,
                    filter_value: e.target.value
                  }
                });
              }
            }}
            className="h-11 rounded-xl border border-gray-300 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label={`ฟิลเตอร์ ${filter.label}`}
          >
            <option value="">ทั้งหมด</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {/* Reset Button */}
      {onReset && (
        <button
          onClick={handleReset}
          className="h-11 px-4 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          aria-label="รีเซ็ตตัวกรอง"
        >
          รีเซ็ต
        </button>
      )}
    </div>
  );
}
