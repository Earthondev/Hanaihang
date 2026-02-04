import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, TrendingUp, Sun, Moon, Utensils, Coffee, Film, GlassWater, Croissant } from 'lucide-react';

import UnifiedSearchResults from './UnifiedSearchResults';

import { useDebouncedSearch } from '@/lib/enhanced-search';
import { UnifiedSearchResult } from '@/lib/enhanced-search';
import { SuggestionEngine, SearchSuggestion } from '@/lib/search-suggestions';

interface EnhancedSearchBoxProps {
  onResultClick?: (result: UnifiedSearchResult) => void;
  onResultSelect?: (type: 'store' | 'mall', data: unknown) => void;
  placeholder?: string;
  className?: string;
  userLocation?: { lat: number; lng: number };
}

const IconMap: Record<string, React.FC<any>> = {
  Sun, Moon, Utensils, Coffee, Film, GlassWater, Croissant
};

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
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { results, loading, error } = useDebouncedSearch(query, userLocation);

  // Load suggestions when focused
  useEffect(() => {
    if (focused && !query) {
      setSuggestions(SuggestionEngine.getSuggestions());
    }
  }, [focused, query]);

  // Show results when there's a query
  useEffect(() => {
    setShowResults(query.trim().length > 0);
  }, [query]);

  // Handle Enter key to scroll to results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault();
      // Track valid search
      SuggestionEngine.addToHistory(query);
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
    // Refresh suggestions
    setSuggestions(SuggestionEngine.getSuggestions());
  };

  const handleResultClick = (result: UnifiedSearchResult) => {
    // Track valid search
    SuggestionEngine.addToHistory(query || result.displayName);
    onResultClick?.(result);
    setShowResults(false);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    SuggestionEngine.addToHistory(suggestion.text);
    inputRef.current?.focus();
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
          onFocus={() => {
            setFocused(true);
            setSuggestions(SuggestionEngine.getSuggestions());
          }}
          onBlur={() => {
            // Delay hiding results to allow clicks
            setTimeout(() => setFocused(false), 200);
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

      {/* Smart Suggestions (When query is empty) */}
      {!query && focused && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-xl p-4 z-20 overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {suggestions.map((suggestion, idx) => {
              const Icon = suggestion.icon ? IconMap[suggestion.icon] : (suggestion.type === 'history' ? Clock : TrendingUp);
              const isHistory = suggestion.type === 'history';

              return (
                <button
                  key={`${suggestion.type}-${suggestion.text}-${idx}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 text-left ${isHistory
                      ? 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                      : suggestion.type === 'time-based'
                        ? 'bg-primary/5 hover:bg-primary/10 text-primary-700'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                >
                  <div className={`p-2 rounded-lg ${isHistory ? 'bg-white text-gray-400' : 'bg-white shadow-sm'
                    }`}>
                    {Icon && <Icon className={`w-4 h-4 ${suggestion.type === 'time-based' ? 'text-primary' : ''
                      }`} />}
                  </div>
                  <div>
                    <div className="font-prompt font-medium text-sm">{suggestion.text}</div>
                    {suggestion.label && (
                      <div className="text-[10px] opacity-70 font-kanit">{suggestion.label}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
