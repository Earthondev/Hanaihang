import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { useRealtimeMall } from '@/hooks/useRealtimeMalls';
import { useRealtimeStores } from '@/hooks/useRealtimeStores';
import { listFloors } from '@/services/firebase/firestore';
import { Floor } from '@/types/mall-system';

const FloorDetail: React.FC = () => {
  const { _mallId: mallId, floorId } = useParams<{
    _mallId: string;
    floorId: string;
  }>();
  const [floor, setFloor] = useState<Floor | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const navigate = useNavigate();

  // ใช้ real-time data สำหรับห้างและร้าน
  const { mall, loading: mallLoading } = useRealtimeMall(mallId || '');
  const { stores, loading: storesLoading } = useRealtimeStores(mall?.id || '');

  // Load floors data
  useEffect(() => {
    const loadFloors = async () => {
      if (!mall?.id || !floorId) return;

      try {
        console.log('🔍 Loading floors for mall:', mall.id);
        const floorsData = await listFloors(mall.id);
        console.log('✅ Floors loaded:', floorsData);
        const currentFloor = floorsData.find(f => f.id === floorId);
        if (currentFloor) {
          setFloor(currentFloor);
        }
      } catch (err) {
        console.error('❌ Error loading floors:', err);
      }
    };

    loadFloors();
  }, [mall?.id, floorId]);

  // Update loading state
  const loading = mallLoading || storesLoading;

  const filteredStores = stores.filter(
    store =>
      store.floorId === floorId &&
      (!categoryFilter || store.category === categoryFilter),
  );

  const categories = Array.from(new Set(stores.map(store => store.category)));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!mall || !floor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">ไม่พบข้อมูล</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/malls/${mall.name}`)}
            className="flex items-center text-green-600 hover:text-green-700 mb-4"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            กลับไปยัง {mall.displayName}
          </button>

          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {mall.displayName} - ชั้น {floor.label}
          </h1>
          {mall.address && (
            <p className="text-gray-700 text-lg">{mall.address}</p>
          )}
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategoryFilter('')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  categoryFilter === ''
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                ทั้งหมด ({stores.length})
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    categoryFilter === category
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {category} (
                  {stores.filter(s => s.category === category).length})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStores.map(store => (
            <div
              key={store.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-bold text-gray-900 flex-1">
                  {store.name}
                </h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    store.status === 'Active'
                      ? 'bg-green-100 text-green-800'
                      : store.status === 'Maintenance'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}
                >
                  {store.status === 'Active'
                    ? 'เปิด'
                    : store.status === 'Maintenance'
                      ? 'ปิดปรับปรุง'
                      : 'ปิด'}
                </span>
              </div>

              <p className="text-base text-gray-700 mb-3">{store.category}</p>

              {store.unit && (
                <p className="text-base text-gray-600 mb-2">📍 {store.unit}</p>
              )}

              {store.hours && (
                <p className="text-base text-green-600 mb-2">
                  🕒 {store.hours}
                </p>
              )}

              {store.phone && (
                <p className="text-base text-blue-600">📞 {store.phone}</p>
              )}
            </div>
          ))}
        </div>

        {filteredStores.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {categoryFilter
                ? `ไม่พบร้านในหมวดหมู่ ${categoryFilter} บนชั้น ${floor.label}`
                : `ไม่พบร้านบนชั้น ${floor.label}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloorDetail;
