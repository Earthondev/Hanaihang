/**
 * Search Results Section Component
 * Displays search results in a card grid layout
 */

import React from 'react';
import { UnifiedSearchResult } from '../../lib/unified-search';
import SearchResultCard from './SearchResultCard';

interface SearchResultsSectionProps {
  results: UnifiedSearchResult[];
  query: string;
  loading?: boolean;
  onResultClick?: (result: UnifiedSearchResult) => void;
}

const SearchResultsSection: React.FC<SearchResultsSectionProps> = ({
  results,
  query,
  loading = false,
  onResultClick
}) => {
  const handleResultClick = (result: UnifiedSearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    } else {
      // Default navigation
      if (result.kind === 'mall') {
        window.location.href = `/mall/${result.id}`;
      } else {
        window.location.href = `/stores/${result.id}`;
      }
    }
  };

  if (loading) {
    return (
      <section id="search-results" aria-live="polite" className="mt-6">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">ผลการค้นหา</h2>
          <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
        </div>
        
        {/* Loading Skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-lg"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!query || query.trim().length < 1) {
    return null;
  }

  if (results.length === 0) {
    return (
      <section id="search-results" aria-live="polite" className="mt-6">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">ผลการค้นหา</h2>
          <span className="text-sm text-gray-500">0 รายการ</span>
        </div>
        
        {/* Empty State */}
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบผลการค้นหา</h3>
          <p className="text-gray-600 mb-4">
            ไม่พบผลการค้นหาสำหรับ "<span className="font-medium">{query}</span>"
          </p>
          <div className="text-sm text-gray-500">
            <p>ลองค้นหาด้วยคำอื่น หรือตรวจสอบการสะกด</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="search-results" aria-live="polite" className="mt-6">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-lg font-semibold text-gray-900">ผลการค้นหา</h2>
        <span className="text-sm text-gray-500">
          {results.length} รายการ
        </span>
      </div>
      
      {/* Results Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((result) => (
          <SearchResultCard
            key={`${result.kind}-${result.id}`}
            result={result}
            highlightQuery={query}
            onClick={() => handleResultClick(result)}
          />
        ))}
      </div>
      
      {/* Results Summary for Screen Readers */}
      <div className="sr-only" aria-live="polite">
        พบผลการค้นหา {results.length} รายการสำหรับ "{query}"
      </div>
    </section>
  );
};

export default SearchResultsSection;
