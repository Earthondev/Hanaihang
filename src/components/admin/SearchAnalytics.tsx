import React, { useState, useEffect } from 'react';
import { getSearchAnalytics } from '../../lib/analytics';

interface AnalyticsData {
  totalSearches: number;
  totalClicks: number;
  clickThroughRate: number;
  medianLatency: number;
  emptyResultRate: number;
  topQueries: Array<{ query: string; count: number }>;
  topResultTypes: Array<{ type: string; count: number }>;
}

const SearchAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = () => {
      try {
        const data = getSearchAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6 text-center text-gray-500">
        ไม่มีข้อมูลการวิเคราะห์
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">การวิเคราะห์การค้นหา</h2>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">การค้นหาทั้งหมด</h3>
          <p className="text-2xl font-bold text-gray-900">{analytics.totalSearches}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">การคลิกผลลัพธ์</h3>
          <p className="text-2xl font-bold text-gray-900">{analytics.totalClicks}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">อัตราการคลิก</h3>
          <p className="text-2xl font-bold text-gray-900">{analytics.clickThroughRate.toFixed(1)}%</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">เวลาตอบสนองเฉลี่ย</h3>
          <p className="text-2xl font-bold text-gray-900">{analytics.medianLatency.toFixed(0)}ms</p>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">อัตราผลลัพธ์ว่าง</h3>
          <p className="text-2xl font-bold text-gray-900">{analytics.emptyResultRate.toFixed(1)}%</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">ประเภทผลลัพธ์ยอดนิยม</h3>
          <div className="mt-2 space-y-1">
            {analytics.topResultTypes.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="capitalize">{item.type === 'mall' ? 'ห้างสรรพสินค้า' : 'ร้านค้า'}</span>
                <span className="font-medium">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Queries */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">คำค้นหายอดนิยม</h3>
        <div className="space-y-2">
          {analytics.topQueries.length > 0 ? (
            analytics.topQueries.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium">{item.query}</span>
                <span className="text-sm text-gray-500">{item.count} ครั้ง</span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">ไม่มีข้อมูลคำค้นหา</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchAnalytics;
