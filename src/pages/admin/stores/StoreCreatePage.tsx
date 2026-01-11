import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StoreForm, { StoreFormValues } from './StoreForm';
import { createStore } from '@/services/firebase/stores-unified';
import { useInvalidateMalls } from '@/hooks/useMallsQuery';
import FadeIn from '@/components/ui/FadeIn';
import { Store } from '@/types/mall-system';

const StoreCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const { invalidateAll } = useInvalidateMalls();

    const handleCreate = async (data: StoreFormValues) => {
        setIsLoading(true);
        try {
            // Need to map StoreFormValues to Partial<Store> to satisfy createStore type
            // or just cast if we are confident.
            const payload: Omit<Store, 'id' | 'createdAt' | 'updatedAt'> = {
                ...data,
                // Ensure optional fields are handled if needed, or defaults
            };

            await createStore(data.mallId, payload);

            // Clear cache if needed (optional optimization)
            invalidateAll();

            // Navigate back to list
            navigate('/admin/stores');
        } catch (error) {
            console.error('Failed to create store:', error);
            // Re-throw or handle UI error? 
            // StoreForm doesn't have internal error state exposed unless we pass it back or use context.
            // But here we just log and throw, assuming global error boundary or we can let the user try again.
            // Ideally we'd set an error state here and pass it to form, but let's stick to simple flow.
            alert('Failed to create store: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <FadeIn>
            <div className="max-w-3xl mx-auto py-8">
                <StoreForm
                    isEditMode={false}
                    onSubmit={handleCreate}
                    isLoading={isLoading}
                />
            </div>
        </FadeIn>
    );
};

export default StoreCreatePage;
