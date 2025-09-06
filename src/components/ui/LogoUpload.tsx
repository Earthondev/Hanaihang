import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadMallLogo, deleteMallLogo } from '@/services/firebase/storage';

interface LogoUploadProps {
  mallId: string;
  currentLogoUrl?: string;
  onLogoChange: (logoUrl: string | null) => void;
  className?: string;
}

export default function LogoUpload({ 
  mallId, 
  currentLogoUrl, 
  onLogoChange, 
  className = "" 
}: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('ไฟล์ต้องเป็นรูปภาพเท่านั้น');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Create preview URL
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Upload to Firebase Storage
      const downloadURL = await uploadMallLogo(file, mallId);
      
      // Update parent component
      onLogoChange(downloadURL);
      
      // Clean up preview URL
      URL.revokeObjectURL(preview);
      setPreviewUrl(downloadURL);
      
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปโหลด');
      setPreviewUrl(currentLogoUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!currentLogoUrl) return;

    try {
      await deleteMallLogo(mallId);
      onLogoChange(null);
      setPreviewUrl(null);
      setError(null);
    } catch (error) {
      console.error('Delete error:', error);
      setError('เกิดข้อผิดพลาดในการลบโลโก้');
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        โลโก้ห้างสรรพสินค้า
      </label>
      
      {/* Logo Display/Upload Area */}
      <div className="flex items-center space-x-4">
        {/* Logo Preview */}
        <div className="relative">
          {previewUrl ? (
            <div className="relative group">
              <img
                src={previewUrl}
                alt="Mall Logo"
                className="w-20 h-20 rounded-xl object-cover border-2 border-gray-200"
              />
              {!isUploading && (
                <button
                  onClick={handleRemoveLogo}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="ลบโลโก้"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex-1">
          <button
            type="button"
            onClick={handleClick}
            disabled={isUploading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังอัปโหลด...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {previewUrl ? 'เปลี่ยนโลโก้' : 'อัปโหลดโลโก้'}
              </>
            )}
          </button>
          
          <p className="mt-1 text-xs text-gray-500">
            รองรับไฟล์ JPG, PNG, GIF ขนาดไม่เกิน 5MB
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
