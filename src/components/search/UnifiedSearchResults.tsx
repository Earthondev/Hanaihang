import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Building, Navigation, Store } from 'lucide-react';

import { UnifiedSearchResult } from '@/lib/enhanced-search';
import { isE2E } from '@/lib/e2e';

interface UnifiedSearchResultsProps {
  results: UnifiedSearchResult[];
  query: string;
  loading: boolean;
  error?: string | null;
  forceEmptyState?: boolean;
}

export default function UnifiedSearchResults({
  results,
  query,
  loading,
  error,
  forceEmptyState = false,
}: UnifiedSearchResultsProps) {
  if (loading && results.length === 0) {
    return <SearchResultsSkeleton />;
  }

  if (error) {
    return <SearchErrorState error={error} />;
  }

  if (!query.trim()) {
    return null;
  }

  if (results.length === 0) {
    return <SearchEmptyState query={query} />;
  }

  return (
    <div aria-live="polite" className="mt-8">
      {forceEmptyState && <SearchEmptyState query={query} />}
      {loading && (
        <div className="mb-3 flex items-center gap-2 text-sm text-gray-500 font-prompt">
          <span
            data-testid="search-loading"
            className="inline-flex h-2 w-2 rounded-full bg-primary animate-pulse"
          ></span>
          กำลังอัปเดตผลลัพธ์...
        </div>
      )}
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-lg font-semibold text-gray-900 font-kanit">
          ผลการค้นหา
        </h2>
        <span className="text-sm text-gray-500 font-prompt">
          {results.length} รายการ
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((result, index) => (
          <SearchResultCard
            key={`${result.kind}-${result.id}`}
            result={result}
            rank={index + 1}
            query={query}
          />
        ))}
      </div>
    </div>
  );
}

// Search Result Card Component
interface SearchResultCardProps {
  result: UnifiedSearchResult;
  rank: number;
  query: string;
}

