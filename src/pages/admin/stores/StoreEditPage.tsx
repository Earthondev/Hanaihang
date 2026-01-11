import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StoreForm, { StoreFormValues } from './StoreForm';
import { getStore, updateStore } from '@/services/firebase/stores-unified';
import { useInvalidateMalls } from '@/hooks/useMallsQuery';
import FadeIn from '@/components/ui/FadeIn';
import { Store } from '@/types/mall-system';

const StoreEditPage: React.FC = () => {
    const { mallId, storeId } = useParams<{ mallId: string; storeId: string }>();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [initialData, setInitialData] = useState<Store | null>(null);
    const [loadingError, setLoadingError] = useState<string | null>(null);
    const { invalidateAll } = useInvalidateMalls();

    useEffect(() => {
        const fetchData = async () => {
            if (!mallId || !storeId) return;
            try {
                const store = await getStore(mallId, storeId);
                if (!store) {
                    setLoadingError('ไม่พบข้อมูลร้านค้า');
                    return;
                }
                setInitialData(store);
            } catch (error) {
                console.error('Error fetching store:', error);
                setLoadingError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
            }
        };
        fetchData();
    }, [mallId, storeId]);

    const handleUpdate = async (data: StoreFormValues) => {
        if (!mallId || !storeId) return;
        setIsLoading(true);
        try {
            await updateStore(mallId, storeId, data);
            invalidateAll();
            navigate('/admin/stores');
        } catch (error) {
            console.error('Failed to update store:', error);
            // Handling error display can be improved but sticking to alert for now or letting user retry
            alert('Failed to update store: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsLoading(false);
        }
    };

    if (loadingError) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500 font-medium">{loadingError}</p>
                <button
                    onClick={() => navigate('/admin/stores')}
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
                <StoreForm
                    initialData={initialData}
                    isEditMode={true}
                    onSubmit={handleUpdate}
                    isLoading={isLoading}
                />
            </div>
        </FadeIn>
    );
};

export default StoreEditPage;
