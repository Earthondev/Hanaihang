import React from 'react';

import { useAuth } from '@/config/contexts/AuthContext';
import { debugAuth } from '@/legacy/utils/debugAuth';

const AuthTest: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  const handleTestLogin = () => {
    debugAuth.testMockLogin();
    window.location.reload();
  };

  const handleClearAuth = () => {
    debugAuth.clearAuthData();
    window.location.reload();
  };

  const handleCheckStorage = () => {
    debugAuth.checkLocalStorage();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">ทดสอบการยืนยันตัวตน</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">สถานะการยืนยันตัวตน</h2>
          <div className="space-y-2">
            <p><strong>กำลังโหลด:</strong> {isLoading ? 'ใช่' : 'ไม่'}</p>
            <p><strong>ยืนยันตัวตนแล้ว:</strong> {isAuthenticated ? 'ใช่' : 'ไม่'}</p>
            <p><strong>ผู้ใช้:</strong> {user ? JSON.stringify(user, null, 2) : 'ไม่มี'}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">การดำเนินการทดสอบ</h2>
          <div className="space-x-4">
            <button
              onClick={handleTestLogin}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              ทดสอบการเข้าสู่ระบบจำลอง
            </button>
            <button
              onClick={handleClearAuth}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              ล้างข้อมูลการยืนยันตัวตน
            </button>
            <button
              onClick={handleCheckStorage}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              ตรวจสอบ LocalStorage
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">คำสั่ง Console</h2>
          <p className="text-gray-600 mb-2">เปิด browser console และรัน:</p>
          <div className="bg-gray-100 p-4 rounded font-mono text-sm">
            <p>debugAuth.checkLocalStorage()</p>
            <p>debugAuth.testMockLogin()</p>
            <p>debugAuth.clearAuthData()</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthTest;
