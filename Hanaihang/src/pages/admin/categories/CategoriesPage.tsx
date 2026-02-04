import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';

import { listAllCategories, deleteCategory, isCategoryUsed, Category } from '@/services/firebase/categories-unified';
import { PremiumTable } from '@/components/ui/PremiumTable';
import { EmptyState } from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/ui/feedback/Toast';
import FadeIn from '@/components/ui/FadeIn';

const CategoriesPage: React.FC = () => {
    const navigate = useNavigate();
    const { push: toast } = useToast();

    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Dialog State
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const data = await listAllCategories();
            setCategories(data);
        } catch (error) {
            console.error('Failed to load categories', error);
            toast('ไม่สามารถโหลดข้อมูลหมวดหมู่ได้', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredCategories = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return categories.filter(c => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
    }, [categories, searchQuery]);

    // Handler passed to table
    const onDeleteClick = (slug: string) => {
        setDeleteId(slug);
    };

    // Actual Delete Logic
    const handleConfirmDelete = async () => {
        if (!deleteId) return;

        // Check usage
        if (await isCategoryUsed(deleteId)) {
            toast('ไม่สามารถลบหมวดหมู่นี้ได้เนื่องจากมีร้านค้าใช้ร้านค้าอยู่', 'error');
            setDeleteId(null);
            return;
        }

        try {
            setIsDeleting(true);
            await deleteCategory(deleteId);
            toast('ลบหมวดหมู่เรียบร้อยแล้ว', 'success');
            await loadData(); // Refresh list
        } catch (error) {
            console.error('Delete failed:', error);
            toast('เกิดข้อผิดพลาดในการลบหมวดหมู่', 'error');
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    if (isLoading && categories.length === 0) {
        return (
            <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">กำลังโหลดข้อมูลหมวดหมู่...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-kanit">จัดการหมวดหมู่</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        หมวดหมู่สินค้าและบริการทั้งหมด {categories.length} รายการ
                    </p>
                </div>
                <button
                    onClick={() => navigate('/admin/categories/create')}
                    className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-all shadow-sm shadow-primary-200 hover:shadow-md"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    เพิ่มหมวดหมู่
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="ค้นหาหมวดหมู่..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary-100 transition-all text-gray-900"
                    />
                </div>
            </div>

            {/* Table */}
            <FadeIn>
                {filteredCategories.length === 0 ? (
                    <EmptyState
                        type="no-data"
                        title="ไม่พบหมวดหมู่"
                        description={categories.length === 0 ? "ยังไม่มีหมวดหมู่ในระบบ" : "ไม่พบข้อมูลที่ตรงกับการค้นหา"}
                        action={categories.length === 0 ? {
                            label: 'เพิ่มหมวดหมู่แรก',
                            onClick: () => navigate('/admin/categories/create'),
                            variant: 'primary'
                        } : undefined}
                    />
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <PremiumTable
                            rows={filteredCategories.map(cat => ({
                                key: cat.id!,
                                name: cat.name,
                                meta: `Slug: ${cat.slug}`,
                                date: cat.createdAt?.toDate ? cat.createdAt.toDate().toLocaleDateString('th-TH') : '-'
                            }))}
                            onEdit={(key) => navigate(`/admin/categories/${key}/edit`)}
                            onDelete={onDeleteClick}
                        />
                    </div>
                )}
            </FadeIn>

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={!!deleteId}
                title="ยืนยันการลบหมวดหมู่"
                description={`คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่ "${categories.find(c => c.id === deleteId)?.name}"? การกระทำนี้ไม่สามารถเรียกคืนได้`}
                confirmLabel="ลบหมวดหมู่"
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteId(null)}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default CategoriesPage;
