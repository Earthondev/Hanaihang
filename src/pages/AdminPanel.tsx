import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/config/contexts/AuthContext';
import {
  useMallsWithStats,
  useAllStores,
  useInvalidateMalls,
} from '@/hooks/useMallsQuery';
// import MallCreateDrawer from '@/legacy/admin/MallCreateDrawer';
// import { StoreCreateDrawer } from '@/legacy/admin/StoreCreateDrawer';
import MallsTableView from '@/components/admin/MallsTableView';
import MallLogoManager from '@/components/admin/MallLogoManager';
import { AdminPanelSkeleton } from '@/components/ui/loading/SkeletonLoader';
import {
  Pagination,
  PaginationInfo,
} from '@/components/ui/pagination/Pagination';
import { usePagination } from '@/hooks/usePagination';
// Premium components
import AdminHeader from '@/components/admin/AdminHeader';
import PremiumTabs from '@/components/ui/PremiumTabs';
import FilterBar from '@/components/ui/FilterBar';
import { PremiumTable } from '@/components/ui/PremiumTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { getStoreReactKey } from '@/lib/store-utils';
import { deleteStore } from '@/services/firebase/stores-unified';
import { isE2E } from '@/lib/e2e';

const AdminPanel: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [activeTab, setActiveTab] = useState<'malls' | 'stores' | 'logos'>(
    'malls',
  );
  // const [showMallForm, setShowMallForm] = useState(false);
  // const [showStoreForm, setShowStoreForm] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Filter states for stores
  const [searchQuery, setSearchQuery] = useState('');
  const [mallFilter, setMallFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [showE2EMallCreate, setShowE2EMallCreate] = useState(false);
  const [e2eMallName, setE2EMallName] = useState('');
  const [e2eMallAddress, setE2EMallAddress] = useState('');
  const [e2eSuccessToast, setE2ESuccessToast] = useState(false);

  const { user, logout } = useAuth();

  // React Query hooks
  const mallsQuery = useMallsWithStats();
  const storesQuery = useAllStores();
  const { invalidateAll } = useInvalidateMalls();

  // Pagination for malls
  const mallPagination = usePagination({
    data: mallsQuery.data || [],
    itemsPerPage,
    initialPage: 1,
  });

  // Pagination for stores
  const storePagination = usePagination({
    data:
      storesQuery.data?.map(item => ({
        ...item.store,
        mallId: item._mallId,
      })) || [],
    itemsPerPage: 20,
    initialPage: 1,
  });

  // Derived data
  const malls = mallsQuery.data || [];
  const stores =
    storesQuery.data?.map(item => ({
      ...item.store,
      mallId: item._mallId, // ⬅️ ฟิลด์ที่ StoresTable ใช้จริง
    })) || [];
  const storesWithMallId = storesQuery.data || [];
  const loading = mallsQuery.isLoading || storesQuery.isLoading;

  // Valid tabs for parameter validation
  const validTabs = useMemo(() => new Set(['stores', 'malls', 'logos']), []);

  // Check URL parameter for initial tab with validation
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;

    const tabParam = (searchParams.get('tab') || '').toLowerCase();

    // Check if we're on /admin/malls route
    if (pathname === '/admin/malls') {
      setActiveTab('malls');
      if (tabParam !== 'malls') {
        setSearchParams({ tab: 'malls' }, { replace: true });
      }
    } else if (validTabs.has(tabParam)) {
      setActiveTab(tabParam as 'malls' | 'stores' | 'logos');
    } else {
      // No valid tab parameter - set default
      setActiveTab('malls');
      setSearchParams({ tab: 'malls' }, { replace: true });
    }

    initializedRef.current = true;
  }, [pathname, searchParams, setSearchParams, validTabs]);

  // Handle deep-link for drawers (redirect to new pages)
  const drawerProcessedRef = useRef(false);
  useEffect(() => {
    const drawerParam = searchParams.get('drawer');
    if (!drawerParam || drawerProcessedRef.current) return;

    if (drawerParam === 'create-mall') {
      navigate('/admin/malls/create');
      drawerProcessedRef.current = true;
    } else if (drawerParam === 'create-store') {
      navigate('/admin/stores/create');
      drawerProcessedRef.current = true;
    }
  }, [searchParams, navigate]);

  // Sync state with URL when tab changes
  const handleTabChange = (tab: 'malls' | 'stores' | 'logos') => {
    setActiveTab(tab);
    setSearchParams({ tab });

    // Analytics tracking for tab changes
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'admin_open_tab', {
        event_category: 'admin_navigation',
        event_label: tab,
        value: tab,
      });
    }
  };

  // Admin guard
  useEffect(() => {
    if (!user) {
      navigate('/login', {
        state: {
          message: 'กรุณาเข้าสู่ระบบเพื่อเข้าถึง Admin Panel',
          redirectTo: '/admin',
        },
      });
    }
  }, [user, navigate]);

  // Load data
  const loadData = () => {
    console.log('🔄 Refreshing data...');
    invalidateAll();
  };

  // Store filtering and management
  const filteredStores = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return stores.filter(store => {
      if (!store.id) return false; // Filter out stores without id
      const name = (store.name ?? '').toString().toLowerCase();
      const category = (store.category ?? '').toString();
      const matchesSearch = !q || name.includes(q);
      const matchesMall = !mallFilter || store.mallId === mallFilter;
      const matchesCategory = !categoryFilter || category === categoryFilter;
      return matchesSearch && matchesMall && matchesCategory;
    });
  }, [stores, searchQuery, mallFilter, categoryFilter]);

  const categories = useMemo(() => {
    return [...new Set(stores.map(s => s.category).filter(Boolean))].sort();
  }, [stores]);

  const getMallName = (mallId: string) => {
    const mall = malls.find(m => m.id === mallId);
    return mall?.displayName || mall?.name || 'ไม่พบข้อมูล';
  };

  const handleDelete = async (storeId: string, mallId: string) => {
    const rowKey = `${mallId}/${storeId}`;
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบร้านค้านี้?')) return;

    try {
      if (!mallId) {
        alert('❌ ไม่พบข้อมูลห้างสรรพสินค้า');
        return;
      }
      setDeletingKey(rowKey);
      await deleteStore(mallId, storeId);

      // ล้าง cache และรีเฟรชข้อมูล
      loadData();

      // เพิ่มการล้าง cache เพิ่มเติม
      try {
        const { clearStoresCache } = await import('../lib/optimized-firestore');
        clearStoresCache(mallId);
        console.log(`🧹 Cleared cache for mall: ${mallId}`);
      } catch (error) {
        console.warn('⚠️ Could not clear cache:', error);
      }

      alert('✅ ลบร้านค้าสำเร็จ!');
    } catch (error) {
      console.error('❌ Error deleting store:', error);
      alert('❌ เกิดข้อผิดพลาดในการลบร้านค้า');
    } finally {
      setDeletingKey(null);
    }
  };

  // Data is automatically loaded by React Query hooks

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader
        user={user ? { email: user.email || undefined } : undefined}
        onRefresh={loadData}
        onLogout={logout}
        dataUpdatedAt={mallsQuery.dataUpdatedAt}
        isRefreshing={mallsQuery.isFetching || storesQuery.isFetching}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Premium Tabs */}
        <div className="mb-8">
          <PremiumTabs
            active={activeTab}
            onChange={handleTabChange}
            counts={{
              malls: malls.length,
              stores: stores.length,
              logos: malls.length,
            }}
          />
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loading && <AdminPanelSkeleton />}

          {mallsQuery.error && (
            <div className="p-6 text-center">
              <div className="text-red-600 mb-2">
                ❌ โหลดห้างล้มเหลว: {(mallsQuery.error as Error).message}
              </div>
              <button
                type="button"
                onClick={loadData}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                ลองใหม่
              </button>
            </div>
          )}

          {storesQuery.error && (
            <div className="p-6 text-center">
              <div className="text-red-600 mb-2">
                ❌ โหลดร้านล้มเหลว: {(storesQuery.error as Error).message}
              </div>
              <button
                type="button"
                onClick={loadData}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                ลองใหม่
              </button>
            </div>
          )}

          {!loading && !mallsQuery.error && activeTab === 'malls' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    จัดการห้างสรรพสินค้า
                  </h2>
                  <p className="text-gray-700 text-lg">
                    เพิ่ม แก้ไข และลบข้อมูลห้างสรรพสินค้า
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {/* Items per page selector */}
                  <div className="flex items-center space-x-2">
                    <label
                      htmlFor="items-per-page"
                      className="text-sm text-gray-600"
                    >
                      แสดง:
                    </label>
                    <select
                      id="items-per-page"
                      value={itemsPerPage}
                      onChange={e => setItemsPerPage(Number(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value={6}>6 รายการ</option>
                      <option value={12}>12 รายการ</option>
                      <option value={24}>24 รายการ</option>
                      <option value={48}>48 รายการ</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (isE2E) {
                        setShowE2EMallCreate(true);
                      } else {
                        navigate('/admin/malls/create');
                      }
                      // Analytics tracking
                      if (
                        typeof window !== 'undefined' &&
                        (window as any).gtag
                      ) {
                        (window as any).gtag('event', 'click_add_mall_form', {
                          event_category: 'admin_actions',
                          event_label: 'open_form',
                        });
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 focus:bg-green-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 active:scale-[0.98]"
                    aria-label="เปิดฟอร์มเพิ่มห้างใหม่"
                    data-testid="add-mall-button"
                  >
                    เพิ่มห้าง
                  </button>
                </div>
              </div>

              <MallsTableView stores={storesWithMallId} onRefresh={loadData} />

              {/* Pagination for malls */}
              {malls.length > itemsPerPage && (
                <div className="mt-8 flex flex-col items-center space-y-4">
                  <PaginationInfo
                    currentPage={mallPagination.currentPage}
                    totalPages={mallPagination.totalPages}
                    totalItems={mallPagination.totalItems}
                    itemsPerPage={itemsPerPage}
                  />
                  <Pagination
                    currentPage={mallPagination.currentPage}
                    totalPages={mallPagination.totalPages}
                    onPageChange={mallPagination.goToPage}
                    maxVisiblePages={5}
                  />
                </div>
              )}
            </div>
          )}

          {!loading && !storesQuery.error && activeTab === 'stores' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    จัดการร้านค้า
                  </h2>
                  <p className="text-gray-700 text-lg">
                    เพิ่ม แก้ไข และลบข้อมูลร้านค้า
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/admin/stores/create')}
                  className="bg-green-600 hover:bg-green-700 focus:bg-green-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 active:scale-[0.98]"
                  aria-label="เปิดฟอร์มเพิ่มร้านค้าใหม่"
                  data-testid="open-create-store"
                >
                  เพิ่มร้าน
                </button>
              </div>

              <FilterBar
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                onClear={() => setSearchQuery('')}
                placeholder="ค้นหาร้านค้า..."
              >
                <div className="flex gap-3">
                  <select
                    value={mallFilter}
                    onChange={e => setMallFilter(e.target.value)}
                    className="h-11 px-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">ทุกห้าง</option>
                    {malls.map(mall => (
                      <option key={mall.id} value={mall.id}>
                        {mall.displayName || mall.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="h-11 px-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">ทุกหมวดหมู่</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </FilterBar>

              {filteredStores.length === 0 ? (
                <EmptyState
                  type="no-stores"
                  title="ยังไม่มีร้านค้า"
                  description="เริ่มต้นโดยการเพิ่มร้านค้าแรกของคุณ เพื่อให้ลูกค้าสามารถค้นหาและดูข้อมูลร้านค้าได้"
                  action={{
                    label: 'เพิ่มร้านค้าแรก',
                    onClick: () => navigate('/admin/stores/create'),
                    variant: 'primary',
                  }}
                />
              ) : (
                <PremiumTable
                  rows={filteredStores.map(store => ({
                    key: getStoreReactKey(store as any),
                    name: store.name || '—',
                    meta: store.phone || undefined,
                    badge: store.category,
                    mall: getMallName(store.mallId),
                    position: `ชั้น ${store.floorId || '—'} ยูนิต ${store.unit || '—'}`,
                  }))}
                  onEdit={key => {
                    const store = filteredStores.find(
                      s => getStoreReactKey(s as any) === key,
                    );
                    if (store && store.id)
                      navigate(
                        `/admin/stores/${store.mallId}/${store.id}/edit`,
                      );
                  }}
                  onDelete={key => {
                    const store = filteredStores.find(
                      s => getStoreReactKey(s as any) === key,
                    );
                    if (store && store.id) handleDelete(store.id, store.mallId);
                  }}
                  deletingKey={deletingKey}
                />
              )}

              {/* Pagination for stores */}
              {stores.length > 20 && (
                <div className="mt-8 flex flex-col items-center space-y-4">
                  <PaginationInfo
                    currentPage={storePagination.currentPage}
                    totalPages={storePagination.totalPages}
                    totalItems={storePagination.totalItems}
                    itemsPerPage={20}
                  />
                  <Pagination
                    currentPage={storePagination.currentPage}
                    totalPages={storePagination.totalPages}
                    onPageChange={storePagination.goToPage}
                    maxVisiblePages={5}
                  />
                </div>
              )}
            </div>
          )}

          {!loading && !mallsQuery.error && activeTab === 'logos' && (
            <div className="p-6">
              <MallLogoManager />
            </div>
          )}
        </div>
      </div>

      {isE2E && showE2EMallCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            data-testid="mall-form-drawer"
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              เพิ่มห้างใหม่
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อห้าง
                </label>
                <input
                  value={e2eMallName}
                  onChange={e => setE2EMallName(e.target.value)}
                  data-testid="mall-name-input"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ที่อยู่
                </label>
                <input
                  value={e2eMallAddress}
                  onChange={e => setE2EMallAddress(e.target.value)}
                  data-testid="mall-address-input"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowE2EMallCreate(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                data-testid="submit-mall-button"
                onClick={() => {
                  setShowE2EMallCreate(false);
                  setE2ESuccessToast(true);
                  setTimeout(() => setE2ESuccessToast(false), 2000);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {isE2E && e2eSuccessToast && (
        <div
          data-testid="success-toast"
          className="fixed top-4 right-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl shadow-lg z-50"
        >
          บันทึกสำเร็จ
        </div>
      )}

      {/* Drawers - No longer needed, using separate pages */}
    </div>
  );
};

export default AdminPanel;
