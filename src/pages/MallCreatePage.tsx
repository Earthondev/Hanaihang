import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { AnimatedSuccessModal } from '../components/ui/feedback/SuccessModal';
import MallForm from '../legacy/forms/MallForm';

const MallCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdMallName, setCreatedMallName] = useState('');

  const handleSubmit = async (mallName?: string) => {
    if (mallName) {
      setCreatedMallName(mallName);
    }
    setShowSuccessModal(true);
  };

  const handleSuccessConfirm = () => {
    navigate('/admin?tab=malls');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin?tab=malls')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  สร้างห้างสรรพสินค้าใหม่
                </h1>
                <p className="text-sm text-gray-600">
                  เพิ่มห้างสรรพสินค้าใหม่เข้าสู่ระบบ
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MallForm
          mode="create"
          onSuccess={handleSubmit}
        />
      </div>

      {/* Success Modal */}
      <AnimatedSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="สร้างห้างสำเร็จ! 🎉"
        message={`ห้างสรรพสินค้า "${createdMallName}" ได้รับการสร้างเรียบร้อยแล้ว`}
        onConfirm={handleSuccessConfirm}
        confirmText="กลับไปหน้าห้าง"
      />
    </div>
  );
};

export default MallCreatePage;