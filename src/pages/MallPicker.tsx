import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { listMalls } from '@/services/firebase/firestore';
import { Mall } from '@/types/mall-system';

const MallPicker: React.FC = () => {
  const [malls, setMalls] = useState<Mall[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadMalls();
  }, []);

  const loadMalls = async () => {
    try {
      setLoading(true);
      const mallsData = await listMalls();
      setMalls(mallsData);
    } catch (error) {
      console.error('Error loading malls:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMalls = malls.filter(mall =>
    mall.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mall.district?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMallSelect = (mall: Mall) => {
    navigate(`/malls/${mall.name}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดรายการห้าง...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">เลือกห้าง</h1>
          <p className="text-gray-600">ค้นหาและเลือกห้างที่ต้องการ</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหาห้างหรือเขต..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Malls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMalls.map((mall) => (
            <div
              key={mall.id}
              onClick={() => handleMallSelect(mall)}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {mall.displayName}
              </h3>
              {mall.district && (
                <p className="text-gray-600 mb-2">{mall.district}</p>
              )}
              {mall.address && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                  {mall.address}
                </p>
              )}
              {mall.hours && (
                <p className="text-sm text-green-600">
                  🕒 {mall.hours.open} - {mall.hours.close}
                </p>
              )}
            </div>
          ))}
        </div>

        {filteredMalls.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">ไม่พบห้างที่ตรงกับคำค้นหา</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MallPicker;
