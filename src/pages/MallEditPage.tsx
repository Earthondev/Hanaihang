import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';

import { useToast } from '../ui/feedback/Toast';
import MallForm from '../legacy/forms/MallForm';
import { getMall, listFloors, createFloor, deleteFloor, updateFloorOrder } from '../services/firebase/firestore';
import { Mall } from '../types/mall-system';

export default function MallEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { push: toast } = useToast();
  const [mall, setMall] = useState<Mall | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newFloorLabel, setNewFloorLabel] = useState('');
  const [isAddingFloor, setIsAddingFloor] = useState(false);
  const [insertAfterOrder, setInsertAfterOrder] = useState<number | null>(null);

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

  const handleSubmit = async () => {
    toast('อัปเดตห้างสรรพสินค้าสำเร็จ ✅', 'success');
    navigate('/admin/malls');
  };

  const handleAddFloor = async () => {
    if (!newFloorLabel.trim() || !id || isAddingFloor) return;
    
    // ตรวจสอบว่าชั้นซ้ำหรือไม่
    const existingFloor = floors.find(f => f.label.toLowerCase() === newFloorLabel.trim().toLowerCase());
    if (existingFloor) {
      toast('ชั้นนี้มีอยู่แล้ว', 'error');
      return;
    }
    
    setIsAddingFloor(true);
    
    try {
      let newOrder: number;
      
      if (insertAfterOrder !== null) {
        // แทรกชั้นหลังจาก order ที่เลือก
        newOrder = insertAfterOrder + 0.5;
        
        // อัปเดต order ของชั้นที่อยู่หลัง
        const floorsToUpdate = floors.filter(f => f.order > insertAfterOrder);
        for (const floor of floorsToUpdate) {
          await updateFloorOrder(id, floor.id!, floor.order + 1);
        }
      } else {
        // เพิ่มชั้นใหม่ที่ท้ายสุด
        newOrder = Math.max(...floors.map(f => f.order || 0), -1) + 1;
      }
      
      await createFloor(id, { label: newFloorLabel.trim(), order: newOrder });
      
      // Reload floors
      const updatedFloors = await listFloors(id);
      setFloors(updatedFloors);
      setNewFloorLabel('');
      setInsertAfterOrder(null);
      toast('เพิ่มชั้นสำเร็จ ✅', 'success');
    } catch (error) {
      console.error('Error adding floor:', error);
      toast('ไม่สามารถเพิ่มชั้นได้', 'error');
    } finally {
      setIsAddingFloor(false);
    }
  };

  const handleDeleteFloor = async (floorId: string) => {
    if (!id || !confirm('คุณแน่ใจหรือไม่ที่จะลบชั้นนี้?')) return;
    
    try {
      await deleteFloor(id, floorId);
      
      // Reload floors
      const updatedFloors = await listFloors(id);
      setFloors(updatedFloors);
      toast('ลบชั้นสำเร็จ ✅', 'success');
    } catch (error) {
      console.error('Error deleting floor:', error);
      toast('ไม่สามารถลบชั้นได้', 'error');
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
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/malls')}
            className="text-green-600 hover:text-green-700 mb-4"
          >
            ← กลับไปหน้าห้าง
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            แก้ไขห้างสรรพสินค้า: {mall?.displayName}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mall Form */}
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

          {/* Floors Management */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              จัดการชั้นของห้าง
            </h2>
            
            {/* Add New Floor */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-3">เพิ่มชั้นใหม่</h3>
              
              {/* Floor Label Input */}
              <div className="mb-3">
                <label className="block text-xs text-gray-600 mb-1">ชื่อชั้น</label>
                <input
                  type="text"
                  value={newFloorLabel}
                  onChange={(e) => setNewFloorLabel(e.target.value)}
                  placeholder="เช่น B1, 4, 5, 6, M"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Insert Position */}
              <div className="mb-3">
                <label className="block text-xs text-gray-600 mb-1">แทรกหลังจากชั้น</label>
                <select
                  value={insertAfterOrder !== null ? insertAfterOrder.toString() : ''}
                  onChange={(e) => setInsertAfterOrder(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">เพิ่มที่ท้ายสุด</option>
                  {floors
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((floor) => (
                      <option key={floor.id} value={floor.order}>
                        หลังจากชั้น {floor.label} (order: {floor.order})
                      </option>
                    ))}
                </select>
              </div>

              {/* Add Button */}
              <button
                onClick={handleAddFloor}
                disabled={!newFloorLabel.trim() || isAddingFloor}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAddingFloor ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    กำลังเพิ่ม...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    เพิ่มชั้น
                  </>
                )}
              </button>
            </div>

            {/* Floors List */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                ชั้นที่มีอยู่ ({floors.length} ชั้น)
              </h3>
              
              {floors.length === 0 ? (
                <p className="text-gray-500 text-sm">ยังไม่มีชั้นในห้างนี้</p>
              ) : (
                <div className="space-y-2">
                  {floors
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((floor, index) => (
                      <div
                        key={floor.id}
                        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-green-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-medium">
                            {floor.order || 0}
                          </span>
                          <div>
                            <span className="font-medium text-gray-900">
                              ชั้น {floor.label}
                            </span>
                            <div className="text-xs text-gray-500">
                              ลำดับที่ {index + 1} • Order: {floor.order || 0}
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleDeleteFloor(floor.id!)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                          title="ลบชั้น"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
