import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { useToast } from '../ui/feedback/Toast';
import MallForm from '../legacy/forms/MallForm';
import { getMall, updateMall } from '../services/firebase/firestore';
import { Mall } from '../types/mall-system';

export default function MallEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { push: toast } = useToast();
  const [mall, setMall] = useState<Mall | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('🔍 MallEditPage mounted with ID:', id);

  useEffect(() => {
    const loadMall = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      
      try {
        console.log('🔄 Loading mall data for ID:', id);
        const mallData = await getMall(id);
        console.log('✅ Mall data loaded:', mallData);
        setMall(mallData);
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

    loadMall();
  }, [id, toast]);

  const handleSubmit = async () => {
    toast('อัปเดตห้างสรรพสินค้าสำเร็จ ✅', 'success');
    navigate('/admin/malls');
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">แก้ไขห้างสรรพสินค้า</h1>
          <p className="mt-2 text-gray-600">อัปเดตข้อมูลห้าง {mall.displayName}</p>
        </div>

        <MallForm
          mode="edit"
          mall={mall}
          onSuccess={handleSubmit}
        />
      </div>
    </div>
  );
}
