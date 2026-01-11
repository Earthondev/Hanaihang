import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CategoryForm, { CategoryFormValues } from './CategoryForm';
import { createCategory } from '@/services/firebase/categories-unified';
import FadeIn from '@/components/ui/FadeIn';

const CategoryCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleCreate = async (data: CategoryFormValues) => {
        setIsLoading(true);
        try {
            await createCategory(data);
            navigate('/admin/categories');
        } catch (error) {
            console.error('Failed to create category:', error);
            // Alert user or allow form to handle if we propagated error back (we don't currently)
            alert('Failed to create category: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <FadeIn>
            <div className="max-w-3xl mx-auto py-8">
                <CategoryForm
                    isEditMode={false}
                    onSubmit={handleCreate}
                    isLoading={isLoading}
                />
            </div>
        </FadeIn>
    );
};

export default CategoryCreatePage;
