import React from 'react';
import { Search, AlertCircle, Store, MapPin, Database } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-results' | 'no-stores' | 'no-malls' | 'error' | 'bookmarks' | 'no-data';
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  icon?: React.ReactNode;
}

const defaultConfig = {
  'no-results': {
    title: 'ไม่พบผลการค้นหา',
    description: 'ลองใช้คำค้นหาอื่น หรือตรวจสอบการสะกดคำ',
    icon: <Search className="w-16 h-16 text-gray-400" />
  },
  'no-stores': {
    title: 'ยังไม่มีร้านค้า',
    description: 'ห้างนี้ยังไม่มีร้านค้าในระบบ',
    icon: <Store className="w-16 h-16 text-gray-400" />
  },
  'no-malls': {
    title: 'ไม่พบห้างสรรพสินค้า',
    description: 'ยังไม่มีห้างสรรพสินค้าในระบบ',
    icon: <MapPin className="w-16 h-16 text-gray-400" />
  },
  'error': {
    title: 'เกิดข้อผิดพลาด',
    description: 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
    icon: <AlertCircle className="w-16 h-16 text-red-400" />
  },
  'bookmarks': {
    title: 'ยังไม่มีห้างโปรด',
    description: 'กดปุ่ม ❤️ เพื่อบันทึกห้างที่คุณชอบ',
    icon: <Search className="w-16 h-16 text-gray-400" />
  },
  'no-data': {
    title: 'ไม่พบข้อมูล',
    description: 'ยังไม่มีข้อมูลในระบบ',
    icon: <Database className="w-16 h-16 text-gray-400" />
  }
};

export function EmptyState({
  type,
  title,
  description,
  action,
  icon
}: EmptyStateProps) {
  const config = defaultConfig[type] || defaultConfig['error'];
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;
  const displayIcon = icon || config.icon;

  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-gray-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
        {displayIcon}
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-3">
        {displayTitle}
      </h3>

      <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
        {displayDescription}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className={`
            inline-flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200
            ${action.variant === 'primary'
              ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
            }
          `}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default EmptyState;