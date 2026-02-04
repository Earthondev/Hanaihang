import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Search, Clock, MapPin } from 'lucide-react';

interface SearchAnalyticsProps {
  searchQuery: string;
  resultsCount: number;
  searchTime: number;
  filters?: unknown;
}

interface AnalyticsData {
  totalSearches: number;
  popularQueries: Array<{ query: string; count: number }>;
  searchTrends: Array<{ date: string; searches: number }>;
  categoryBreakdown: Array<{ category: string; count: number; percentage: number }>;
  mallBreakdown: Array<{ mall: string; count: number; percentage: number }>;
}

const SearchAnalytics: React.FC<SearchAnalyticsProps> = ({
  searchQuery,
  resultsCount,
  searchTime,
  filters
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Simulate analytics data
    const mockAnalytics: AnalyticsData = {
      totalSearches: 15420,
      popularQueries: [
        { query: 'H&M', count: 1250 },
        { query: 'Starbucks', count: 980 },
        { query: 'McDonald\'s', count: 750 },
        { query: 'Uniqlo', count: 650 },
        { query: 'Central World', count: 580 }
      ],
      searchTrends: [
        { date: '2024-01-01', searches: 120 },
        { date: '2024-01-02', searches: 135 },
        { date: '2024-01-03', searches: 110 },
        { date: '2024-01-04', searches: 145 },
        { date: '2024-01-05', searches: 160 },
        { date: '2024-01-06', searches: 180 },
        { date: '2024-01-07', searches: 200 }
      ],
      categoryBreakdown: [
        { category: 'Fashion', count: 45, percentage: 35 },
        { category: 'Food & Beverage', count: 32, percentage: 25 },
        { category: 'Electronics', count: 20, percentage: 15 },
        { category: 'Beauty & Health', count: 18, percentage: 14 },
        { category: 'Other', count: 13, percentage: 11 }
      ],
      mallBreakdown: [
        { mall: 'Central World', count: 28, percentage: 22 },
        { mall: 'Siam Paragon', count: 25, percentage: 19 },
        { mall: 'EmQuartier', count: 22, percentage: 17 },
        { mall: 'Terminal 21', count: 20, percentage: 15 },
        { mall: 'Other', count: 33, percentage: 27 }
      ]
    };

    setAnalytics(mockAnalytics);
  }, []);

  const trackSearch = () => {
    // Track search analytics
    if (typeof window !== 'undefined' && (window as unknown).gtag) {
      (window as unknown).gtag('event', 'search', {
        event_category: 'search_analytics',
        event_label: searchQuery,
        custom_parameter: {
          query: searchQuery,
          results_count: resultsCount,
          search_time: searchTime,
          filters: filters
        }
      });
    }
  };

  useEffect(() => {
    if (searchQuery) {
      trackSearch();
    }
  }, [searchQuery, resultsCount, searchTime]);

  if (!analytics) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">สถิติการค้นหา</h3>
        </div>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {isVisible ? 'ซ่อน' : 'แสดง'}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {analytics.totalSearches.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">การค้นหาทั้งหมด</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {resultsCount}
          </div>
          <div className="text-sm text-gray-500">ผลลัพธ์ที่พบ</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {searchTime}ms
          </div>
          <div className="text-sm text-gray-500">เวลาค้นหา</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {analytics.popularQueries.length}
          </div>
          <div className="text-sm text-gray-500">คำค้นหายอดนิยม</div>
        </div>
      </div>

      {isVisible && (
        <div className="space-y-6">
          {/* Popular Queries */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <h4 className="font-medium text-gray-900">คำค้นหายอดนิยม</h4>
            </div>
            <div className="space-y-2">
              {analytics.popularQueries.map((item, index) => (
                <div key={item.query} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-600">
                      #{index + 1}
                    </span>
                    <span className="text-sm text-gray-900">{item.query}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {item.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Search className="w-4 h-4 text-blue-500" />
              <h4 className="font-medium text-gray-900">การค้นหาตามหมวดหมู่</h4>
            </div>
            <div className="space-y-2">
              {analytics.categoryBreakdown.map((item) => (
                <div key={item.category} className="flex items-center justify-between">
                  <span className="text-sm text-gray-900">{item.category}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-12 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mall Breakdown */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <MapPin className="w-4 h-4 text-green-500" />
              <h4 className="font-medium text-gray-900">การค้นหาตามห้างสรรพสินค้า</h4>
            </div>
            <div className="space-y-2">
              {analytics.mallBreakdown.map((item) => (
                <div key={item.mall} className="flex items-center justify-between">
                  <span className="text-sm text-gray-900">{item.mall}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-12 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search Trends */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="w-4 h-4 text-purple-500" />
              <h4 className="font-medium text-gray-900">แนวโน้มการค้นหา (7 วันล่าสุด)</h4>
            </div>
            <div className="space-y-2">
              {analytics.searchTrends.map((item) => (
                <div key={item.date} className="flex items-center justify-between">
                  <span className="text-sm text-gray-900">
                    {new Date(item.date).toLocaleDateString('th-TH')}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ 
                          width: `${(item.searches / Math.max(...analytics.searchTrends.map(t => t.searches))) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-12 text-right">
                      {item.searches}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAnalytics;
