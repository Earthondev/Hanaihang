import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MallForm, { MallFormValues } from './MallForm';
import { createMall } from '@/services/firebase/malls-unified';
import { useInvalidateMalls } from '@/hooks/useMallsQuery';
import FadeIn from '@/components/ui/FadeIn';

const MallCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const { invalidateAll } = useInvalidateMalls();

    const handleCreate = async (data: MallFormValues) => {
        setIsLoading(true);
        try {
            // Map form values to API payload
            // Parse lat/lng to numbers
            const payload = {
                ...data,
                lat: data.lat ? parseFloat(data.lat) : undefined,
                lng: data.lng ? parseFloat(data.lng) : undefined,
                // Ensure other fields match expected types
            };

            await createMall(payload);
            invalidateAll();
            navigate('/admin/malls');
        } catch (error) {
            console.error('Failed to create mall:', error);
            alert('Failed to create mall: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <FadeIn>
            <div className="max-w-3xl mx-auto py-8">
                <MallForm
                    isEditMode={false}
                    onSubmit={handleCreate}
                    isLoading={isLoading}
                />
            </div>
        </FadeIn>
    );
};

export default MallCreatePage;
