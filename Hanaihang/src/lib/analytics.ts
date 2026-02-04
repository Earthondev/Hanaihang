/**
 * Simple analytics tracking for search functionality
 */

interface SearchEvent {
  type: 'search_query' | 'search_result_click' | 'search_latency' | 'empty_result';
  query?: string;
  resultType?: 'mall' | 'store';
  resultId?: string;
  latency?: number;
  timestamp: number;
}

class SearchAnalytics {
  private events: SearchEvent[] = [];
  private readonly maxEvents = 1000; // Keep only last 1000 events

  track(event: Omit<SearchEvent, 'timestamp'>) {
    const fullEvent: SearchEvent = {
      ...event,
      timestamp: Date.now()
    };

    this.events.push(fullEvent);

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Store in localStorage for persistence
    try {
      localStorage.setItem('search_analytics', JSON.stringify(this.events));
    } catch (error) {
      console.warn('Failed to store analytics:', error);
    }
  }

  getAnalytics() {
    const now = Date.now();
    const last24h = this.events.filter(e => now - e.timestamp < 24 * 60 * 60 * 1000);
    
    const searchQueries = last24h.filter(e => e.type === 'search_query');
    const resultClicks = last24h.filter(e => e.type === 'search_result_click');
    const latencies = last24h.filter(e => e.type === 'search_latency' && e.latency);
    const emptyResults = last24h.filter(e => e.type === 'empty_result');

    return {
      totalSearches: searchQueries.length,
      totalClicks: resultClicks.length,
      clickThroughRate: searchQueries.length > 0 ? (resultClicks.length / searchQueries.length) * 100 : 0,
      medianLatency: this.calculateMedian(latencies.map(e => e.latency!)),
      emptyResultRate: searchQueries.length > 0 ? (emptyResults.length / searchQueries.length) * 100 : 0,
      topQueries: this.getTopQueries(searchQueries),
      topResultTypes: this.getTopResultTypes(resultClicks)
    };
  }

  private calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  private getTopQueries(queries: SearchEvent[]): Array<{ query: string; count: number }> {
    const counts = new Map<string, number>();
    
    queries.forEach(event => {
      if (event.query) {
        counts.set(event.query, (counts.get(event.query) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getTopResultTypes(clicks: SearchEvent[]): Array<{ type: string; count: number }> {
    const counts = new Map<string, number>();
    
    clicks.forEach(event => {
      if (event.resultType) {
        counts.set(event.resultType, (counts.get(event.resultType) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }

  clear() {
    this.events = [];
    localStorage.removeItem('search_analytics');
  }

  // Load from localStorage on initialization
  load() {
    try {
      const stored = localStorage.getItem('search_analytics');
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load analytics:', error);
      this.events = [];
    }
  }
}

// Create singleton instance
export const searchAnalytics = new SearchAnalytics();

// Load existing data
searchAnalytics.load();

// Export convenience functions
export const trackSearchQuery = (query: string) => {
  searchAnalytics.track({ type: 'search_query', query });
};

export const trackSearchResultClick = (query: string, resultType: 'mall' | 'store', resultId: string) => {
  searchAnalytics.track({ type: 'search_result_click', query, resultType, resultId });
};

export const trackSearchLatency = (query: string, latency: number) => {
  searchAnalytics.track({ type: 'search_latency', query, latency });
};

export const trackEmptyResult = (query: string) => {
  searchAnalytics.track({ type: 'empty_result', query });
};

export const getSearchAnalytics = () => {
  return searchAnalytics.getAnalytics();
};
