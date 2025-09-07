import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

import { StoreCategoryStatus } from '@/types/mall-system';
import { updateStore } from '@/services/firebase/firestore';
import { getMall } from '@/lib/malls';
import { listFloors } from '@/services/firebase/firestore';
import { toast } from '@/ui/feedback/Toast';

interface StoreEditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  store: Store | null;
  onSuccess: () => void;
}

const StoreEditDrawer: React.FC<StoreEditDrawerProps> = ({
  isOpen,
  onClose,
  store,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '' as StoreCategory | '',
    floorId: '',
    unit: '',
    phone: '',
    hours: '',
    status: 'Active' as StoreStatus,
  });
  const [loading, setLoading] = useState(false);
  const [floors, setFloors] = useState<any[]>([]);
  const [mall, setMall] = useState<any>(null);

  // Load store data and related info when drawer opens
  useEffect(() => {
    if (isOpen && store) {
      setFormData({
        name: store.name || '',
        category: store.category || '',
        floorId: store.floorId || '',
        unit: store.unit || '',
        phone: store.phone || '',
        hours: store.hours || '',
        status: store.status || 'Active',
      });

      // Load mall and floors data
      const loadRelatedData = async () => {
        try {
          if (store.mallId) {
            const [mallData, floorsData] = await Promise.all([
              getMall(store.mallId),
              listFloors(store.mallId),
            ]);
            setMall(mallData);
            setFloors(floorsData);
          }
        } catch (error) {
          console.error('Error loading related data:', error);
        }
      };

      loadRelatedData();
    }
  }, [isOpen, store]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!store || !store.mallId) {
      toast.error('ไม่พบข้อมูลร้านค้า');
      return;
    }

    setLoading(true);

    try {
      // Get mall data for denormalization
      const mallData = await getMall(store.mallId);
      const mallCoords = mallData?.location ?? mallData?.coords ?? null;

      // Get floor data for denormalization
      const _selectedFloor = floors.find(f => f.id === formData.floorId);
      const floorLabel =
        selectedFloor?.name ?? selectedFloor?.label ?? formData.floorId;

      // Prepare update data with denormalized fields
      const updateData = {
        ...formData,
        category: formData.category as StoreCategory,
        mallCoords,
        floorLabel,
        updatedAt: new Date(),
      } as any;

      // Update store in Firebase
      await updateStore(store.mallId, store.id, updateData);

      toast.success('อัปเดตร้านค้าสำเร็จ! 🎉');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating store:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปเดตร้านค้า');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !store) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl transform transition-transform">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                แก้ไขร้านค้า
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {store.name} • {mall?.displayName || 'กำลังโหลด...'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Store Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อร้านค้า *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หมวดหมู่ *
                </label>
                <select
                  value={formData.category}
                  onChange={e => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">เลือกหมวดหมู่</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Beauty">Beauty</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Food & Beverage">Food & Beverage</option>
                  <option value="Sports">Sports</option>
                  <option value="Books">Books</option>
                  <option value="Home & Garden">Home & Garden</option>
                  <option value="Health & Pharmacy">Health & Pharmacy</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Services">Services</option>
                </select>
              </div>

              {/* Floor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชั้น *
                </label>
                <select
                  value={formData.floorId}
                  onChange={e => handleInputChange('floorId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">เลือกชั้น</option>
                  {floors.map(floor => (
                    <option key={floor.id} value={floor.id}>
                      {floor.name || floor.label || floor.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ยูนิต
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={e => handleInputChange('unit', e.target.value)}
                  placeholder="เช่น A101, B205"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  placeholder="เช่น 02-123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เวลาเปิด-ปิด
                </label>
                <input
                  type="text"
                  value={formData.hours}
                  onChange={e => handleInputChange('hours', e.target.value)}
                  placeholder="เช่น 10:00-22:00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สถานะ *
                </label>
                <select
                  value={formData.status}
                  onChange={e => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="Active">เปิด</option>
                  <option value="Maintenance">ปิดปรับปรุง</option>
                  <option value="Closed">ปิด</option>
                </select>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>บันทึกการเปลี่ยนแปลง</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreEditDrawer;
