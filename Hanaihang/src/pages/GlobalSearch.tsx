import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building, X, TrendingUp, Coffee, ShoppingBag, Utensils, Smartphone, Sparkles } from 'lucide-react';

import { useDebouncedSearch } from '@/lib/enhanced-search';
import UnifiedSearchResults from '@/components/search/UnifiedSearchResults';
import FadeIn from '@/components/ui/FadeIn';

const POPULAR_CATEGORIES = [
  { id: 'fashion', name: 'แฟชั่น', icon: ShoppingBag, color: 'bg-pink-100 text-pink-600' },
  { id: 'food', name: 'อาหารและเครื่องดื่ม', icon: Utensils, color: 'bg-orange-100 text-orange-600' },
  { id: 'cafe', name: 'คาเฟ่', icon: Coffee, color: 'bg-amber-100 text-amber-600' },
  { id: 'electronics', name: 'อิเล็กทรอนิกส์', icon: Smartphone, color: 'bg-blue-100 text-blue-600' },
  { id: 'beauty', name: 'ความงาม', icon: Sparkles, color: 'bg-purple-100 text-purple-600' },
];

const SUGGESTED_SEARCHES = [
  'Central World',
  'Siam Paragon',
  'Starbucks',
  'Uniqlo',
  'H&M',
  'After You'
];

const GlobalSearch: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use the advanced search hook
  const { results, loading, error } = useDebouncedSearch(query);

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const handleCategoryClick = (category: string) => {
    setQuery(category);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header section with gradient background */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <Search className="w-6 h-6 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 font-kanit">ค้นหาแบรนด์และห้าง</h1>
          </div>

          <div className="relative group">
            <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 ${isFocused ? 'text-primary-600' : 'text-gray-400'}`}>
              <Search className="h-6 w-6" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="block w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all duration-200 text-lg font-prompt"
              placeholder="ค้นหาชื่อร้าน, แบรนด์, หรือห้างสรรพสินค้า..."
              autoComplete="off"
              autoFocus
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <div className="bg-gray-200 rounded-full p-1 hover:bg-gray-300">
                  <X className="h-4 w-4" />
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8 pb-20">
        {/* Show results if query exists */}
        {query.trim() ? (
          <FadeIn>
            <UnifiedSearchResults
              results={results}
              query={query}
              loading={loading}
              error={error}
            />
          </FadeIn>
        ) : (
          /* Default View: Categories & Suggestions */
          <div className="space-y-10">
            {/* Popular Categories */}
            <FadeIn delay={0.1}>
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center font-kanit">
                  <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
                  หมวดหมู่ยอดนิยม
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {POPULAR_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.name)}
                      className="flex items-center p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md hover:border-primary-200 transition-all duration-200 text-left group"
                    >
                      <div className={`w-10 h-10 ${cat.color} rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform`}>
                        <cat.icon className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-gray-700 group-hover:text-primary-700 font-prompt">
                        {cat.name}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </FadeIn>

            {/* Suggested Searches */}
            <FadeIn delay={0.2}>
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 font-kanit">
                  การค้นหาแนะนำ
                </h2>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_SEARCHES.map((term, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(term)}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-full text-gray-600 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 transition-all font-prompt text-sm"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </section>
            </FadeIn>

            {/* Featured Malls (Mockup for visual richness) */}
            <FadeIn delay={0.3}>
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center font-kanit">
                  <Building className="w-5 h-5 mr-2 text-blue-600" />
                  ห้างสรรพสินค้าชั้นนำ
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    onClick={() => navigate('/malls/central-world')}
                    className="group cursor-pointer rounded-2xl overflow-hidden relative h-40 shadow-sm hover:shadow-lg transition-all"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1519567241046-7f570eee3ce9?auto=format&fit=crop&q=80&w=800"
                      alt="Central World"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                      <div>
                        <h3 className="text-white font-bold text-lg font-kanit">Central World</h3>
                        <p className="text-white/80 text-sm font-prompt">ราชประสงค์, กรุงเทพฯ</p>
                      </div>
                    </div>
                  </div>
                  <div
                    onClick={() => navigate('/malls/siam-paragon')}
                    className="group cursor-pointer rounded-2xl overflow-hidden relative h-40 shadow-sm hover:shadow-lg transition-all"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1555529733-0e670560f7e1?auto=format&fit=crop&q=80&w=800"
                      alt="Siam Paragon"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                      <div>
                        <h3 className="text-white font-bold text-lg font-kanit">Siam Paragon</h3>
                        <p className="text-white/80 text-sm font-prompt">ปทุมวัน, กรุงเทพฯ</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </FadeIn>
          </div>
        )}
      </main>
    </div>
  );
};

export default GlobalSearch;
