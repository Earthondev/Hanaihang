import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/config/contexts/AuthContext';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await resetPassword(email);
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการส่งอีเมลรีเซ็ตรหัสผ่าน');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Success Icon */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                ส่งอีเมลสำเร็จ!
              </h1>
              <p className="text-gray-600">
                เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">ขั้นตอนถัดไป:</p>
                  <ul className="space-y-1 text-blue-700">
                    <li>• ตรวจสอบอีเมลของคุณ (รวมถึงโฟลเดอร์ Spam)</li>
                    <li>• คลิกลิงก์ในอีเมลเพื่อรีเซ็ตรหัสผ่าน</li>
                    <li>• ตั้งรหัสผ่านใหม่และเข้าสู่ระบบ</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleBackToLogin}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                กลับไปหน้าเข้าสู่ระบบ
              </button>
              
              <button
                onClick={() => {
                  setEmail('');
                  setIsSuccess(false);
                  setError('');
                }}
                className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                ส่งอีเมลใหม่
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ลืมรหัสผ่าน?
            </h1>
            <p className="text-gray-600">
              ไม่ต้องกังวล! กรอกอีเมลของคุณแล้วเราจะส่งลิงก์รีเซ็ตรหัสผ่านให้
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                อีเมล
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent pl-12"
                  placeholder="กรอกอีเมลของคุณ"
                  required
                />
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">เกิดข้อผิดพลาด</p>
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>กำลังส่งอีเมล...</span>
                </>
              ) : (
                <span>ส่งลิงก์รีเซ็ตรหัสผ่าน</span>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <button
              onClick={handleBackToLogin}
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับไปหน้าเข้าสู่ระบบ</span>
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              ไม่ได้รับอีเมล? ตรวจสอบโฟลเดอร์ Spam หรือ{' '}
              <button
                onClick={() => {
                  setEmail('');
                  setIsSuccess(false);
                  setError('');
                }}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                ลองใหม่อีกครั้ง
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
