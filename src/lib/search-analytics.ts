/**
 * Search Analytics and Metrics Tracking
 * Tracks user behavior and performance metrics for search functionality
 */

interface SearchEvent {
  event: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  data: Record<string, unknown>;
}

interface SearchMetrics {
  query: string;
  latency: number;
  resultsCount: number;
  fromCache: boolean;
  stale: boolean;
  userLocation?: { lat: number; lng: number };
  device: 'mobile' | 'desktop';
  viewport: { width: number; height: number };
}

interface ClickMetrics {
  query: string;
  resultRank: number;
  resultId: string;
  resultKind: 'mall' | 'store';
  distanceKm?: number;
  openNow?: boolean;
  clickLatency: number;
}

interface EmptySearchMetrics {
  query: string;
  queryLength: number;
  suggestionsShown: boolean;
  userLocation?: { lat: number; lng: number };
}

class SearchAnalytics {
  private sessionId: string;
  private events: SearchEvent[] = [];
  private metrics: {
    searchLatencies: number[];
    clickThroughRates: Record<number, number>;
    emptySearchRate: number;
    cacheHitRate: number;
    gpsAllowedRate: number;
  } = {
    searchLatencies: [],
    clickThroughRates: {},
    emptySearchRate: 0,
    cacheHitRate: 0,
    gpsAllowedRate: 0
  };

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeTracking();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeTracking() {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flushEvents();
      }
    });

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.flushEvents();
    });

    // Track GPS permission
    this.trackGPSPermission();
  }

  private async trackGPSPermission() {
    try {
      if ('geolocation' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        this.trackEvent('gps_permission_status', {
          status: permission.state,
          granted: permission.state === 'granted'
        });
        
        permission.addEventListener('change', () => {
          this.trackEvent('gps_permission_changed', {
            status: permission.state,
            granted: permission.state === 'granted'
          });
        });
      }
    } catch (error) {
      console.warn('Could not track GPS permission:', error);
    }
  }

  // Search Performance Tracking
  trackSearchStart(query: string): string {
    const searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.trackEvent('search_start', {
      searchId,
      query,
      queryLength: query.length,
      timestamp: Date.now()
    });

    return searchId;
  }

  trackSearchComplete(
    searchId: string,
    metrics: SearchMetrics
  ) {
    this.trackEvent('search_complete', {
      searchId,
      ...metrics
    });

    // Update internal metrics
    this.metrics.searchLatencies.push(metrics.latency);
    
    if (metrics.fromCache) {
      this.updateCacheHitRate(true);
    }
  }

  trackSearchError(searchId: string, error: string, query: string) {
    this.trackEvent('search_error', {
      searchId,
      error,
      query,
      timestamp: Date.now()
    });
  }

  // Click Tracking
  trackResultClick(metrics: ClickMetrics) {
    this.trackEvent('search_result_click', {
      ...metrics,
      timestamp: Date.now()
    });

    // Update click-through rates
    const rank = metrics.resultRank;
    this.metrics.clickThroughRates[rank] = (this.metrics.clickThroughRates[rank] || 0) + 1;
  }

  // Empty Search Tracking
  trackEmptySearch(metrics: EmptySearchMetrics) {
    this.trackEvent('search_empty', {
      ...metrics,
      timestamp: Date.now()
    });

    this.updateEmptySearchRate();
  }

  // Filter Usage Tracking
  trackFilterUsage(filterType: 'open_now' | 'category' | 'floor', enabled: boolean) {
    this.trackEvent('filter_usage', {
      filterType,
      enabled,
      timestamp: Date.now()
    });
  }

  // Location Usage Tracking
  trackLocationUsage(granted: boolean, accuracy?: number) {
    this.trackEvent('location_usage', {
      granted,
      accuracy,
      timestamp: Date.now()
    });

    if (granted) {
      this.updateGPSAllowedRate(true);
    }
  }

  // Cache Performance Tracking
  trackCachePerformance(hit: boolean, query: string, latency: number) {
    this.trackEvent('cache_performance', {
      hit,
      query,
      latency,
      timestamp: Date.now()
    });

    this.updateCacheHitRate(hit);
  }

  // Generic Event Tracking
  trackEvent(eventName: string, data: Record<string, unknown>) {
    const event: SearchEvent = {
      event: eventName,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      data: {
        ...data,
        url: window.location.href,
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    this.events.push(event);

    // Send to Google Analytics if available
    this.sendToGoogleAnalytics(event);

    // Send to custom analytics endpoint
    this.sendToCustomAnalytics(event);
  }

  private sendToGoogleAnalytics(event: SearchEvent) {
    if (typeof window !== 'undefined' && (window as unknown).gtag) {
      const gtag = (window as unknown).gtag;
      
      switch (event.event) {
        case 'search_complete':
          gtag('event', 'search', {
            search_term: event.data.query,
            custom_parameter: {
              latency_ms: event.data.latency,
              results_count: event.data.resultsCount,
              from_cache: event.data.fromCache,
              device: event.data.device
            }
          });
          break;
          
        case 'search_result_click':
          gtag('event', 'select_content', {
            content_type: event.data.resultKind,
            item_id: event.data.resultId,
            custom_parameter: {
              rank: event.data.resultRank,
              distance_km: event.data.distanceKm,
              open_now: event.data.openNow
            }
          });
          break;
          
        case 'search_empty':
          gtag('event', 'search', {
            search_term: event.data.query,
            custom_parameter: {
              empty_results: true,
              query_length: event.data.queryLength
            }
          });
          break;
      }
    }
  }

  private async sendToCustomAnalytics(event: SearchEvent) {
    try {
      // Send to custom analytics endpoint
      await fetch('/api/analytics/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.warn('Failed to send analytics:', error);
    }
  }

  // Metrics Calculation
  private updateCacheHitRate(hit: boolean) {
    // Simple moving average calculation
    const currentRate = this.metrics.cacheHitRate;
    const newRate = hit ? 1 : 0;
    this.metrics.cacheHitRate = (currentRate * 0.9) + (newRate * 0.1);
  }

  private updateEmptySearchRate() {
    // Calculate empty search rate
    const totalSearches = this.metrics.searchLatencies.length;
    const emptySearches = this.events.filter(e => e.event === 'search_empty').length;
    this.metrics.emptySearchRate = emptySearches / totalSearches;
  }

  private updateGPSAllowedRate(granted: boolean) {
    // Simple moving average calculation
    const currentRate = this.metrics.gpsAllowedRate;
    const newRate = granted ? 1 : 0;
    this.metrics.gpsAllowedRate = (currentRate * 0.9) + (newRate * 0.1);
  }

  // Performance Metrics
  getPerformanceMetrics() {
    const latencies = this.metrics.searchLatencies;
    const sortedLatencies = [...latencies].sort((a, b) => a - b);
    
    return {
      searchLatency: {
        median: sortedLatencies[Math.floor(sortedLatencies.length / 2)] || 0,
        p95: sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] || 0,
        average: latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length || 0,
        min: Math.min(...latencies) || 0,
        max: Math.max(...latencies) || 0
      },
      clickThroughRate: this.metrics.clickThroughRates,
      emptySearchRate: this.metrics.emptySearchRate,
      cacheHitRate: this.metrics.cacheHitRate,
      gpsAllowedRate: this.metrics.gpsAllowedRate,
      totalSearches: latencies.length,
      sessionId: this.sessionId
    };
  }

  // Real-time Dashboard Data
  getDashboardData() {
    const metrics = this.getPerformanceMetrics();
    const recentEvents = this.events.slice(-50); // Last 50 events
    
    return {
      metrics,
      recentEvents,
      sessionDuration: Date.now() - parseInt(this.sessionId.split('_')[1]),
      currentTime: new Date().toISOString()
    };
  }

  // Export data for analysis
  exportData() {
    return {
      sessionId: this.sessionId,
      events: this.events,
      metrics: this.getPerformanceMetrics(),
      exportedAt: new Date().toISOString()
    };
  }

  // Flush events to server
  private async flushEvents() {
    if (this.events.length === 0) return;

    try {
      await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          events: this.events
        })
      });
      
      this.events = []; // Clear events after successful send
    } catch (error) {
      console.warn('Failed to flush analytics events:', error);
    }
  }
}

