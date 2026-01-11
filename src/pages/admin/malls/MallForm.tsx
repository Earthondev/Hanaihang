import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

import { Mall } from '@/types/mall-system';

export interface MallFormValues {
    displayName: string;
    name: string; // slug-like ID
    description: string;
    status: 'Active' | 'Maintenance' | 'Closed';
    lat: string;
    lng: string;
    address: string;
    openTime: string;
    closeTime: string;
}

interface MallFormProps {
    initialData?: Partial<Mall>;
    isEditMode?: boolean;
    onSubmit: (data: MallFormValues) => Promise<void>;
    isLoading?: boolean;
}

const MallForm: React.FC<MallFormProps> = ({
    initialData,
    isEditMode = false,
    onSubmit,
    isLoading = false,
}) => {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<MallFormValues>({
        displayName: '',
        name: '', // slug-like ID
        description: '', // Optional
        status: 'Active',
        lat: '',
        lng: '',
        address: '',
        openTime: '10:00',
        closeTime: '22:00',
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                displayName: initialData.displayName || '',
                name: initialData.name || '',
                description: '', // If property exists in type, map it
                status: (initialData.status as 'Active' | 'Maintenance' | 'Closed') || 'Active',
                lat: initialData.lat?.toString() || '',
                lng: initialData.lng?.toString() || '',
                address: initialData.address || '',
                openTime: initialData.openTime || '10:00',
                closeTime: initialData.closeTime || '22:00',
            });
        }
    }, [initialData]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!formData.displayName.trim()) return setError('กรุณาระบุชื่อห้างที่แสดงผล (Display Name)');
        if (!formData.name.trim()) return setError('กรุณาระบุชื่อห้างภาษาอังกฤษ (Slug)');

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
                        {isEditMode ? 'แก้ไขข้อมูลห้างสรรพสินค้า' : 'เพิ่มห้างสรรพสินค้าใหม่'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        ระบุชื่อ ที่ตั้ง และเวลาทำการ
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* Basic Info */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            ชื่อห้าง (ภาษาไทย/แสดงผล) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="displayName"
                            value={formData.displayName}
                            onChange={handleChange}
                            placeholder="เช่น เซ็นทรัล พระราม 3"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Slug / ชื่อภาษาอังกฤษ (ไม่ซ้ำ) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name" // Mapped to 'name' in Mall interface
                            value={formData.name}
                            onChange={handleChange}
                            disabled={isEditMode} // Usually easier to not allow changing IDs/Slugs
                            placeholder="central-rama-3"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-gray-100 disabled:text-gray-500"
                            required
                        />
                        {isEditMode && <p className="text-xs text-gray-400 mt-1">* ไม่สามารถแก้ไข slug ได้</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            สถานะ
                        </label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        >
                            <option value="Active">เปิดให้บริการ (Active)</option>
                            <option value="Maintenance">ปิดปรับปรุงชั่วคราว (Maintenance)</option>
                            <option value="Closed">ปิดถาวร (Closed)</option>
                        </select>
                    </div>
                </div>

                {/* Location (Lat/Lng) as requested */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            ละติจูด (Latitude)
                        </label>
                        <input
                            type="text" // numeric input might be tricky with decimals, text is safer for basic CRUD
                            name="lat"
                            value={formData.lat}
                            onChange={handleChange}
                            placeholder="เช่น 13.6942"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            ลองจิจูด (Longitude)
                        </label>
                        <input
                            type="text"
                            name="lng"
                            value={formData.lng}
                            onChange={handleChange}
                            placeholder="เช่น 100.5284"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        ที่อยู่
                    </label>
                    <textarea
                        name="address"
                        rows={3}
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="รายละเอียดที่อยู่..."
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    />
                </div>

                {/* Times */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            เวลาเปิด
                        </label>
                        <input
                            type="time"
                            name="openTime"
                            value={formData.openTime}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            เวลาปิด
                        </label>
                        <input
                            type="time"
                            name="closeTime"
                            value={formData.closeTime}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Buttons */}
                <div className="pt-6 flex items-center justify-end space-x-3 border-t border-gray-100 mt-6">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/malls')}
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
                        <span>{isEditMode ? 'บันทึกการแก้ไข' : 'สร้างห้างใหม่'}</span>
                    </button>
                </div>
            </div>
        </form>
    );
};

export default MallForm;
