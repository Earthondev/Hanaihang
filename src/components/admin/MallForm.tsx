import React, { useState } from 'react';

import { useSafeSubmit } from '../../hooks/useSafeSubmit';
import { BaseButton } from '../ui/BaseButton';

interface MallFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const MallForm: React.FC<MallFormProps> = ({ onClose, onSubmit }) => {
  const { isLoading, run } = useSafeSubmit({
    formName: 'mall_create',
    successMessage: 'สร้างห้างสรรพสินค้าสำเร็จ 🎉',
    errorMessage: 'ไม่สามารถสร้างห้างสรรพสินค้าได้'
  });

  const [formData, setFormData] = useState({
    displayName: '',
    address: '',
    district: '',
    coords: { lat: 0, lng: 0 },
    hours: { open: '10:00', close: '22:00' },
    contact: { phone: '', website: '' }
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    run(async () => {
      // Generate name (slug) from displayName
      const name = formData.displayName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      const mallData = {
        ...formData,
        name,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await onSubmit(mallData);
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">เพิ่มห้างสรรพสินค้าใหม่</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6" aria-busy={isLoading}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ชื่อห้างสรรพสินค้า *
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              placeholder="เช่น Central Embassy, MBK Center, Terminal 21"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              ชื่อที่ใช้แสดงผล (ระบบจะสร้าง slug อัตโนมัติ)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ที่อยู่ *
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              placeholder="ที่อยู่เต็ม"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เขต/อำเภอ *
            </label>
            <input
              type="text"
              value={formData.district}
              onChange={(e) => handleChange('district', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              placeholder="เช่น บางนา"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เวลาเปิด *
              </label>
              <input
                type="time"
                value={formData.hours.open}
                onChange={(e) => handleChange('hours', { ...formData.hours, open: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เวลาปิด *
              </label>
              <input
                type="time"
                value={formData.hours.close}
                onChange={(e) => handleChange('hours', { ...formData.hours, close: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เบอร์โทรศัพท์
              </label>
              <input
                type="tel"
                value={formData.contact.phone}
                onChange={(e) => handleChange('contact', { ...formData.contact, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="02-123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เว็บไซต์
              </label>
              <input
                type="url"
                value={formData.contact.website}
                onChange={(e) => handleChange('contact', { ...formData.contact, website: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <BaseButton
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              ยกเลิก
            </BaseButton>
            <BaseButton
              type="submit"
              variant="primary"
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? "กำลังบันทึก..." : "เพิ่มห้าง"}
            </BaseButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MallForm;
