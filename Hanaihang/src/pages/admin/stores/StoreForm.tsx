import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

import { Store, StoreCategory, StoreStatus, STORE_CATEGORIES, STORE_STATUS, Mall } from '@/types/mall-system';
import { useMallsWithStats } from '@/hooks/useMallsQuery';

export interface StoreFormValues {
    name: string;
    mallId: string;
    floorId: string;
    category: StoreCategory;
    status: StoreStatus;
    phone: string;
    hours: string;
    unit: string;
}

interface StoreFormProps {
    initialData?: Partial<Store>;
    isEditMode?: boolean;
    onSubmit: (data: StoreFormValues) => Promise<void>;
    isLoading?: boolean;
}

const StoreForm: React.FC<StoreFormProps> = ({
    initialData,
    isEditMode = false,
    onSubmit,
    isLoading = false
}) => {
    const navigate = useNavigate();
    const { data: malls = [] } = useMallsWithStats();

    // Form State
    const [formData, setFormData] = useState<StoreFormValues>({
        name: '',
        mallId: '',
        floorId: '',
        category: 'Fashion' as StoreCategory,
        status: 'Active' as StoreStatus,
        phone: '',
        hours: '',
        unit: ''
    });

    const [error, setError] = useState<string | null>(null);

    // Load initial data
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                mallId: initialData.mallId || initialData._mallId || '',
                floorId: initialData.floorId || '',
                category: (initialData.category as StoreCategory) || 'Fashion',
                status: (initialData.status as StoreStatus) || 'Active',
                phone: initialData.phone || '',
                hours: initialData.hours || '',
                unit: initialData.unit || ''
            });
        }
    }, [initialData]);

    // Handle Input Change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Validation & Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Basic Validation
        if (!formData.name.trim()) return setError('กรุณาระบุชื่อร้านค้า');
        if (!formData.mallId) return setError('กรุณาเลือกห้างสรรพสินค้า');
        if (!formData.floorId) return setError('กรุณาระบุชั้น (เช่น G, 1, 2)');
        if (!formData.category) return setError('กรุณาเลือกหมวดหมู่');

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
                        {isEditMode ? 'แก้ไขข้อมูลร้านค้า' : 'เพิ่มร้านค้าใหม่'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        กรอกข้อมูลร้านค้าให้ครบถ้วนเพื่อแสดงผลในระบบ
                    </p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* Mall Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        ห้างสรรพสินค้า <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="mallId"
                        value={formData.mallId}
                        onChange={handleChange}
                        disabled={isEditMode}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-gray-100 disabled:text-gray-500"
                    >
                        <option value="">-- เลือกห้างสรรพสินค้า --</option>
                        {malls.map((mall: Mall) => (
                            <option key={mall.id} value={mall.id}>
                                {mall.displayName}
                            </option>
                        ))}
                    </select>
                    {isEditMode && <p className="text-xs text-gray-400 mt-1">* ไม่สามารถเปลี่ยนห้างได้ หากต้องการย้ายกรุณาลบและสร้างใหม่</p>}
                </div>

                {/* Store Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        ชื่อร้านค้า <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="เช่น Starbucks, Uniqlo"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        required
                    />
                </div>

                {/* Category & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            หมวดหมู่ <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        >
                            {STORE_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            สถานะ <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        >
                            {STORE_STATUS.map(status => (
                                <option key={status} value={status}>
                                    {status === 'Active' ? 'เปิดบริการ (Active)' :
                                        status === 'Maintenance' ? 'ปิดปรับปรุง (Maintenance)' :
                                            'ปิด (Closed)'}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Floor & Unit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            ชั้น <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="floorId"
                            value={formData.floorId}
                            onChange={handleChange}
                            placeholder="เช่น G, 1, 2"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            หมายเลขห้อง / Unit
                        </label>
                        <input
                            type="text"
                            name="unit"
                            value={formData.unit}
                            onChange={handleChange}
                            placeholder="เช่น A-101"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            เบอร์โทรศัพท์
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="02-xxx-xxxx"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            เวลาทำการ
                        </label>
                        <input
                            type="text"
                            name="hours"
                            value={formData.hours}
                            onChange={handleChange}
                            placeholder="เช่น 10:00 - 22:00"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-6 flex items-center justify-end space-x-3 border-t border-gray-100 mt-6">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/stores')}
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
                        <span>{isEditMode ? 'บันทึกการแก้ไข' : 'สร้างร้านค้า'}</span>
                    </button>
                </div>
            </div>
        </form>
    );
};

export default StoreForm;
