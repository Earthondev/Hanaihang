import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { useToast } from '../ui/feedback/Toast';
import { AnimatedSuccessModal } from '../components/ui/feedback/SuccessModal';
import MallForm from '../legacy/forms/MallForm';
import FloorManager from '../components/admin/FloorManager';
import { getMall, listFloors } from '../services/firebase/firestore';
import { useInvalidateMalls } from '../hooks/useMallsQuery';
import { Mall, Floor } from '../types/mall-system';

export default function MallEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { push: toast } = useToast();
  const invalidateAll = useInvalidateMalls();
  const [mall, setMall] = useState<Mall | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  // Removed floor management state - now handled by FloorManager component

  console.log('🔍 MallEditPage mounted with ID:', id);

  useEffect(() => {
    const loadMallData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      
      try {
        console.log('🔄 Loading mall data for ID:', id);
        const [mallData, floorsData] = await Promise.all([
          getMall(id),
          listFloors(id)
        ]);
        
        console.log('✅ Mall data loaded:', mallData);
        console.log('✅ Floors data loaded:', floorsData);
        
        setMall(mallData);
        setFloors(floorsData);
        setError(null);
      } catch (error) {
        console.error('❌ Error loading mall:', error);
        const errorMessage = error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลห้างได้';
        setError(errorMessage);
        toast(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    };

    loadMallData();
  }, [id, toast]);

  const handleSubmit = async (mallName?: string) => {
    console.log('🎉 MallEditPage handleSubmit called!');
    console.log('🔍 mallName received:', mallName);
    
    // Invalidate React Query cache to refresh data
    try {
      invalidateAll.invalidateAll();
      console.log('✅ Cache invalidated successfully');
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
    
    // Reload mall data to get updated information
    try {
      const updatedMall = await getMall(id!);
      setMall(updatedMall);
      console.log('✅ Mall data reloaded:', updatedMall);
    } catch (error) {
      console.error('Error reloading mall data:', error);
    }
    
    console.log('🎉 Setting showSuccessModal to true');
    setShowSuccessModal(true);
  };

  const handleSuccessConfirm = () => {
    navigate('/admin/malls');
  };

  const handleFloorsChange = async (newFloors: Floor[]) => {
    setFloors(newFloors);
    
    // Update mall's floor count
    if (mall) {
      setMall(prev => prev ? { ...prev, floorCount: newFloors.length } : null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูลห้าง...</p>
          <p className="mt-2 text-sm text-gray-500">ID: {id}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">เกิดข้อผิดพลาด</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/admin/malls')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            กลับไปหน้าห้าง
          </button>
        </div>
      </div>
    );
  }

  if (!mall) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">ไม่พบข้อมูลห้าง</h1>
          <p className="text-gray-600 mb-6">ห้างที่คุณกำลังค้นหาอาจถูกลบหรือไม่เคยมีอยู่</p>
          <button
            onClick={() => navigate('/admin/malls')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            กลับไปหน้าห้าง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/malls')}
            className="text-green-600 hover:text-green-700 mb-4 flex items-center space-x-2"
          >
            <span>←</span>
            <span>กลับไปหน้าห้าง</span>
          </button>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  แก้ไขห้างสรรพสินค้า
                </h1>
                <h2 className="text-xl text-green-600 font-semibold mb-4">
                  {mall?.displayName}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-gray-600">ที่อยู่</div>
                    <div className="font-medium text-gray-900">{mall?.address}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-gray-600">จำนวนชั้น</div>
                    <div className="font-medium text-gray-900">{mall?.floorCount || floors.length} ชั้น</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-gray-600">จำนวนร้าน</div>
                    <div className="font-medium text-gray-900">{mall?.storeCount || 0} ร้าน</div>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-500 mb-1">สร้างเมื่อ</div>
                <div className="text-sm font-medium text-gray-900">
                  {mall?.createdAt ? 
                    (mall.createdAt.toDate ? 
                      new Date(mall.createdAt.toDate()).toLocaleDateString('th-TH') : 
                      new Date(mall.createdAt as any).toLocaleDateString('th-TH')
                    ) : 'ไม่ระบุ'}
                </div>
                <div className="text-sm text-gray-500 mt-2 mb-1">อัปเดตล่าสุด</div>
                <div className="text-sm font-medium text-gray-900">
                  {mall?.updatedAt ? 
                    (mall.updatedAt.toDate ? 
                      new Date(mall.updatedAt.toDate()).toLocaleDateString('th-TH') : 
                      new Date(mall.updatedAt as any).toLocaleDateString('th-TH')
                    ) : 'ไม่ระบุ'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Mall Form - Full Width */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              ข้อมูลห้างสรรพสินค้า
            </h2>
            
            <MallForm
              mode="edit"
              mall={mall}
              onSuccess={handleSubmit}
            />
          </div>

          {/* Floors Management - Full Width */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              จัดการชั้นของห้าง
            </h2>
            
            <FloorManager
              mallId={id!}
              floors={floors}
              onFloorsChange={handleFloorsChange}
            />
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatedSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="บันทึกสำเร็จ! 🎉"
        message={`ข้อมูลห้างสรรพสินค้า "${mall?.displayName}" ได้รับการอัปเดตเรียบร้อยแล้ว`}
        onConfirm={handleSuccessConfirm}
        confirmText="กลับไปหน้าห้าง"
      />
    </div>
  );
}
