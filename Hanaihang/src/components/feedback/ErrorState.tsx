import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

import { BaseButton } from '../ui/BaseButton';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  title?: string;
  className?: string;
}

export function ErrorState({ 
  message = "เกิดข้อผิดพลาดในการโหลดข้อมูล", 
  onRetry, 
  title = "เกิดข้อผิดพลาด",
  className = ''
}: ErrorStateProps) {
  return (
    <div className={`rounded-2xl border border-red-200 bg-red-50 p-6 text-center ${className}`}>
      <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 grid place-items-center">
        <AlertCircle className="h-6 w-6 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-red-800 mb-2">{title}</h3>
      <p className="text-sm text-red-700 mb-6">{message}</p>
      {onRetry && (
        <BaseButton 
          variant="outline" 
          onClick={onRetry}
          className="border-red-300 text-red-700 hover:bg-red-100"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          ลองใหม่
        </BaseButton>
      )}
    </div>
  );
}

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="ไม่สามารถเชื่อมต่อได้"
      message="ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่อีกครั้ง"
      onRetry={onRetry}
    />
  );
}

export function NotFoundError({ 
  title = "ไม่พบข้อมูล", 
  message = "ข้อมูลที่คุณค้นหาอาจถูกลบหรือย้ายไปแล้ว",
  onRetry 
}: { 
  title?: string; 
  message?: string; 
  onRetry?: () => void 
}) {
  return (
    <ErrorState
      title={title}
      message={message}
      onRetry={onRetry}
      className="border-yellow-200 bg-yellow-50"
    />
  );
}
