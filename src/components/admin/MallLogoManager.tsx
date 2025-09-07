import React, { useState, useEffect } from 'react';
import { Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';

import Card from '../ui/Card';
import LogoUpload from '../ui/LogoUpload';

import { listMalls, updateMall } from '@/services/firebase/firestore';
import { Mall } from '@/types/mall-system';

interface MallLogoManagerProps {
  className?: string;
}

export default function MallLogoManager({
  className = '',
}: MallLogoManagerProps) {
  const [malls, setMalls] = useState<Mall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMall, setSelectedMall] = useState<Mall | null>(null);

  useEffect(() => {
    loadMalls();
  }, []);

  const loadMalls = async () => {
    try {
      setLoading(true);
      const mallsData = await listMalls();
      setMalls(mallsData);
      setError(null);
    } catch (err) {
      console.error('Error loading malls:', err);
      setError('ไม่สามารถโหลดข้อมูลห้างได้');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = async (mallId: string, logoUrl: string | null) => {
    try {
      await updateMall(mallId, { logoUrl } as any);

      // Update local state
      setMalls(prev =>
        prev.map(mall => (mall.id === mallId ? { ...mall, logoUrl } : mall)),
      );

      // Update selected mall if it's the same one
      if (selectedMall?.id === mallId) {
        setSelectedMall(prev => (prev ? { ...prev, logoUrl } : null));
      }
    } catch (err) {
      console.error('Error updating mall logo:', err);
      setError('ไม่สามารถอัปเดตโลโก้ได้');
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">กำลังโหลดข้อมูลห้าง...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={loadMalls}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
          >
            ลองใหม่
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            จัดการโลโก้ห้างสรรพสินค้า
          </h2>
          <p className="text-gray-600 mb-6">
            เลือกห้างเพื่ออัปโหลดหรือแก้ไขโลโก้
          </p>

          {/* Mall Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {malls.map(mall => (
              <button
                key={mall.id}
                onClick={() => setSelectedMall(mall)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedMall?.id === mall.id
                    ? 'border-primary bg-primary-soft'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {mall.logoUrl ? (
                    <img
                      src={mall.logoUrl}
                      alt={`${mall.displayName} logo`}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {mall.displayName}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {mall.district}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Logo Upload Section */}
          {selectedMall && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                อัปโหลดโลโก้: {selectedMall.displayName}
              </h3>
              <LogoUpload
                mallId={selectedMall.id!}
                currentLogoUrl={selectedMall.logoUrl}
                onLogoChange={logoUrl =>
                  handleLogoChange(selectedMall.id!, logoUrl)
                }
              />
            </div>
          )}
        </div>
      </Card>

      {/* Logo Gallery */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            โลโก้ทั้งหมด
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {malls.map(mall => (
              <div key={mall.id} className="text-center">
                {mall.logoUrl ? (
                  <div className="relative group">
                    <img
                      src={mall.logoUrl}
                      alt={`${mall.displayName} logo`}
                      className="w-16 h-16 rounded-lg object-cover mx-auto border border-gray-200"
                    />
                    <button
                      onClick={() => handleLogoChange(mall.id!, null)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="ลบโลโก้"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto border border-gray-200">
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <p className="text-xs text-gray-600 mt-2 truncate">
                  {mall.displayName}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
