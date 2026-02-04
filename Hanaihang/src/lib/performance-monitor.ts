/**
 * Performance Monitoring System
 * Tracks and reports performance metrics for search functionality
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  context: Record<string, unknown>;
}

interface SLAMetrics {
  searchLatency: {
    median: number;
    p95: number;
    p99: number;
    average: number;
  };
  cacheHitRate: number;
  emptySearchRate: number;
  gpsAllowedRate: number;
  clickThroughRate: Record<number, number>;
}

interface PerformanceAlert {
  type: 'warning' | 'error' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private readonly MAX_METRICS = 1000;
  private readonly MAX_ALERTS = 100;

  // SLA Thresholds
  private readonly SLA_THRESHOLDS = {
    SEARCH_LATENCY_MEDIAN: 400, // ms
    SEARCH_LATENCY_P95: 600, // ms
    SEARCH_LATENCY_P99: 1000, // ms
    CACHE_HIT_RATE_MIN: 0.6, // 60%
    EMPTY_SEARCH_RATE_MAX: 0.15, // 15%
    GPS_ALLOWED_RATE_MIN: 0.3, // 30%
    CLICK_THROUGH_RATE_MIN: 0.1 // 10%
  };

  // Record performance metric
  recordMetric(name: string, value: number, context: Record<string, unknown> = {}) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      context: {
        ...context,
        url: window.location.href,
        userAgent: navigator.userAgent,
        device: window.innerWidth < 768 ? 'mobile' : 'desktop',
        connection: this.getConnectionInfo()
      }
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Check for SLA violations
    this.checkSLAViolations(metric);

    // Send to analytics
    this.sendToAnalytics(metric);
  }

  // Record search latency
  recordSearchLatency(latency: number, query: string, fromCache: boolean = false) {
    this.recordMetric('search_latency', latency, {
      query,
      fromCache,
      queryLength: query.length
    });
  }

  // Record cache performance
  recordCachePerformance(hit: boolean, query: string, latency: number) {
    this.recordMetric('cache_performance', latency, {
      hit,
      query,
      cacheHit: hit
    });
  }

  // Record GPS permission
  recordGPSPermission(granted: boolean, accuracy?: number) {
    this.recordMetric('gps_permission', granted ? 1 : 0, {
      granted,
      accuracy
    });
  }

  // Record click-through rate
  recordClickThrough(rank: number, query: string, resultId: string) {
    this.recordMetric('click_through', 1, {
      rank,
      query,
      resultId
    });
  }

  // Record empty search
  recordEmptySearch(query: string, suggestionsShown: boolean) {
    this.recordMetric('empty_search', 1, {
      query,
      queryLength: query.length,
      suggestionsShown
    });
  }

  // Record filter usage
  recordFilterUsage(filterType: string, enabled: boolean, resultCount: number) {
    this.recordMetric('filter_usage', enabled ? 1 : 0, {
      filterType,
      enabled,
      resultCount
    });
  }

  // Check SLA violations
  private checkSLAViolations(metric: PerformanceMetric) {
    const thresholds = this.SLA_THRESHOLDS;
    let alert: PerformanceAlert | null = null;

    switch (metric.name) {
      case 'search_latency':
        if (metric.value > thresholds.SEARCH_LATENCY_P95) {
          alert = {
            type: 'error',
            message: `Search latency exceeded P95 threshold: ${metric.value}ms > ${thresholds.SEARCH_LATENCY_P95}ms`,
            metric: 'search_latency',
            value: metric.value,
            threshold: thresholds.SEARCH_LATENCY_P95,
            timestamp: Date.now()
          };
        } else if (metric.value > thresholds.SEARCH_LATENCY_MEDIAN) {
          alert = {
            type: 'warning',
            message: `Search latency exceeded median threshold: ${metric.value}ms > ${thresholds.SEARCH_LATENCY_MEDIAN}ms`,
            metric: 'search_latency',
            value: metric.value,
            threshold: thresholds.SEARCH_LATENCY_MEDIAN,
            timestamp: Date.now()
          };
        }
        break;

      case 'cache_performance': {
        const hitRate = this.calculateCacheHitRate();
        if (hitRate < thresholds.CACHE_HIT_RATE_MIN) {
          alert = {
            type: 'warning',
            message: `Cache hit rate below threshold: ${(hitRate * 100).toFixed(1)}% < ${(thresholds.CACHE_HIT_RATE_MIN * 100).toFixed(1)}%`,
            metric: 'cache_hit_rate',
            value: hitRate,
            threshold: thresholds.CACHE_HIT_RATE_MIN,
            timestamp: Date.now()
          };
        }
        break;
      }
    }

    if (alert) {
      this.addAlert(alert);
    }
  }

  // Add performance alert
  private addAlert(alert: PerformanceAlert) {
    this.alerts.push(alert);

    // Keep only recent alerts
    if (this.alerts.length > this.MAX_ALERTS) {
      this.alerts = this.alerts.slice(-this.MAX_ALERTS);
    }

    // Send critical alerts immediately
    if (alert.type === 'critical') {
      this.sendCriticalAlert(alert);
    }
  }

  // Calculate SLA metrics
  calculateSLAMetrics(): SLAMetrics {
    const searchLatencies = this.metrics
      .filter(m => m.name === 'search_latency')
      .map(m => m.value);

    const sortedLatencies = [...searchLatencies].sort((a, b) => a - b);
    const median = sortedLatencies[Math.floor(sortedLatencies.length / 2)] || 0;
    const p95 = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] || 0;
    const p99 = sortedLatencies[Math.floor(sortedLatencies.length * 0.99)] || 0;
    const average = searchLatencies.reduce((sum, lat) => sum + lat, 0) / searchLatencies.length || 0;

    const cacheHitRate = this.calculateCacheHitRate();
    const emptySearchRate = this.calculateEmptySearchRate();
    const gpsAllowedRate = this.calculateGPSAllowedRate();
    const clickThroughRate = this.calculateClickThroughRate();

    return {
      searchLatency: { median, p95, p99, average },
      cacheHitRate,
      emptySearchRate,
      gpsAllowedRate,
      clickThroughRate
    };
  }

  // Calculate cache hit rate
  private calculateCacheHitRate(): number {
    const cacheMetrics = this.metrics.filter(m => m.name === 'cache_performance');
    if (cacheMetrics.length === 0) return 0;

    const hits = cacheMetrics.filter(m => m.context.cacheHit).length;
    return hits / cacheMetrics.length;
  }

  // Calculate empty search rate
  private calculateEmptySearchRate(): number {
    const totalSearches = this.metrics.filter(m => m.name === 'search_latency').length;
    const emptySearches = this.metrics.filter(m => m.name === 'empty_search').length;
    
    return totalSearches > 0 ? emptySearches / totalSearches : 0;
  }

  // Calculate GPS allowed rate
  private calculateGPSAllowedRate(): number {
    const gpsMetrics = this.metrics.filter(m => m.name === 'gps_permission');
    if (gpsMetrics.length === 0) return 0;

    const allowed = gpsMetrics.filter(m => m.value === 1).length;
    return allowed / gpsMetrics.length;
  }

  // Calculate click-through rate by rank
  private calculateClickThroughRate(): Record<number, number> {
    const clickMetrics = this.metrics.filter(m => m.name === 'click_through');
    const rankCounts: Record<number, number> = {};
    const rankClicks: Record<number, number> = {};

    // Count total searches by rank (approximate)
    const searchMetrics = this.metrics.filter(m => m.name === 'search_latency');
    searchMetrics.forEach((_, index) => {
      const rank = (index % 10) + 1; // Simulate rank distribution
      rankCounts[rank] = (rankCounts[rank] || 0) + 1;
    });

    // Count clicks by rank
    clickMetrics.forEach(metric => {
      const rank = metric.context.rank;
      rankClicks[rank] = (rankClicks[rank] || 0) + 1;
    });

    // Calculate CTR
    const ctr: Record<number, number> = {};
    Object.keys(rankCounts).forEach(rank => {
      const rankNum = parseInt(rank);
      const clicks = rankClicks[rankNum] || 0;
      const searches = rankCounts[rankNum] || 1;
      ctr[rankNum] = clicks / searches;
    });

    return ctr;
  }

  // Get connection information
  private getConnectionInfo() {
    const connection = (navigator as unknown).connection;
    if (connection) {
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
    return {};
  }

  // Send metric to analytics
  private sendToAnalytics(metric: PerformanceMetric) {
    // Send to Google Analytics
    if (typeof window !== 'undefined' && (window as unknown).gtag) {
      (window as unknown).gtag('event', 'performance_metric', {
        metric_name: metric.name,
        metric_value: metric.value,
        custom_parameter: metric.context
      });
    }

    // Send to custom analytics
    this.sendToCustomAnalytics(metric);
  }

  // Send to custom analytics endpoint
  private async sendToCustomAnalytics(metric: PerformanceMetric) {
    try {
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metric)
      });
    } catch (error) {
      console.warn('Failed to send performance metric:', error);
    }
  }

  // Send critical alert
  private async sendCriticalAlert(alert: PerformanceAlert) {
    try {
      await fetch('/api/alerts/critical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alert)
      });
    } catch (error) {
      console.error('Failed to send critical alert:', error);
    }
  }

  // Get performance report
  getPerformanceReport() {
    const slaMetrics = this.calculateSLAMetrics();
    const recentAlerts = this.alerts.slice(-10);
    const recentMetrics = this.metrics.slice(-50);

    return {
      slaMetrics,
      alerts: recentAlerts,
      recentMetrics,
      reportGeneratedAt: new Date().toISOString(),
      totalMetrics: this.metrics.length,
      totalAlerts: this.alerts.length
    };
  }

  // Check if SLA is being met
  isSLACompliant(): boolean {
    const metrics = this.calculateSLAMetrics();
    const thresholds = this.SLA_THRESHOLDS;

    return (
      metrics.searchLatency.median <= thresholds.SEARCH_LATENCY_MEDIAN &&
      metrics.searchLatency.p95 <= thresholds.SEARCH_LATENCY_P95 &&
      metrics.cacheHitRate >= thresholds.CACHE_HIT_RATE_MIN &&
      metrics.emptySearchRate <= thresholds.EMPTY_SEARCH_RATE_MAX &&
      metrics.gpsAllowedRate >= thresholds.GPS_ALLOWED_RATE_MIN
    );
  }

  // Get SLA compliance percentage
  getSLACompliancePercentage(): number {
    const metrics = this.calculateSLAMetrics();
    const thresholds = this.SLA_THRESHOLDS;
    
    let compliantChecks = 0;
    let totalChecks = 0;

    // Check each SLA metric
    if (metrics.searchLatency.median > 0) {
      totalChecks++;
      if (metrics.searchLatency.median <= thresholds.SEARCH_LATENCY_MEDIAN) compliantChecks++;
    }

    if (metrics.searchLatency.p95 > 0) {
      totalChecks++;
      if (metrics.searchLatency.p95 <= thresholds.SEARCH_LATENCY_P95) compliantChecks++;
    }

    if (metrics.cacheHitRate > 0) {
      totalChecks++;
      if (metrics.cacheHitRate >= thresholds.CACHE_HIT_RATE_MIN) compliantChecks++;
    }

    if (metrics.emptySearchRate > 0) {
      totalChecks++;
      if (metrics.emptySearchRate <= thresholds.EMPTY_SEARCH_RATE_MAX) compliantChecks++;
    }

    if (metrics.gpsAllowedRate > 0) {
      totalChecks++;
      if (metrics.gpsAllowedRate >= thresholds.GPS_ALLOWED_RATE_MIN) compliantChecks++;
    }

    return totalChecks > 0 ? (compliantChecks / totalChecks) * 100 : 100;
  }

  // Clear all metrics
  clearMetrics() {
    this.metrics = [];
    this.alerts = [];
  }

  // Export metrics for analysis
  exportMetrics() {
    return {
      metrics: this.metrics,
      alerts: this.alerts,
      slaMetrics: this.calculateSLAMetrics(),
      exportedAt: new Date().toISOString()
    };
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

// React Hook
export function usePerformanceMonitor() {
  return {
    recordSearchLatency: (latency: number, query: string, fromCache: boolean = false) =>
      performanceMonitor.recordSearchLatency(latency, query, fromCache),
    recordCachePerformance: (hit: boolean, query: string, latency: number) =>
      performanceMonitor.recordCachePerformance(hit, query, latency),
    recordGPSPermission: (granted: boolean, accuracy?: number) =>
      performanceMonitor.recordGPSPermission(granted, accuracy),
    recordClickThrough: (rank: number, query: string, resultId: string) =>
      performanceMonitor.recordClickThrough(rank, query, resultId),
    recordEmptySearch: (query: string, suggestionsShown: boolean) =>
      performanceMonitor.recordEmptySearch(query, suggestionsShown),
    recordFilterUsage: (filterType: string, enabled: boolean, resultCount: number) =>
      performanceMonitor.recordFilterUsage(filterType, enabled, resultCount),
    getPerformanceReport: () => performanceMonitor.getPerformanceReport(),
    isSLACompliant: () => performanceMonitor.isSLACompliant(),
    getSLACompliancePercentage: () => performanceMonitor.getSLACompliancePercentage(),
    exportMetrics: () => performanceMonitor.exportMetrics(),
    clearMetrics: () => performanceMonitor.clearMetrics()
  };
}

export default performanceMonitor;
