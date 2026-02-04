import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface MallStatusBadgeProps {
  mall: {
    openTime?: string;
    closeTime?: string;
    hours?: {
      open: string;
      close: string;
    };
  };
  showTime?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function MallStatusBadge({ mall, showTime = true, size = 'md' }: MallStatusBadgeProps) {
  // รองรับทั้ง schema v2 (openTime/closeTime) และ legacy (hours.open/hours.close)
  const openTime = mall.openTime || mall.hours?.open;
  const closeTime = mall.closeTime || mall.hours?.close;
  
  if (!openTime || !closeTime) {
    return (
      <div className={`flex items-center space-x-1 text-gray-500 ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}>
        <Clock className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
        <span>ไม่ทราบเวลา</span>
      </div>
    );
  }

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  // แปลงเวลาเปิด-ปิดเป็นนาที
  const [openHour, openMin] = openTime.split(':').map(Number);
  const [closeHour, closeMin] = closeTime.split(':').map(Number);
  
  const openTimeMinutes = openHour * 60 + openMin;
  const closeTimeMinutes = closeHour * 60 + closeMin;
  
  // ตรวจสอบสถานะ
  const isOpen = currentTime >= openTimeMinutes && currentTime <= closeTimeMinutes;
  const isNearClosing = isOpen && (closeTimeMinutes - currentTime) <= 30; // ใกล้ปิด 30 นาที
  
  const getStatusInfo = () => {
    if (isNearClosing) {
      return {
        text: 'ใกล้ปิด',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: AlertCircle,
        iconColor: 'text-yellow-600'
      };
    } else if (isOpen) {
      return {
        text: 'เปิดอยู่',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: Clock,
        iconColor: 'text-green-600'
      };
    } else {
      return {
        text: 'ปิดแล้ว',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: Clock,
        iconColor: 'text-red-600'
      };
    }
  };

  const status = getStatusInfo();
  const Icon = status.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`inline-flex items-center space-x-1 rounded-full font-medium ${sizeClasses[size]} ${status.bgColor} ${status.color}`}>
        <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
        <span>{status.text}</span>
      </div>
      
      {showTime && (
        <span className={`text-gray-600 ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}>
          {openTime} - {closeTime}
        </span>
      )}
    </div>
  );
}

export default MallStatusBadge;
