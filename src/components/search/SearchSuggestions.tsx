import React, { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, MapPin, History, Trash2 } from 'lucide-react';

import { useSearchHistory } from '../../hooks/useSearchHistory';

interface SearchSuggestionsProps {
  query: string;
  onSuggestionSelect: (suggestion: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

interface Suggestion {
  text: string;
  type: 'recent' | 'trending' | 'store' | 'mall' | 'category';
  count?: number;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  query,
  onSuggestionSelect,
  onClose,
  isVisible,
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const { recentSearches, popularQueries, removeSearch } = useSearchHistory();

  // Mock data for suggestions
  const mockSuggestions: Suggestion[] = [
    // Recent searches
    { text: 'H&M', type: 'recent' },
    { text: 'Central World', type: 'recent' },
    { text: 'Fashion', type: 'recent' },

    // Trending searches
    { text: 'Starbucks', type: 'trending', count: 1250 },
    { text: "McDonald's", type: 'trending', count: 980 },
    { text: 'Uniqlo', type: 'trending', count: 750 },

    // Store suggestions
    { text: 'H&M Central World', type: 'store' },
    { text: 'H&M Siam Paragon', type: 'store' },
    { text: 'H&M EmQuartier', type: 'store' },

    // Mall suggestions
    { text: 'Central World', type: 'mall' },
    { text: 'Siam Paragon', type: 'mall' },
    { text: 'EmQuartier', type: 'mall' },

    // Category suggestions
    { text: 'Fashion', type: 'category' },
    { text: 'Food & Beverage', type: 'category' },
    { text: 'Electronics', type: 'category' },
  ];

  useEffect(() => {
    if (!isVisible) {
      setSuggestions([]);
      return;
    }

    setLoading(true);

    // Simulate API call delay
    const timer = setTimeout(() => {
      let allSuggestions: Suggestion[] = [];

      if (query.trim()) {
        // Filter suggestions based on query
        const filteredSuggestions = mockSuggestions.filter(suggestion =>
          suggestion.text.toLowerCase().includes(query.toLowerCase()),
        );
        allSuggestions = [...filteredSuggestions];
      } else {
        // Show recent and popular searches when no query
        const recentSuggestions = recentSearches.slice(0, 3).map(item => ({
          text: item.query,
          type: 'recent' as const,
        }));

        const popularSuggestions = popularQueries.slice(0, 3).map(item => ({
          text: item.query,
          type: 'trending' as const,
          count: item.count,
        }));

        allSuggestions = [...recentSuggestions, ...popularSuggestions];
      }

      // Sort by type priority and relevance
      const sortedSuggestions = allSuggestions.sort((a, b) => {
        if (query.trim()) {
          const aRelevance = a.text
            .toLowerCase()
            .startsWith(query.toLowerCase())
            ? 1
            : 0;
          const bRelevance = b.text
            .toLowerCase()
            .startsWith(query.toLowerCase())
            ? 1
            : 0;

          if (aRelevance !== bRelevance) return bRelevance - aRelevance;
        }

        const typeOrder = {
          recent: 0,
          trending: 1,
          store: 2,
          mall: 3,
          category: 4,
        };
        return typeOrder[a.type] - typeOrder[b.type];
      });

      setSuggestions(sortedSuggestions.slice(0, 8));
      setLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isVisible, recentSearches, popularQueries]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isVisible || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          onSuggestionSelect(suggestions[selectedIndex].text);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  const getSuggestionIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'recent':
        return <History className="w-4 h-4 text-gray-400" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4 text-orange-500" />;
      case 'store':
        return <Search className="w-4 h-4 text-blue-500" />;
      case 'mall':
        return <MapPin className="w-4 h-4 text-green-500" />;
      case 'category':
        return <Search className="w-4 h-4 text-purple-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSuggestionLabel = (type: Suggestion['type']) => {
    switch (type) {
      case 'recent':
        return 'ค้นหาล่าสุด';
      case 'trending':
        return 'ยอดนิยม';
      case 'store':
        return 'ร้านค้า';
      case 'mall':
        return 'ห้างสรรพสินค้า';
      case 'category':
        return 'หมวดหมู่';
      default:
        return '';
    }
  };

  if (!isVisible || (!loading && suggestions.length === 0)) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {loading ? (
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">กำลังค้นหา...</p>
        </div>
      ) : (
        <div className="py-2">
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.type}-${suggestion.text}-${index}`}
              className={`
                flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors
                ${selectedIndex === index ? 'bg-gray-50' : ''}
              `}
            >
              <button
                onClick={() => onSuggestionSelect(suggestion.text)}
                className="flex items-center space-x-3 flex-1 min-w-0"
              >
                {getSuggestionIcon(suggestion.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {suggestion.text}
                    </span>
                    {suggestion.count && (
                      <span className="text-xs text-gray-500">
                        ({suggestion.count.toLocaleString()})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {getSuggestionLabel(suggestion.type)}
                  </p>
                </div>
              </button>

              {suggestion.type === 'recent' && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    removeSearch(suggestion.text);
                  }}
                  className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="ลบจากประวัติ"
                >
                  <Trash2 className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;
