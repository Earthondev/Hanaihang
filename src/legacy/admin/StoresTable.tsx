import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { deleteStore } from '@/services/firebase/firestore';

interface StoresTableProps {
  stores: any[];
  malls: any[];
  onRefresh: () => void;
}

const StoresTable: React.FC<StoresTableProps> = ({ stores, malls, onRefresh }) => {
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mallFilter, setMallFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const getMallName = (_mallId: string) => {
    const mall = malls.find(m => m.id === _mallId);
    return mall ? (mall.displayName || mall.name) : 'ไม่พบข้อมูล';
  };


  const handleDelete = async (storeId: string, _mallId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบร้านค้านี้?')) {
      return;
    }

    try {
      setDeletingId(storeId);
      if (!_mallId) {
        alert('❌ ไม่พบข้อมูลห้างสรรพสินค้า');
        return;
      }
      await deleteStore(_mallId, storeId);
      onRefresh();
      alert('✅ ลบร้านค้าสำเร็จ!');
    } catch (error) {
      console.error('❌ Error deleting store:', error);
      alert('❌ เกิดข้อผิดพลาดในการลบร้านค้า');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (store: any) => {
    navigate(`/admin/stores/${store._mallId}/${store.id}/edit`);
  };


  // Filter stores
  const filteredStores = stores.filter(store => {
    const matchesSearch = !searchQuery || 
      store.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMall = !mallFilter || store._mallId === mallFilter;
    const matchesCategory = !categoryFilter || store.category === categoryFilter;
    
    return matchesSearch && matchesMall && matchesCategory;
  });

  const categories = [...new Set(stores.map(store => store.category))].sort();

  if (stores.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีข้อมูลร้านค้า</h3>
        <p className="text-gray-500">เริ่มต้นโดยการเพิ่มร้านค้าใหม่</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ค้นหา</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อร้านค้า..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ห้างสรรพสินค้า</label>
            <select
              value={mallFilter}
              onChange={(e) => setMallFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            >
              <option value="">ทุกห้าง</option>
              {malls.map(mall => (
                <option key={mall.id} value={mall.id}>
                  {mall.displayName || mall.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            >
              <option value="">ทุกหมวดหมู่</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        แสดง {filteredStores.length} ร้านค้าจากทั้งหมด {stores.length} ร้านค้า
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ร้านค้า
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                หมวดหมู่
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ห้างสรรพสินค้า
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ตำแหน่ง
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStores.map((store) => (
              <tr key={store.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {store.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{store.name}</div>
                      <div className="text-sm text-gray-500">
                        {store.phone || 'ไม่มีเบอร์โทร'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {store.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getMallName(store._mallId)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ชั้น {store.floorId} ยูนิต {store.unit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEdit(store)}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                      title="แก้ไข"
                      aria-label={`แก้ไขร้านค้า ${store.name}`}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(store.id, store._mallId)}
                      disabled={deletingId === store.id}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                      title="ลบ"
                      aria-label={`ลบร้านค้า ${store.name}`}
                    >
                      {deletingId === store.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1"></div>
                      ) : (
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                      ลบ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default StoresTable;
