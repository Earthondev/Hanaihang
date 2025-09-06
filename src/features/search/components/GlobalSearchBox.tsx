import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Building2, Store as StoreIcon, X, Loader2 } from 'lucide-react';

import { useSearchAll } from '@/features/search/hooks/useSearchAll';
import { useUserLocation } from '@/features/search/hooks/useUserLocation';
import { SearchResult, Mall, Store } from '@/types/mall-system';
import { cn } from '@/utils/cn';

interface GlobalSearchBoxProps {
  onMallSelect?: (mall: Mall) => void;
  onStoreSelect?: (store: Store & { mallName?: string; mallSlug?: string }) => void;
  className?: string;
  placeholder?: string;
  showLocationButton?: boolean;
}

export function GlobalSearchBox({
  onMallSelect,
  onStoreSelect,
  className,
  placeholder = "ค้นหาห้างหรือร้านค้า...",
  showLocationButton = true
}: GlobalSearchBoxProps) {
  const [keyword, setKeyword] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult>({ malls: [], stores: [] });
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { searchWithDebounce, isLoading, error } = useSearchAll();
  const { location, requestLocation, isLoading: locationLoading } = useUserLocation();

  // Debounced search
  const debouncedSearch = useCallback(async (searchTerm: string) => {
    if (searchTerm.trim().length < 2) {
      setResults({ malls: [], stores: [] });
      return;
    }

    try {
      const searchResults = await searchWithDebounce({
        keyword: searchTerm,
        userLocation: location,
        limit: 20,
        includeMalls: true,
        includeStores: true
      });
      setResults(searchResults);
    } catch (err) {
      console.error('Search failed:', err);
    }
  }, [searchWithDebounce, location]);

  // Handle search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedSearch(keyword);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [keyword, debouncedSearch]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = results.malls.length + results.stores.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, totalItems - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          const allItems = [...results.malls, ...results.stores];
          const selectedItem = allItems[selectedIndex];
          if (selectedItem) {
            if ('category' in selectedItem) {
              // It's a store
              onStoreSelect?.(selectedItem as Store & { mallName?: string; mallSlug?: string });
            } else {
              // It's a mall
              onMallSelect?.(selectedItem as Mall);
            }
            handleClose();
          }
        }
        break;
      case 'Escape':
        handleClose();
        break;
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setSelectedIndex(-1);
    setResults({ malls: [], stores: [] });
  };

  const handleMallClick = (mall: Mall) => {
    onMallSelect?.(mall);
    handleClose();
  };

  const handleStoreClick = (store: Store & { mallName?: string; mallSlug?: string }) => {
    onStoreSelect?.(store);
    handleClose();
  };

  const handleLocationClick = async () => {
    await requestLocation();
  };

  const totalResults = results.malls.length + results.stores.length;
  const hasResults = totalResults > 0;

  return (
    <div ref={searchRef} className={cn("relative w-full max-w-2xl", className)}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="block w-full pl-10 pr-12 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary bg-white shadow-sm hover:shadow-md transition-all duration-200 text-text-primary placeholder-gray-500 font-prompt"
        />
        
        {/* Location Button */}
        {showLocationButton && (
          <button
            onClick={handleLocationClick}
            disabled={locationLoading}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            title="ใช้ตำแหน่งของฉัน"
          >
            {locationLoading ? (
              <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
            ) : location ? (
              <MapPin className="h-5 w-5 text-blue-500" />
            ) : (
              <MapPin className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        )}
        
        {/* Clear Button */}
        {keyword && (
          <button
            onClick={() => {
              setKeyword('');
              setResults({ malls: [], stores: [] });
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 right-8 flex items-center pr-2"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (hasResults || isLoading || error) && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 text-blue-500 animate-spin mr-2" />
              <span className="text-gray-600">กำลังค้นหา...</span>
            </div>
          )}

          {error && (
            <div className="p-4 text-red-600 text-sm">
              เกิดข้อผิดพลาดในการค้นหา: {error}
            </div>
          )}

          {!isLoading && !error && hasResults && (
            <div className="py-2">
              {/* Malls Section */}
              {results.malls.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                    <Building2 className="inline h-3 w-3 mr-1" />
                    ห้างสรรพสินค้า ({results.malls.length})
                  </div>
                  {results.malls.map((mall, index) => (
                    <button
                      key={mall.id}
                      onClick={() => handleMallClick(mall)}
                      className={cn(
                        "w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none",
                        selectedIndex === index && "bg-blue-50 border-l-4 border-blue-500"
                      )}
                    >
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {mall.displayName}
                          </div>
                          {mall.district && (
                            <div className="text-sm text-gray-500 truncate">
                              {mall.district}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Stores Section */}
              {results.stores.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                    <StoreIcon className="inline h-3 w-3 mr-1" />
                    ร้านค้า ({results.stores.length})
                  </div>
                  {results.stores.map((store, index) => (
                    <button
                      key={store.id}
                      onClick={() => handleStoreClick(store)}
                      className={cn(
                        "w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none",
                        selectedIndex === results.malls.length + index && "bg-blue-50 border-l-4 border-blue-500"
                      )}
                    >
                      <div className="flex items-center">
                        <StoreIcon className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {store.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {store.mallName && `${store.mallName}`}
                            {store.distanceKm !== undefined && (
                              <span className="ml-2 text-blue-600">
                                • {store.distanceKm.toFixed(1)} กม.
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isLoading && !error && !hasResults && keyword.trim().length >= 2 && (
            <div className="p-4 text-center text-gray-500">
              ไม่พบผลลัพธ์สำหรับ "{keyword}"
            </div>
          )}

          {/* Popular Suggestions */}
          {!isLoading && !error && !hasResults && keyword.trim().length < 2 && (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                🔍 คำค้นหายอดนิยม
              </div>
              <div className="px-4 py-2">
                <div className="flex flex-wrap gap-2">
                  {['Central Rama 3', 'Zara', 'Starbucks', 'Siam Paragon', 'Terminal 21', 'Uniqlo'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setKeyword(suggestion);
                        inputRef.current?.focus();
                      }}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
