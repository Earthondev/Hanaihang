import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { deleteStore } from '../../lib/firestore';
import { deduplicateStores, getStoreReactKey, StoreRow, storePathKey } from '../../lib/store-utils';

interface StoresTableProps {
  stores: StoreRow[];
  malls: Array<{ id: string; name?: string; displayName?: string }>;
  onRefresh: () => void;
}

const StoresTable: React.FC<StoresTableProps> = ({ stores, malls, onRefresh }) => {
  const navigate = useNavigate();

  // ใช้ key ที่ unique จริง: malls/{mallId}/stores/{id} (กันชนข้ามห้าง)
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [mallFilter, setMallFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // แมพ mall id -> displayName (เร็วกว่า find ทุกครั้ง)
  const mallMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const mall of malls) {
      m.set(mall.id, mall.displayName || mall.name || 'ไม่พบข้อมูล');
    }
    return m;
  }, [malls]);

  // Deduplicate หนึ่งครั้ง แล้วค่อย filter ต่อ
  const dedupedStores = useMemo(() => deduplicateStores(stores), [stores]);

  const getMallName = useCallback(
    (mallId: string) => mallMap.get(mallId) ?? 'ไม่พบข้อมูล',
    [mallMap]
  );

  const handleDelete = useCallback(async (storeId: string, mallId: string) => {
    const rowKey = storePathKey(mallId, storeId);
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบร้านค้านี้?')) return;

    try {
      if (!mallId) {
        alert('❌ ไม่พบข้อมูลห้างสรรพสินค้า');
        return;
      }
      setDeletingKey(rowKey);
      await deleteStore(mallId, storeId);

      // อัปเดตข้อมูลโดยไม่รีโหลดหน้า
      onRefresh();
      alert('✅ ลบร้านค้าสำเร็จ!');
    } catch (error) {
      console.error('❌ Error deleting store:', error);
      alert('❌ เกิดข้อผิดพลาดในการลบร้านค้า');
    } finally {
      setDeletingKey(null);
    }
  }, [onRefresh]);

  const handleEdit = useCallback((store: StoreRow) => {
    navigate(`/admin/stores/${store.mallId}/${store.id}/edit`);
  }, [navigate]);

  // Filter (memoized)
  const filteredStores = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dedupedStores.filter((store) => {
      const name = (store.name ?? '').toString().toLowerCase();
      const category = (store.category ?? '').toString();

      const matchesSearch = !q || name.includes(q);
      const matchesMall = !mallFilter || store.mallId === mallFilter;
      const matchesCategory = !categoryFilter || category === categoryFilter;

      return matchesSearch && matchesMall && matchesCategory;
    });
  }, [dedupedStores, searchQuery, mallFilter, categoryFilter]);

  // Categories (unique, กรองค่าว่าง/undefined)
  const categories = useMemo(() => {
    return [...new Set(dedupedStores.map(s => s.category).filter(Boolean))].sort();
  }, [dedupedStores]);

  if (dedupedStores.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">ยังไม่มีร้านค้า</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          เริ่มต้นโดยการเพิ่มร้านค้าแรกของคุณ เพื่อให้ลูกค้าสามารถค้นหาและดูข้อมูลร้านค้าได้
        </p>
        <button
          type="button"
          onClick={() => window.location.href = '/admin/stores/create'}
          className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          aria-label="เพิ่มร้านค้าแรก"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          เพิ่มร้านค้าแรก
        </button>
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
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อร้านค้า..."
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                aria-label="ค้นหาร้านค้า"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="ล้างการค้นหา"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ห้างสรรพสินค้า</label>
            <select
              value={mallFilter}
              onChange={(e) => setMallFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              aria-label="ฟิลเตอร์ห้าง"
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
              aria-label="ฟิลเตอร์หมวดหมู่"
            >
              <option value="">ทุกหมวดหมู่</option>
              {categories.map(category => (
                <option key={category as string} value={category as string}>{category as string}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        แสดง {filteredStores.length} ร้านค้าจากทั้งหมด {dedupedStores.length} ร้านค้า
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ร้านค้า</th>
              <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">หมวดหมู่</th>
              <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ห้างสรรพสินค้า</th>
              <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ตำแหน่ง</th>
              <th className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStores.map((store) => {
              const reactKey = getStoreReactKey(store);
              const isDeleting = deletingKey === reactKey;
              const initial = (store.name?.toString()?.charAt(0) || '?').toUpperCase();
              const category = store.category || '—';
              const floorText = store.floorId ? `ชั้น ${store.floorId}` : 'ชั้น -';
              const unitText = store.unit ? `ยูนิต ${store.unit}` : 'ยูนิต -';

              return (
                <tr key={reactKey} className="hover:bg-gray-50">
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">{initial}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{store.name || '—'}</div>
                        <div className="text-sm text-gray-500">{store.phone || 'ไม่มีเบอร์โทร'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {category}
                    </span>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getMallName(store.mallId)}
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-900">
                    {floorText} {unitText}
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(store)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors relative group"
                        title="แก้ไขร้านค้า"
                        aria-label={`แก้ไขร้านค้า ${store.name || ''}`}
                        disabled={isDeleting}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                          แก้ไข
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(store.id, store.mallId)}
                        disabled={isDeleting}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 relative group"
                        title="ลบร้านค้า"
                        aria-label={`ลบร้านค้า ${store.name || ''}`}
                      >
                        {isDeleting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" aria-hidden="true"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                          ลบ
                        </div>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredStores.map((store) => {
          const reactKey = getStoreReactKey(store);
          const isDeleting = deletingKey === reactKey;
          const initial = (store.name?.toString()?.charAt(0) || '?').toUpperCase();
          const category = store.category || '—';
          const floorText = store.floorId ? `ชั้น ${store.floorId}` : 'ชั้น -';
          const unitText = store.unit ? `ยูนิต ${store.unit}` : 'ยูนิต -';

          return (
            <div key={reactKey} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-12 w-12">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <span className="text-lg font-medium text-blue-600">{initial}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">{store.name || '—'}</h3>
                    <p className="text-sm text-gray-500">{store.phone || 'ไม่มีเบอร์โทร'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(store)}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                    title="แก้ไขร้านค้า"
                    aria-label={`แก้ไขร้านค้า ${store.name || ''}`}
                    disabled={isDeleting}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(store.id, store.mallId)}
                    disabled={isDeleting}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                    title="ลบร้านค้า"
                    aria-label={`ลบร้านค้า ${store.name || ''}`}
                  >
                    {isDeleting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600" aria-hidden="true"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">หมวดหมู่:</span>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {category}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">ห้าง:</span>
                  <span className="text-sm text-gray-900">{getMallName(store.mallId)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">ตำแหน่ง:</span>
                  <span className="text-sm text-gray-900">{floorText} {unitText}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default StoresTable;