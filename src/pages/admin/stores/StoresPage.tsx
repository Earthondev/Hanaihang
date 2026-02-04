import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';

import { useAllStores, useMallsWithStats, useInvalidateMalls } from '@/hooks/useMallsQuery';
import { deleteStore } from '@/services/firebase/stores-unified';
import { getStoreReactKey } from '@/lib/store-utils';
import { PremiumTable } from '@/components/ui/PremiumTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination, PaginationInfo } from '@/components/ui/pagination/Pagination';
import { usePagination } from '@/hooks/usePagination';
import FadeIn from '@/components/ui/FadeIn';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const StoresPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [mallFilter, setMallFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    // Delete state
    const [deleteId, setDeleteId] = useState<{ id: string, mallId: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Data
    const storesQuery = useAllStores();
    const mallsQuery = useMallsWithStats();
    const { invalidateAll } = useInvalidateMalls();

    // Transform data to ensure mallId is present
    const stores = useMemo(() =>
        storesQuery.data?.map(item => ({
            ...item.store,
            mallId: item._mallId, // Ensure mallId exists for utils
        })) || [],
        [storesQuery.data]);

    const malls = mallsQuery.data || [];

    // Filter Logic
    const filteredStores = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return stores.filter(store => {
            if (!store.id) return false;
            const name = (store.name || '').toLowerCase();
            const category = (store.category || '');

            const matchesSearch = !q || name.includes(q);
            const matchesMall = !mallFilter || store.mallId === mallFilter;
            const matchesCategory = !categoryFilter || category === categoryFilter;

            return matchesSearch && matchesMall && matchesCategory;
        });
    }, [stores, searchQuery, mallFilter, categoryFilter]);

    // Derived Data
    const categories = useMemo(() =>
        [...new Set(stores.map(s => s.category).filter(Boolean))].sort(),
        [stores]);

    const getMallName = (mallId: string) => {
        const mall = malls.find(m => m.id === mallId);
        return mall?.displayName || mall?.name || 'Unknown Mall';
    };

    // Pagination
    const {
        currentItems,
        currentPage,
        totalPages,
        totalItems,
        goToPage
    } = usePagination({
        data: filteredStores,
        itemsPerPage: 20,
        initialPage: 1
    });

    // Actions
    const handleDeleteClick = (storeId: string, mallId: string) => {
        setDeleteId({ id: storeId, mallId });
    };

    const handleConfirmDelete = async () => {
        if (!deleteId) return;

        try {
            setIsDeleting(true);
            await deleteStore(deleteId.mallId, deleteId.id);

            // Clear cache if possible
            try {
                const { clearStoresCache } = await import('@/lib/optimized-firestore');
                clearStoresCache(deleteId.mallId);
            } catch (err) { console.warn('Cache clear failed', err); }

            invalidateAll();
        } catch (error) {
            console.error('Delete failed:', error);
            alert('เกิดข้อผิดพลาดในการลบร้านค้า');
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    if (storesQuery.isLoading || mallsQuery.isLoading) {
        return (
            <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">กำลังโหลดข้อมูลร้านค้า...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-kanit">จัดการร้านค้า</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        ร้านค้าทั้งหมด {stores.length} แห่ง จาก {malls.length} ห้างสรรพสินค้า
                    </p>
                </div>
                <button
                    onClick={() => navigate('/admin/stores/create')}
                    className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-all shadow-sm shadow-primary-200 hover:shadow-md"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    เพิ่มร้านค้า
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อร้าน..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary-100 transition-all text-gray-900"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                        value={mallFilter}
                        onChange={(e) => setMallFilter(e.target.value)}
                        className="py-2 pl-3 pr-8 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary-100 text-gray-700 min-w-[140px]"
                    >
                        <option value="">ทุกห้าง</option>
                        {malls.map(m => (
                            <option key={m.id} value={m.id}>{m.displayName}</option>
                        ))}
                    </select>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="py-2 pl-3 pr-8 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary-100 text-gray-700 min-w-[140px]"
                    >
                        <option value="">ทุกหมวดหมู่</option>
                        {categories.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <FadeIn>
                {filteredStores.length === 0 ? (
                    <EmptyState
                        type="no-stores"
                        title="ไม่พบร้านค้า"
                        description={stores.length === 0 ? "ยังไม่มีข้อมูลร้านค้าในระบบ" : "ไม่พบข้อมูลที่ตรงกับการค้นหา"}
                        action={stores.length === 0 ? {
                            label: 'เพิ่มร้านค้าแรก',
                            onClick: () => navigate('/admin/stores/create'),
                            variant: 'primary'
                        } : undefined}
                    />
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <PremiumTable
                            rows={currentItems.map(store => ({
                                key: getStoreReactKey(store), // Now safe because store has mallId and id
                                name: store.name || '—',
                                meta: store.category || 'ไม่ระบุหมวดหมู่',
                                badge: store.status === 'Active' ? 'เปิด' : 'ปิด',
                                mall: getMallName(store.mallId),
                                position: `ชั้น ${store.floorId} ${store.unit ? `• ${store.unit}` : ''}`,
                            }))}
                            onEdit={(key) => {
                                // We rely on finding the store by key (path) or just reconstructing.
                                // Key is malls/{mallId}/stores/{storeId}
                                const parts = key.split('/');
                                // parts = ['malls', mallId, 'stores', storeId]
                                if (parts.length === 4) {
                                    navigate(`/admin/stores/${parts[1]}/${parts[3]}/edit`);
                                }
                            }}
                            onDelete={(key) => {
                                const parts = key.split('/');
                                if (parts.length === 4) {
                                    handleDeleteClick(parts[3], parts[1]);
                                }
                            }}
                        />

                        {/* Pagination Footer */}
                        <div className="border-t border-gray-100 p-4 flex flex-col items-center">
                            <PaginationInfo
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={totalItems}
                                itemsPerPage={20}
                            />
                            <div className="mt-4">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={goToPage}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </FadeIn>

            <ConfirmDialog
                isOpen={!!deleteId}
                title="ยืนยันการลบร้านค้า"
                description="คุณแน่ใจหรือไม่ที่จะลบร้านค้านี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
                confirmLabel="ลบร้านค้า"
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteId(null)}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default StoresPage;