// Singleton instance
const searchAnalytics = new SearchAnalytics();

// React Hook for Search Analytics
export function useSearchAnalytics() {
  return {
    trackSearchStart: (query: string) => searchAnalytics.trackSearchStart(query),
    trackSearchComplete: (searchId: string, metrics: SearchMetrics) => 
      searchAnalytics.trackSearchComplete(searchId, metrics),
    trackSearchError: (searchId: string, error: string, query: string) => 
      searchAnalytics.trackSearchError(searchId, error, query),
    trackResultClick: (metrics: ClickMetrics) => 
      searchAnalytics.trackResultClick(metrics),
    trackEmptySearch: (metrics: EmptySearchMetrics) => 
      searchAnalytics.trackEmptySearch(metrics),
    trackFilterUsage: (filterType: 'open_now' | 'category' | 'floor', enabled: boolean) => 
      searchAnalytics.trackFilterUsage(filterType, enabled),
    trackLocationUsage: (granted: boolean, accuracy?: number) => 
      searchAnalytics.trackLocationUsage(granted, accuracy),
    trackCachePerformance: (hit: boolean, query: string, latency: number) => 
      searchAnalytics.trackCachePerformance(hit, query, latency),
    getPerformanceMetrics: () => searchAnalytics.getPerformanceMetrics(),
    getDashboardData: () => searchAnalytics.getDashboardData(),
    exportData: () => searchAnalytics.exportData()
  };
}

// Utility functions
export function getDeviceType(): 'mobile' | 'desktop' {
  return window.innerWidth < 768 ? 'mobile' : 'desktop';
}

export function getViewportSize(): { width: number; height: number } {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}

export function measureSearchLatency(startTime: number): number {
  return Date.now() - startTime;
}

export default searchAnalytics;
