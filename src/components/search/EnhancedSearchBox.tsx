import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

import UnifiedSearchResults from './UnifiedSearchResults';

import { useDebouncedSearch } from '@/lib/enhanced-search';
import { UnifiedSearchResult } from '@/lib/enhanced-search';

interface EnhancedSearchBoxProps {
  onResultClick?: (result: UnifiedSearchResult) => void;
  onResultSelect?: (type: 'store' | 'mall', data: unknown) => void;
  placeholder?: string;
  className?: string;
  userLocation?: { lat: number; lng: number };
}

export default function EnhancedSearchBox({
  onResultClick,
  onResultSelect: _onResultSelect,
  placeholder = 'ค้นหาห้างหรือแบรนด์...',
  className = '',
  userLocation,
}: EnhancedSearchBoxProps) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { results, loading, error } = useDebouncedSearch(query, userLocation);

  // Show results when there's a query
  useEffect(() => {
    setShowResults(query.trim().length > 0);
  }, [query]);

  // Handle Enter key to scroll to results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault();
      scrollToResults();
    }
  };

  const scrollToResults = () => {
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const clearSearch = () => {
    setQuery('');
    setShowResults(false);
    inputRef.current?.focus();
  };

  const handleResultClick = (result: UnifiedSearchResult) => {
    onResultClick?.(result);
    setShowResults(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>

        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            // Delay hiding results to allow clicks
            setTimeout(() => setFocused(false), 150);
          }}
          placeholder={placeholder}
          className="block w-full pl-12 pr-12 py-4 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-lg font-prompt"
          autoComplete="off"
          spellCheck="false"
          data-testid="search-input"
        />

        {/* Clear Button */}
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Search Results */}
      {showResults && (
        <div ref={resultsRef} className="mt-4">
          <UnifiedSearchResults
            results={results}
            query={query}
            loading={loading}
            error={error}
            onResultClick={handleResultClick}
          />
        </div>
      )}

      {/* Search Tips */}
      {!query && focused && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg p-4 z-10">
          <div className="text-sm text-gray-600 mb-3 font-prompt">
            <strong>💡 เคล็ดลับการค้นหา:</strong>
          </div>
          <div className="space-y-2 text-sm text-gray-500 font-prompt">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>พิมพ์ชื่อห้าง เช่น "Central Embassy" หรือ "MBK Center"</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>พิมพ์ชื่อแบรนด์ เช่น "Zara", "Starbucks"</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>กด Enter เพื่อดูผลลัพธ์ทั้งหมด</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
