import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

import { Category } from '@/services/firebase/categories-unified';

export interface CategoryFormValues {
    name: string;
    slug: string;
    description: string;
}

interface CategoryFormProps {
    initialData?: Partial<Category>;
    isEditMode?: boolean;
    onSubmit: (data: CategoryFormValues) => Promise<void>;
    isLoading?: boolean;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
    initialData,
    isEditMode = false,
    onSubmit,
    isLoading = false,
}) => {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<CategoryFormValues>({
        name: '',
        slug: '',
        description: '',
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                slug: initialData.slug || initialData.id || '',
                description: initialData.description || '',
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNameBlur = () => {
        // Auto-generate slug if empty and in create mode
        if (!isEditMode && !formData.slug && formData.name) {
            const slug = formData.name
                .toLowerCase()
                .replace(/ /g, '-')
                .replace(/[^\w-]+/g, '');
            setFormData(prev => ({ ...prev, slug }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!formData.name.trim()) return setError('กรุณาระบุชื่อหมวดหมู่');
        if (!formData.slug.trim()) return setError('กรุณาระบุ Slug (รหัสอ้างอิง)');

        try {
            await onSubmit(formData);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 font-prompt max-w-2xl mx-auto">
            <div className="space-y-6">
                {/* Header */}
                <div className="border-b border-gray-100 pb-4 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 font-kanit">
                        {isEditMode ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        จัดการประเภทสินค้าและบริการสำหรับร้านค้า
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* Fields */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            ชื่อหมวดหมู่ (Display Name) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            onBlur={handleNameBlur}
                            placeholder="เช่น ร้านอาหาร, แฟชั่น"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Slug / Key (Unique) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="slug"
                            value={formData.slug}
                            onChange={handleChange}
                            disabled={isEditMode}
                            placeholder="fashion, food-beverage"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-gray-100 disabled:text-gray-500"
                            required
                        />
                        {isEditMode ? (
                            <p className="text-xs text-gray-400 mt-1">* ไม่สามารถแก้ไข slug ได้ หากต้องการเปลี่ยนต้องสร้างใหม่</p>
                        ) : (
                            <p className="text-xs text-gray-400 mt-1">* ใช้ภาษาอังกฤษพิมพ์เล็ก ห้ามเว้นวรรค (ใช้ - แทน)</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            รายละเอียด (Optional)
                        </label>
                        <textarea
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="คำอธิบายเพิ่มเติม..."
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Buttons */}
                <div className="pt-6 flex items-center justify-end space-x-3 border-t border-gray-100 mt-6">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/categories')}
                        disabled={isLoading}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center"
                    >
                        {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>}
                        <span>{isEditMode ? 'บันทึกการแก้ไข' : 'สร้างหมวดหมู่'}</span>
                    </button>
                </div>
            </div>
        </form>
    );
};

export default CategoryForm;
