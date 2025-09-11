/**
 * ตัวอย่างการใช้งาน Store Utils ใน React Table
 * แสดงวิธีการแก้ duplicate key warnings และจัดการ pagination
 */

import React, { useState, useMemo, useCallback } from 'react';
import { 
  deduplicateStores, 
  mergeUniqueStores, 
  getStoreReactKey, 
  withStorePaths,
  StoreRow 
} from '../lib/store-utils';

// ตัวอย่าง 1: Basic Table (แก้ duplicate key warnings)
interface BasicStoresTableProps {
  stores: StoreRow[];
  malls: any[];
  onRefresh: () => void;
}

export function BasicStoresTable({ stores, malls, onRefresh }: BasicStoresTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [mallFilter, setMallFilter] = useState('');

  // ใช้ deduplicateStores เพื่อป้องกัน duplicate keys
  const data = useMemo(() => deduplicateStores(stores), [stores]);

  // Filter stores
  const filteredStores = useMemo(() => {
    return data.filter(store => {
      const matchesSearch = !searchQuery || 
        store.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMall = !mallFilter || store.mallId === mallFilter;
      return matchesSearch && matchesMall;
    });
  }, [data, searchQuery, mallFilter]);

  const getMallName = (mallId: string) => {
    const mall = malls.find(m => m.id === mallId);
    return mall ? (mall.displayName || mall.name) : 'ไม่พบข้อมูล';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        แสดง {filteredStores.length} ร้านค้าจากทั้งหมด {data.length} ร้านค้า
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
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStores.map((store) => (
              <tr key={getStoreReactKey(store)} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{store.name}</div>
                  <div className="text-sm text-gray-500">
                    {store.phone || 'ไม่มีเบอร์โทร'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {store.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getMallName(store.mallId)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ชั้น {store.floorId} ยูนิต {store.unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ตัวอย่าง 2: Pagination Table
interface PaginatedStoresTableProps {
  initialStores: StoreRow[];
  loadMore: (page: number) => Promise<StoreRow[]>;
}

export function PaginatedStoresTable({ initialStores, loadMore }: PaginatedStoresTableProps) {
  const [stores, setStores] = useState<StoreRow[]>(initialStores);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  // ใช้ mergeUniqueStores สำหรับ pagination
  const handleLoadMore = useCallback(async () => {
    setLoading(true);
    try {
      const newStores = await loadMore(page + 1);
      setStores(prev => mergeUniqueStores(prev, newStores));
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading more stores:', error);
    } finally {
      setLoading(false);
    }
  }, [page, loadMore]);

  // ใช้ withStorePaths เพื่อเติม _path ล่วงหน้า
  const data = useMemo(() => withStorePaths(stores), [stores]);

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500">
        แสดง {data.length} ร้านค้า
      </div>

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
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((store) => (
              <tr key={getStoreReactKey(store)} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{store.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {store.category}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleLoadMore}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'กำลังโหลด...' : 'โหลดเพิ่มเติม'}
        </button>
      </div>
    </div>
  );
}

// ตัวอย่าง 3: Infinite Scroll Table
interface InfiniteScrollStoresTableProps {
  initialStores: StoreRow[];
  loadMore: (offset: number) => Promise<StoreRow[]>;
}

export function InfiniteScrollStoresTable({ initialStores, loadMore }: InfiniteScrollStoresTableProps) {
  const [stores, setStores] = useState<StoreRow[]>(initialStores);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const handleLoadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const newStores = await loadMore(stores.length);
      if (newStores.length === 0) {
        setHasMore(false);
      } else {
        setStores(prev => mergeUniqueStores(prev, newStores));
      }
    } catch (error) {
      console.error('Error loading more stores:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, stores.length, loadMore]);

  const data = useMemo(() => withStorePaths(stores), [stores]);

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500">
        แสดง {data.length} ร้านค้า
      </div>

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
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((store) => (
              <tr key={getStoreReactKey(store)} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{store.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {store.category}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'กำลังโหลด...' : 'โหลดเพิ่มเติม'}
          </button>
        </div>
      )}
    </div>
  );
}
