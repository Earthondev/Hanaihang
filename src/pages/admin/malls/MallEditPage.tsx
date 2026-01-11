import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MallForm, { MallFormValues } from './MallForm';
import { getMall, updateMall } from '@/services/firebase/malls-unified';
import { useInvalidateMalls } from '@/hooks/useMallsQuery';
import FadeIn from '@/components/ui/FadeIn';
import { Mall } from '@/types/mall-system';

const MallEditPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [initialData, setInitialData] = useState<Mall | null>(null);
    const [loadingError, setLoadingError] = useState<string | null>(null);
    const { invalidateAll } = useInvalidateMalls();

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const mall = await getMall(id);
                if (!mall) {
                    setLoadingError('ไม่พบข้อมูลห้างสรรพสินค้า');
                    return;
                }
                setInitialData(mall);
            } catch (error) {
                console.error('Error fetching mall:', error);
                setLoadingError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
            }
        };
        fetchData();
    }, [id]);

    const handleUpdate = async (data: MallFormValues) => {
        if (!id) return;
        setIsLoading(true);
        try {
            const payload = {
                ...data,
                lat: data.lat ? parseFloat(data.lat) : undefined,
                lng: data.lng ? parseFloat(data.lng) : undefined,
            };

            await updateMall(id, payload);
            invalidateAll();
            navigate('/admin/malls');
        } catch (error) {
            console.error('Failed to update mall:', error);
            alert('Failed to update mall: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsLoading(false);
        }
    };

    if (loadingError) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500 font-medium">{loadingError}</p>
                <button
                    onClick={() => navigate('/admin/malls')}
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
                <MallForm
                    initialData={initialData}
                    isEditMode={true}
                    onSubmit={handleUpdate}
                    isLoading={isLoading}
                />
            </div>
        </FadeIn>
    );
};

export default MallEditPage;
