import React, { useState, useEffect } from 'react';
import { useSafeSubmit } from '../../hooks/useSafeSubmit';
import { BaseButton } from '../ui/BaseButton';

interface StoreFormProps {
  malls: any[];
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const StoreForm: React.FC<StoreFormProps> = ({ malls, onClose, onSubmit }) => {
  const { isLoading, run } = useSafeSubmit({
    formName: 'store_create',
    successMessage: 'เพิ่มร้านค้าสำเร็จ 🎉',
    errorMessage: 'ไม่สามารถเพิ่มร้านค้าได้'
  });

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    mallId: '',
    floorId: '',
    unit: '',
    phone: '',
    hours: '',
    status: 'Active'
  });

  const [floors, setFloors] = useState<any[]>([]);
  const [loadingFloors, setLoadingFloors] = useState(false);

  const categories = [
    'Fashion',
    'Beauty & Cosmetics',
    'Electronics',
    'Food & Beverage',
    'Sports & Outdoor',
    'Books & Stationery',
    'Home & Garden',
    'Health & Wellness',
    'Jewelry & Accessories',
    'Toys & Games',
    'Automotive',
    'Services'
  ];

  const statusOptions = [
    { value: 'Active', label: 'เปิดใช้งาน' },
    { value: 'Maintenance', label: 'ปิดปรับปรุง' },
    { value: 'Closed', label: 'ปิด' }
  ];

  // Load floors when mall is selected
  useEffect(() => {
    if (formData.mallId) {
      loadFloors(formData.mallId);
    } else {
      setFloors([]);
    }
  }, [formData.mallId]);

  const loadFloors = async (mallId: string) => {
    try {
      setLoadingFloors(true);
      // This would call the actual API to get floors for the selected mall
      // For now, we'll create default floors
      const defaultFloors = [
        { id: 'G', label: 'G' },
        { id: '1', label: '1' },
        { id: '2', label: '2' },
        { id: '3', label: '3' },
        { id: '4', label: '4' },
        { id: '5', label: '5' }
      ];
      setFloors(defaultFloors);
    } catch (error) {
      console.error('Error loading floors:', error);
    } finally {
      setLoadingFloors(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    run(async () => {
      const storeData = {
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await onSubmit(storeData);
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">เพิ่มร้านค้าใหม่</h2>
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
              ชื่อร้านค้า *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              placeholder="ชื่อร้านค้า"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              หมวดหมู่ *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              required
            >
              <option value="">เลือกหมวดหมู่</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ห้างสรรพสินค้า *
            </label>
            <select
              value={formData.mallId}
              onChange={(e) => handleChange('mallId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              required
            >
              <option value="">เลือกห้างสรรพสินค้า</option>
              {malls.map(mall => (
                <option key={mall.id} value={mall.id}>{mall.displayName || mall.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชั้น *
              </label>
              <select
                value={formData.floorId}
                onChange={(e) => handleChange('floorId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                required
                disabled={!formData.mallId || loadingFloors}
              >
                <option value="">
                  {loadingFloors ? 'กำลังโหลด...' : 'เลือกชั้น'}
                </option>
                {floors.map(floor => (
                  <option key={floor.id} value={floor.id}>ชั้น {floor.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ยูนิต *
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="เช่น 2-22"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เบอร์โทรศัพท์
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              placeholder="02-123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เวลาเปิด-ปิด
            </label>
            <input
              type="text"
              value={formData.hours}
              onChange={(e) => handleChange('hours', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              placeholder="เช่น 10:00-22:00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สถานะ *
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              required
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
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
              {isLoading ? "กำลังบันทึก..." : "เพิ่มร้านค้า"}
            </BaseButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StoreForm;
