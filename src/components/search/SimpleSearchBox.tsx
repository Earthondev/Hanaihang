/**
 * Simple Search Box Component
 * No dropdown, just triggers search on input
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useLocation } from '../../contexts/LocationContext';
import { searchRateLimiter } from '../../lib/rate-limiter';
import { trackSearchQuery } from '../../lib/analytics';

interface SimpleSearchBoxProps {
  onQuery: (query: string) => void;
  placeholder?: string;
  className?: string;
}

const SimpleSearchBox: React.FC<SimpleSearchBoxProps> = ({
  onQuery,
  placeholder = "ค้นหาห้างสรรพสินค้าและร้านค้า...",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const { userLocation } = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback((searchQuery: string) => {
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Clear previous abort controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Rate limiting check
    if (!searchRateLimiter.canMakeRequest()) {
      const timeUntilNext = searchRateLimiter.getTimeUntilNextRequest();
      console.log(`Rate limited. Next request in ${timeUntilNext}ms`);
      return;
    }

    // Debounce the search
    debounceTimeoutRef.current = setTimeout(() => {
      if (searchQuery.trim().length >= 1) {
        trackSearchQuery(searchQuery);
        onQuery(searchQuery.trim());
      } else {
        onQuery('');
      }
    }, 120); // 120ms debounce as specified
  }, [onQuery]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (!isComposing) {
      debouncedSearch(value);
    }
  }, [debouncedSearch, isComposing]);

  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    const value = e.currentTarget.value;
    setQuery(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Clear debounce and search immediately
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      if (query.trim().length >= 1) {
        trackSearchQuery(query);
        onQuery(query.trim());
      }
      
      // Scroll to results
      const resultsSection = document.getElementById('search-results');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        resultsSection.focus();
      }
    }
  }, [query, onQuery]);

  const handleClear = useCallback(() => {
    setQuery('');
    onQuery('');
    inputRef.current?.focus();
  }, [onQuery]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="ค้นหาห้างสรรพสินค้าและร้านค้า"
          aria-describedby="search-help"
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
        />

        {/* Clear Button */}
        {query && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              aria-label="ล้างการค้นหา"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div id="search-help" className="mt-2 text-sm text-gray-500">
        กด Enter เพื่อเลื่อนไปยังผลลัพธ์
        {userLocation && (
          <span className="ml-2 text-green-600">• ใช้ตำแหน่งปัจจุบันในการเรียงลำดับ</span>
        )}
      </div>
    </div>
  );
};

export default SimpleSearchBox;