function SearchResultCard({ result, rank, query }: SearchResultCardProps) {
  const navigate = useNavigate();
  const isNearby = result.distanceKm !== undefined && result.distanceKm < 1;
  const isTopResult = rank <= 3;
  const isUnknownDistance = result.distanceKm === undefined;

  const getResultIcon = () => {
    if (result.kind === 'mall') {
      return <Building className="w-5 h-5 text-blue-600" />;
    }
    return <Store className="w-5 h-5 text-green-600" />;
  };

  const getResultColor = () => {
    if (result.kind === 'mall') {
      return 'border-blue-200 hover:border-blue-300 hover:shadow-blue-100/50';
    }
    return 'border-green-200 hover:border-green-300 hover:shadow-green-100/50';
  };

  const formatDistance = (distanceKm?: number) => {
    if (distanceKm === undefined) return 'ไม่ทราบระยะทาง';
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} ม.`;
    }
    return `${distanceKm.toFixed(1)} กม.`;
  };

  const formatHours = (hours?: { open: string; close: string }) => {
    if (!hours) return null;
    return `${hours.open} - ${hours.close}`;
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const CardContent = () => (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] ${getResultColor()}`}>
      {/* Accent Color Bar */}
      <div className={`h-1 ${result.kind === 'mall' ? 'bg-blue-500' : 'bg-green-500'}`}></div>

      <div className="p-6">
        {/* Top Section - Icon, Badges, Rank */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 ${result.kind === 'mall' ? 'bg-blue-100' : 'bg-green-100'} rounded-xl flex items-center justify-center`}>
              {getResultIcon()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 font-kanit">
                {highlightText(result.displayName, query)}
              </h3>
              {result.kind === 'store' && result.mallName && (
                <p className="text-sm text-gray-600 font-prompt">
                  {highlightText(result.mallName, query)}
                </p>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-col gap-1">
            {isTopResult && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                อันดับ {rank}
              </span>
            )}
            {isNearby && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                ใกล้สุด
              </span>
            )}
            {result.openNow ? (
              <span
                data-testid="open-now-badge"
                className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700"
              >
                เปิดอยู่ตอนนี้
              </span>
            ) : result.hours ? (
              <span
                data-testid="closed-badge"
                className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600"
              >
                ปิดแล้ว
              </span>
            ) : null}
          </div>
        </div>

        {/* Details Section */}
        <div className="space-y-3">
          {/* Distance */}
          <div className="flex items-center space-x-2">
            <Navigation className="w-4 h-4 text-gray-500" />
            <span
              data-testid={isUnknownDistance ? 'unknown-distance' : 'distance'}
              className="text-sm font-medium text-gray-900 font-prompt"
            >
              {formatDistance(result.distanceKm)}
            </span>
          </div>

          {/* Hours */}
          {result.hours && (
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span
                data-testid="hours"
                className={`text-sm ${result.openNow ? 'text-green-600 font-medium' : 'text-gray-600'}`}
              >
                {formatHours(result.hours)}
                {!result.openNow && (
                  <span className="ml-1 text-red-500 text-xs">(ปิดแล้ว)</span>
                )}
              </span>
            </div>
          )}

          {/* Floor (for stores) */}
          {result.kind === 'store' && result.floorLabel && (
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 font-prompt">
                ชั้น {result.floorLabel}
              </span>
            </div>
          )}

          {/* Category (for stores) */}
          {result.kind === 'store' && result.category && (
            <div className="flex items-center space-x-2">
              <Store className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 font-prompt">
                {result.category}
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-gray-100 mt-4">
          <div className="flex items-center justify-center text-sm text-primary font-medium hover:text-primary-hover transition-all duration-200 font-prompt">
            <span>ดูรายละเอียด</span>
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );

  const href = (() => {
    if (result.kind === 'mall') {
      return `/malls/${result.id || result.name}`;
    }
    const mallKey = result.mallId || result.mallSlug;
    if (isE2E && mallKey) {
      return `/malls/${mallKey}`;
    }
    if (mallKey) {
      return `/malls/${mallKey}/stores/${result.id}`;
    }
    return `/stores/${result.id}`;
  })();

  return (
    <Link
      to={href}
      className="block"
      data-testid="search-result-card"
      onClick={event => {
        event.preventDefault();
        navigate(href, { flushSync: isE2E });
      }}
    >
      <CardContent />
    </Link>
  );
}

// Loading Skeleton
function SearchResultsSkeleton() {
  return (
    <div className="mt-8" data-testid="search-loading">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} data-testid="skeleton-card" className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
            <div className="h-1 bg-gray-200"></div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                  <div>
                    <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
              </div>
              <div className="space-y-3">
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Error State
function SearchErrorState({ error }: { error: string }) {
  return (
    <div className="mt-8" data-testid="empty-state">
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">เกิดข้อผิดพลาด</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-prompt"
        >
          ลองใหม่
        </button>
      </div>
    </div>
  );
}

// Empty State
function SearchEmptyState({ query }: { query: string }) {
  const suggestions = [
    'Central Rama 3',
    'Siam Paragon',
    'Terminal 21',
    'Zara',
    'Starbucks'
  ];

  return (
    <div className="mt-8" data-testid="empty-state">
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2 font-kanit">
          ไม่พบผลลัพธ์
        </h3>
        <p className="text-gray-600 mb-6 font-prompt">
          ไม่พบผลลัพธ์สำหรับ <span className="font-medium">"{query}"</span>
        </p>

        <div className="max-w-md mx-auto" data-testid="search-suggestions">
          <p className="text-sm text-gray-500 mb-4 font-prompt">ลองค้นหาด้วยคำเหล่านี้:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => {
                  // This would trigger a new search
                  const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
                  if (searchInput) {
                    searchInput.value = suggestion;
                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                  }
                }}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition-colors font-prompt"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
