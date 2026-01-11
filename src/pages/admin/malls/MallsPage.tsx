import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';

import { useMallsWithStats, useInvalidateMalls } from '@/hooks/useMallsQuery';
import { deleteMall } from '@/services/firebase/malls-unified';
import { PremiumTable } from '@/components/ui/PremiumTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination, PaginationInfo } from '@/components/ui/pagination/Pagination';
import { usePagination } from '@/hooks/usePagination';
import FadeIn from '@/components/ui/FadeIn';

const MallsPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [deletingKey, setDeletingKey] = useState<string | null>(null);

    // Data
    const mallsQuery = useMallsWithStats();
    const { invalidateAll } = useInvalidateMalls();

    const malls = mallsQuery.data || [];

    // Filter
    const filteredMalls = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return malls.filter(mall => {
            if (!mall.id) return false;
            const name = (mall.displayName || mall.name || '').toLowerCase();
            return !q || name.includes(q);
        });
    }, [malls, searchQuery]);

    // Pagination
    const { currentItems, currentPage, totalPages, totalItems, goToPage } = usePagination({
        data: filteredMalls,
        itemsPerPage: 10,
        initialPage: 1
    });

    // Actions
    const handleDelete = async (mallId: string) => {
        if (!confirm('คุณแน่ใจหรือไม่ที่จะลบห้างนี้? การกระทำนี้ไม่สามารถย้อนกลับได้')) return;

        try {
            setDeletingKey(mallId);
            await deleteMall(mallId);
            invalidateAll();
        } catch (error) {
            console.error('Delete failed:', error);
            alert('เกิดข้อผิดพลาดในการลบห้างสรรพสินค้า');
        } finally {
            setDeletingKey(null);
        }
    };

    if (mallsQuery.isLoading) {
        return (
            <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">กำลังโหลดข้อมูลห้างสรรพสินค้า...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-kanit">จัดการห้างสรรพสินค้า</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        ห้างสรรพสินค้าทั้งหมด {malls.length} แห่ง
                    </p>
                </div>
                <button
                    onClick={() => navigate('/admin/malls/create')}
                    className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-all shadow-sm shadow-primary-200 hover:shadow-md"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    เพิ่มห้างใหม่
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อห้าง..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary-100 transition-all text-gray-900"
                    />
                </div>
            </div>

            {/* Table */}
            <FadeIn>
                {filteredMalls.length === 0 ? (
                    <EmptyState
                        type="no-data"
                        title="ไม่พบห้างสรรพสินค้า"
                        description={malls.length === 0 ? "ยังไม่มีข้อมูลห้างในระบบ" : "ไม่พบข้อมูลที่ตรงกับการค้นหา"}
                        action={malls.length === 0 ? {
                            label: 'เพิ่มห้างแรก',
                            onClick: () => navigate('/admin/malls/create'),
                            variant: 'primary'
                        } : undefined}
                    />
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <PremiumTable
                            rows={currentItems.map(mall => ({
                                key: mall.id!,
                                name: mall.displayName || mall.name,
                                meta: mall.address || 'ไม่ระบุที่อยู่',
                                badge: mall.status === 'Active' ? 'เปิดบริการ' : 'ปิดชั่วคราว',
                                mall: `${mall.storeCount || 0} ร้านค้า`,
                                position: mall.lat ? `${mall.lat}, ${mall.lng}` : '-',
                            }))}
                            onEdit={(key) => navigate(`/admin/malls/${key}/edit`)}
                            onDelete={(key) => handleDelete(key)}
                            deletingKey={deletingKey}
                        />
                        {/* Pagination Footer */}
                        <div className="border-t border-gray-100 p-4 flex flex-col items-center">
                            <PaginationInfo
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={totalItems}
                                itemsPerPage={10}
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
        </div>
    );
};

export default MallsPage;
