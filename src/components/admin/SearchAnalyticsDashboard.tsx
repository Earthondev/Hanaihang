/**
 * Search Analytics Dashboard
 * Real-time monitoring of search performance and user behavior
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Clock,
  Target,
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';

import { useSearchAnalytics } from '@/lib/search-analytics';
import { usePerformanceMonitor } from '@/lib/performance-monitor';
import { useSearchHistory } from '@/hooks/useSearchHistory';

interface DashboardMetrics {
  searchLatency: {
    median: number;
    p95: number;
    average: number;
  };
  cacheHitRate: number;
  emptySearchRate: number;
  gpsAllowedRate: number;
  clickThroughRate: Record<number, number>;
  totalSearches: number;
  slaCompliance: number;
}

export default function SearchAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const analytics = useSearchAnalytics();
  const performance = usePerformanceMonitor();
  const history = useSearchHistory();

  // Update metrics every 30 seconds
  useEffect(() => {
    const updateMetrics = () => {
      const performanceReport = performance.getPerformanceReport();
      const historyStats = history.getStatistics();
      
      setMetrics({
        searchLatency: performanceReport.slaMetrics.searchLatency,
        cacheHitRate: performanceReport.slaMetrics.cacheHitRate,
        emptySearchRate: performanceReport.slaMetrics.emptySearchRate,
        gpsAllowedRate: performanceReport.slaMetrics.gpsAllowedRate,
        clickThroughRate: performanceReport.slaMetrics.clickThroughRate,
        totalSearches: historyStats.totalSearches,
        slaCompliance: performance.getSLACompliancePercentage()
      });
      
      setLastUpdated(new Date());
      setIsLoading(false);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 30000);

    return () => clearInterval(interval);
  }, [analytics, performance, history]);

  const getSLAStatus = (compliance: number) => {
    if (compliance >= 95) return { status: 'excellent', color: 'text-green-600', icon: CheckCircle };
    if (compliance >= 80) return { status: 'good', color: 'text-yellow-600', icon: AlertTriangle };
    return { status: 'poor', color: 'text-red-600', icon: XCircle };
  };

  const formatLatency = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-8">
        <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">ไม่สามารถโหลดข้อมูลได้</p>
      </div>
    );
  }

  const slaStatus = getSLAStatus(metrics.slaCompliance);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 font-kanit">
            📊 Search Analytics Dashboard
          </h2>
          <p className="text-gray-600 font-prompt">
            อัปเดตล่าสุด: {lastUpdated.toLocaleTimeString('th-TH')}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="font-prompt">รีเฟรช</span>
        </button>
      </div>

      {/* SLA Status */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 font-kanit">SLA Compliance</h3>
          <slaStatus.icon className={`w-6 h-6 ${slaStatus.color}`} />
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-3xl font-bold text-gray-900">
            {metrics.slaCompliance.toFixed(1)}%
          </div>
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  metrics.slaCompliance >= 95 ? 'bg-green-500' :
                  metrics.slaCompliance >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${metrics.slaCompliance}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-1 font-prompt">
              {slaStatus.status === 'excellent' && '✅ ดีเยี่ยม - ตรงตามเป้าหมาย'}
              {slaStatus.status === 'good' && '⚠️ ดี - ต้องปรับปรุงเล็กน้อย'}
              {slaStatus.status === 'poor' && '❌ ต้องปรับปรุง - ไม่ตรงตามเป้าหมาย'}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Search Latency */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500 font-prompt">Search Latency</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 font-prompt">Median:</span>
              <span className="font-semibold text-gray-900">
                {formatLatency(metrics.searchLatency.median)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 font-prompt">P95:</span>
              <span className="font-semibold text-gray-900">
                {formatLatency(metrics.searchLatency.p95)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 font-prompt">Average:</span>
              <span className="font-semibold text-gray-900">
                {formatLatency(metrics.searchLatency.average)}
              </span>
            </div>
          </div>
        </div>

        {/* Cache Hit Rate */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-gray-500 font-prompt">Cache Hit Rate</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {formatPercentage(metrics.cacheHitRate)}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${metrics.cacheHitRate * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 font-prompt">
            Target: ≥60%
          </p>
        </div>

        {/* Empty Search Rate */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Target className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-sm text-gray-500 font-prompt">Empty Search Rate</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {formatPercentage(metrics.emptySearchRate)}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${metrics.emptySearchRate * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 font-prompt">
            Target: ≤15%
          </p>
        </div>

        {/* GPS Allowed Rate */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500 font-prompt">GPS Allowed Rate</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {formatPercentage(metrics.gpsAllowedRate)}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${metrics.gpsAllowedRate * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 font-prompt">
            Target: ≥30%
          </p>
        </div>
      </div>

      {/* Click-Through Rate by Rank */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 font-kanit">
          Click-Through Rate by Rank
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(metrics.clickThroughRate)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .slice(0, 10)
            .map(([rank, ctr]) => (
              <div key={rank} className="text-center">
                <div className="text-sm text-gray-600 font-prompt">อันดับ {rank}</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatPercentage(ctr)}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                  <div 
                    className="bg-blue-500 h-1 rounded-full transition-all duration-500"
                    style={{ width: `${ctr * 100}%` }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Search Statistics */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 font-kanit">
          Search Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.totalSearches.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 font-prompt">Total Searches</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {Object.keys(metrics.clickThroughRate).length}
            </div>
            <div className="text-sm text-gray-600 font-prompt">Active Ranks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatLatency(metrics.searchLatency.average)}
            </div>
            <div className="text-sm text-gray-600 font-prompt">Avg Response Time</div>
          </div>
        </div>
      </div>

      {/* Performance Alerts */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 font-kanit">
          Performance Alerts
        </h3>
        <div className="space-y-3">
          {metrics.searchLatency.p95 > 600 && (
            <div className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <div className="font-medium text-red-900">Search Latency High</div>
                <div className="text-sm text-red-700">
                  P95 latency ({formatLatency(metrics.searchLatency.p95)}) exceeds 600ms threshold
                </div>
              </div>
            </div>
          )}
          
          {metrics.cacheHitRate < 0.6 && (
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="font-medium text-yellow-900">Cache Hit Rate Low</div>
                <div className="text-sm text-yellow-700">
                  Cache hit rate ({formatPercentage(metrics.cacheHitRate)}) below 60% target
                </div>
              </div>
            </div>
          )}
          
          {metrics.emptySearchRate > 0.15 && (
            <div className="flex items-center space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <div className="font-medium text-orange-900">Empty Search Rate High</div>
                <div className="text-sm text-orange-700">
                  Empty search rate ({formatPercentage(metrics.emptySearchRate)}) exceeds 15% threshold
                </div>
              </div>
            </div>
          )}
          
          {metrics.slaCompliance >= 95 && (
            <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-green-900">All Systems Optimal</div>
                <div className="text-sm text-green-700">
                  All performance metrics are within acceptable ranges
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
