import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Building, Navigation, Store, ChevronRight, X, Search } from 'lucide-react';
import { motion } from 'framer-motion';

import { UnifiedSearchResult } from '@/lib/enhanced-search';

interface UnifiedSearchResultsProps {
  results: UnifiedSearchResult[];
  query: string;
  loading: boolean;
  error?: string | null;
  onResultClick?: (result: UnifiedSearchResult) => void;
}

export default function UnifiedSearchResults({
  results,
  query,
  loading,
  error,
  onResultClick
}: UnifiedSearchResultsProps) {
  if (loading) {
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
    <section id="search-results" aria-live="polite" className="mt-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 font-kanit">
          ผลการค้นหา
        </h2>
        <span className="text-sm font-medium text-primary bg-primary/5 px-3 py-1 rounded-full font-prompt">
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
            onClick={() => onResultClick?.(result)}
          />
        ))}
      </div>
    </section>
  );
}

interface SearchResultCardProps {
  result: UnifiedSearchResult;
  rank: number;
  query: string;
  onClick?: () => void;
}

function SearchResultCard({ result, rank, query, onClick }: SearchResultCardProps) {
  const isNearby = result.distanceKm !== undefined && result.distanceKm < 1;
  const isMall = result.kind === 'mall';

  const formatDistance = (distanceKm?: number) => {
    if (distanceKm === undefined) return null;
    if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} ม.`;
    return `${distanceKm.toFixed(1)} กม.`;
  };

  const highlightText = (text: string, q: string) => {
    if (!q.trim()) return text;
    const regex = new RegExp(`(${q})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-primary/10 text-primary px-0.5 rounded font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const CardContent = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
      className={`relative group bg-white rounded-3xl border border-gray-100 p-5 transition-all duration-300 h-full flex flex-col`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 ${isMall ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary-600'} rounded-2xl flex items-center justify-center transition-colors group-hover:bg-primary group-hover:text-white`}>
            {isMall ? <Building className="w-6 h-6" /> : <Store className="w-6 h-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 font-kanit">
              {isMall ? 'ศูนย์การค้า' : 'ร้านค้า'}
            </div>
            <h3 className="text-base font-bold text-gray-900 font-kanit truncate group-hover:text-primary transition-colors">
              {highlightText(result.displayName, query)}
            </h3>
          </div>
        </div>

        {isNearby && (
          <div className="p-1 px-2.5 bg-green-500/10 text-green-600 rounded-full text-[10px] font-bold flex items-center space-x-1">
            <span className="w-1 h-1 bg-green-500 rounded-full"></span>
            <span>ใกล้ฉัน</span>
          </div>
        )}
      </div>

      {!isMall && result.mallName && (
        <p className="text-xs text-gray-500 font-prompt mb-4 line-clamp-1 bg-gray-50 p-2 rounded-xl">
          ที่ {highlightText(result.mallName, query)}
        </p>
      )}

      <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
        <div className="flex items-center space-x-3 text-xs font-medium text-gray-400 font-prompt">
          {result.distanceKm !== undefined && (
            <div className="flex items-center">
              <Navigation className="w-3.5 h-3.5 mr-1 text-primary/60" />
              {formatDistance(result.distanceKm)}
            </div>
          )}
          {result.floorLabel && (
            <div className="flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1" />
              ชั้น {result.floorLabel}
            </div>
          )}
        </div>

        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors transform group-hover:translate-x-1" />
      </div>
    </motion.div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left" data-testid="search-result-card">
        <CardContent />
      </button>
    );
  }

  const href = isMall ? `/malls/${result.id}` : `/stores/${result.id}`;

  return (
    <Link to={href} className="block" data-testid="search-result-card">
      <CardContent />
    </Link>
  );
}

function SearchResultsSkeleton() {
  return (
    <section className="mt-8">
      <div className="mb-6 h-6 w-32 bg-gray-100 rounded-xl animate-pulse"></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-white rounded-[32px] border border-gray-100 p-5 h-40 animate-pulse">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 w-1/2 bg-gray-100 rounded-lg"></div>
                <div className="h-4 w-3/4 bg-gray-100 rounded-lg"></div>
              </div>
            </div>
            <div className="h-4 w-full bg-gray-50 rounded-lg mt-auto"></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SearchErrorState({ error }: { error: string }) {
  return (
    <section className="mt-8 text-center py-12">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
        <X className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 font-kanit">เกิดข้อผิดพลาด</h3>
      <p className="text-gray-500 font-prompt mt-2 mb-6">{error}</p>
      <button onClick={() => window.location.reload()} className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-gray-200">
        ลองอีกครั้ง
      </button>
    </section>
  );
}

function SearchEmptyState({ query }: { query: string }) {
  const suggestions = ['Siam Paragon', 'Central Rama 3', 'Starbucks', 'Uniqlo', 'MBK'];

  return (
    <section className="mt-8 text-center py-20 bg-white rounded-[40px] border border-dashed border-gray-200">
      <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
        <Search className="w-10 h-10" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 font-kanit">ไม่พบผลลัพธ์ที่คุณค้นหา</h3>
      <p className="text-gray-500 font-prompt mt-2 mb-8">เราไม่พบอะไรที่ตรงกับ "{query}" ลองค้นหาด้วยคำอื่นๆ</p>

      <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto">
        {suggestions.map(s => (
          <button
            key={s}
            className="px-5 py-2.5 bg-gray-100 hover:bg-primary/10 hover:text-primary text-gray-600 rounded-2xl text-sm font-bold font-prompt transition-all"
            onClick={() => {
              const input = document.querySelector('input') as HTMLInputElement;
              if (input) {
                input.value = s;
                input.dispatchEvent(new Event('input', { bubbles: true }));
              }
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </section>
  );
}
