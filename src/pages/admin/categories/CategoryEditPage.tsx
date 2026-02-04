import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import CategoryForm, { CategoryFormValues } from './CategoryForm';

import { getCategory, updateCategory, Category } from '@/services/firebase/categories-unified';
import FadeIn from '@/components/ui/FadeIn';

const CategoryEditPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [initialData, setInitialData] = useState<Category | null>(null);
    const [loadingError, setLoadingError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const category = await getCategory(id);
                if (!category) {
                    setLoadingError('ไม่พบข้อมูลหมวดหมู่');
                    return;
                }
                setInitialData(category);
            } catch (error) {
                console.error('Error fetching category:', error);
                setLoadingError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
            }
        };
        fetchData();
    }, [id]);

    const handleUpdate = async (data: CategoryFormValues) => {
        if (!id) return;
        setIsLoading(true);
        try {
            await updateCategory(id, data);
            navigate('/admin/categories');
        } catch (error) {
            console.error('Failed to update category:', error);
            alert('Failed to update: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsLoading(false);
        }
    };

    if (loadingError) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500 font-medium">{loadingError}</p>
                <button
                    onClick={() => navigate('/admin/categories')}
                    className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                    กลับหน้ารายการ
                </button>
            </div>
        );
    }

    if (!initialData) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <FadeIn>
            <div className="max-w-3xl mx-auto py-8">
                <CategoryForm
                    initialData={initialData}
                    isEditMode={true}
                    onSubmit={handleUpdate}
                    isLoading={isLoading}
                />
            </div>
        </FadeIn>
    );
};

export default CategoryEditPage;
