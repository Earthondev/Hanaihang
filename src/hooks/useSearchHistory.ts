/**
 * Search History Hook
 * Manages recent searches, popular queries, and search suggestions
 */

import { useState, useEffect, useCallback } from 'react';

interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultCount: number;
  clickedResults: string[];
  device: 'mobile' | 'desktop';
}

interface PopularQuery {
  query: string;
  count: number;
  lastUsed: number;
  avgResultCount: number;
  clickThroughRate: number;
}

interface SearchSuggestion {
  query: string;
  type: 'recent' | 'popular' | 'trending';
  confidence: number;
}

class SearchHistoryManager {
  private readonly STORAGE_KEY = 'haanaihang_search_history';
  private readonly MAX_HISTORY_ITEMS = 20;
  private readonly MAX_POPULAR_QUERIES = 50;
  private readonly SUGGESTION_THRESHOLD = 0.7;

  // Get search history from localStorage
  getSearchHistory(): SearchHistoryItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load search history:', error);
      return [];
    }
  }

  // Save search history to localStorage
  private saveSearchHistory(history: SearchHistoryItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }

  // Add new search to history
  addSearch(query: string, resultCount: number = 0): void {
    if (!query.trim()) return;

    const history = this.getSearchHistory();
    const device = window.innerWidth < 768 ? 'mobile' : 'desktop';
    
    // Remove existing entry if it exists
    const filteredHistory = history.filter(item => item.query !== query);
    
    // Add new entry at the beginning
    const newItem: SearchHistoryItem = {
      query: query.trim(),
      timestamp: Date.now(),
      resultCount,
      clickedResults: [],
      device
    };
    
    const updatedHistory = [newItem, ...filteredHistory].slice(0, this.MAX_HISTORY_ITEMS);
    this.saveSearchHistory(updatedHistory);
  }

  // Update search result count
  updateSearchResultCount(query: string, resultCount: number): void {
    const history = this.getSearchHistory();
    const updatedHistory = history.map(item => 
      item.query === query 
        ? { ...item, resultCount }
        : item
    );
    this.saveSearchHistory(updatedHistory);
  }

  // Track clicked result
  trackResultClick(query: string, resultId: string): void {
    const history = this.getSearchHistory();
    const updatedHistory = history.map(item => {
      if (item.query === query) {
        const clickedResults = [...item.clickedResults];
        if (!clickedResults.includes(resultId)) {
          clickedResults.push(resultId);
        }
        return { ...item, clickedResults };
      }
      return item;
    });
    this.saveSearchHistory(updatedHistory);
  }

  // Get recent searches
  getRecentSearches(limit: number = 10): SearchHistoryItem[] {
    const history = this.getSearchHistory();
    return history.slice(0, limit);
  }

  // Get popular queries
  getPopularQueries(limit: number = 10): PopularQuery[] {
    const history = this.getSearchHistory();
    const queryMap = new Map<string, {
      count: number;
      lastUsed: number;
      totalResults: number;
      totalClicks: number;
    }>();

    // Aggregate data by query
    history.forEach(item => {
      const existing = queryMap.get(item.query) || {
        count: 0,
        lastUsed: 0,
        totalResults: 0,
        totalClicks: 0
      };

      queryMap.set(item.query, {
        count: existing.count + 1,
        lastUsed: Math.max(existing.lastUsed, item.timestamp),
        totalResults: existing.totalResults + item.resultCount,
        totalClicks: existing.totalClicks + item.clickedResults.length
      });
    });

    // Convert to popular queries
    const popularQueries: PopularQuery[] = Array.from(queryMap.entries()).map(([query, data]) => ({
      query,
      count: data.count,
      lastUsed: data.lastUsed,
      avgResultCount: data.totalResults / data.count,
      clickThroughRate: data.totalClicks / data.count
    }));

    // Sort by count and recency
    return popularQueries
      .sort((a, b) => {
        // Weight by count and recency
        const scoreA = a.count * 0.7 + (Date.now() - a.lastUsed) / (1000 * 60 * 60 * 24) * 0.3;
        const scoreB = b.count * 0.7 + (Date.now() - b.lastUsed) / (1000 * 60 * 60 * 24) * 0.3;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  // Generate search suggestions
  generateSuggestions(currentQuery: string, limit: number = 8): SearchSuggestion[] {
    if (!currentQuery.trim()) {
      // Return recent and popular when no query
      const recent = this.getRecentSearches(5);
      const popular = this.getPopularQueries(5);
      
      return [
        ...recent.map(item => ({
          query: item.query,
          type: 'recent' as const,
          confidence: 0.9
        })),
        ...popular.map(item => ({
          query: item.query,
          type: 'popular' as const,
          confidence: 0.8
        }))
      ].slice(0, limit);
    }

    const history = this.getSearchHistory();
    const suggestions: SearchSuggestion[] = [];
    const queryLower = currentQuery.toLowerCase();

    // Find matching queries
    history.forEach(item => {
      const itemLower = item.query.toLowerCase();
      
      if (itemLower.includes(queryLower) && itemLower !== queryLower) {
        let confidence = 0.5;
        
        // Higher confidence for exact prefix matches
        if (itemLower.startsWith(queryLower)) {
          confidence = 0.9;
        } else if (itemLower.includes(queryLower)) {
          confidence = 0.7;
        }

        // Boost confidence for recent searches
        const daysSinceLastUsed = (Date.now() - item.timestamp) / (1000 * 60 * 60 * 24);
        if (daysSinceLastUsed < 1) {
          confidence += 0.2;
        } else if (daysSinceLastUsed < 7) {
          confidence += 0.1;
        }

        // Boost confidence for queries with results
        if (item.resultCount > 0) {
          confidence += 0.1;
        }

        suggestions.push({
          query: item.query,
          type: 'recent',
          confidence: Math.min(confidence, 1.0)
        });
      }
    });

    // Add trending/popular suggestions
    const popular = this.getPopularQueries(10);
    popular.forEach(item => {
      const itemLower = item.query.toLowerCase();
      
      if (itemLower.includes(queryLower) && itemLower !== queryLower) {
        const confidence = item.count > 3 ? 0.8 : 0.6;
        
        suggestions.push({
          query: item.query,
          type: 'popular',
          confidence
        });
      }
    });

    // Remove duplicates and sort by confidence
    const uniqueSuggestions = suggestions.reduce((acc, suggestion) => {
      const existing = acc.find(s => s.query === suggestion.query);
      if (!existing || suggestion.confidence > existing.confidence) {
        return acc.filter(s => s.query !== suggestion.query).concat(suggestion);
      }
      return acc;
    }, [] as SearchSuggestion[]);

    return uniqueSuggestions
      .filter(s => s.confidence >= this.SUGGESTION_THRESHOLD)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  // Clear search history
  clearHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Remove specific search
  removeSearch(query: string): void {
    const history = this.getSearchHistory();
    const updatedHistory = history.filter(item => item.query !== query);
    this.saveSearchHistory(updatedHistory);
  }

  // Get search statistics
  getStatistics() {
    const history = this.getSearchHistory();
    const popular = this.getPopularQueries();
    
    return {
      totalSearches: history.length,
      uniqueQueries: new Set(history.map(item => item.query)).size,
      avgResultsPerSearch: history.reduce((sum, item) => sum + item.resultCount, 0) / history.length,
      mostPopularQuery: popular[0]?.query || null,
      searchesToday: history.filter(item => 
        Date.now() - item.timestamp < 24 * 60 * 60 * 1000
      ).length,
      deviceBreakdown: {
        mobile: history.filter(item => item.device === 'mobile').length,
        desktop: history.filter(item => item.device === 'desktop').length
      }
    };
  }
}

// Singleton instance
const searchHistoryManager = new SearchHistoryManager();

// React Hook
export function useSearchHistory() {
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);
  const [popularQueries, setPopularQueries] = useState<PopularQuery[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);

  // Load initial data
  useEffect(() => {
    setRecentSearches(searchHistoryManager.getRecentSearches());
    setPopularQueries(searchHistoryManager.getPopularQueries());
  }, []);

  // Add search
  const addSearch = useCallback((query: string, resultCount: number = 0) => {
    searchHistoryManager.addSearch(query, resultCount);
    setRecentSearches(searchHistoryManager.getRecentSearches());
    setPopularQueries(searchHistoryManager.getPopularQueries());
  }, []);

  // Update result count
  const updateResultCount = useCallback((query: string, resultCount: number) => {
    searchHistoryManager.updateSearchResultCount(query, resultCount);
    setRecentSearches(searchHistoryManager.getRecentSearches());
  }, []);

  // Track result click
  const trackResultClick = useCallback((query: string, resultId: string) => {
    searchHistoryManager.trackResultClick(query, resultId);
  }, []);

  // Generate suggestions
  const generateSuggestions = useCallback((query: string) => {
    const newSuggestions = searchHistoryManager.generateSuggestions(query);
    setSuggestions(newSuggestions);
    return newSuggestions;
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    searchHistoryManager.clearHistory();
    setRecentSearches([]);
    setPopularQueries([]);
    setSuggestions([]);
  }, []);

  // Remove search
  const removeSearch = useCallback((query: string) => {
    searchHistoryManager.removeSearch(query);
    setRecentSearches(searchHistoryManager.getRecentSearches());
    setPopularQueries(searchHistoryManager.getPopularQueries());
  }, []);

  // Get statistics
  const getStatistics = useCallback(() => {
    return searchHistoryManager.getStatistics();
  }, []);

  return {
    recentSearches,
    popularQueries,
    suggestions,
    addSearch,
    updateResultCount,
    trackResultClick,
    generateSuggestions,
    clearHistory,
    removeSearch,
    getStatistics
  };
}

export default searchHistoryManager;