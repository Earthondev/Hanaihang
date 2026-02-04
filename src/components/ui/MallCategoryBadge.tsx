import React from 'react';

interface MallCategoryBadgeProps {
  category?: 'shopping-center' | 'community-mall' | 'high-end' | 'outlet' | 'department-store';
  categoryLabel?: string;
  size?: 'sm' | 'md' | 'lg';
}

const categoryConfig = {
  'shopping-center': {
    label: 'ศูนย์การค้า',
    color: 'bg-blue-100 text-blue-700',
    icon: '🏢'
  },
  'community-mall': {
    label: 'คอมมูนิตี้มอลล์',
    color: 'bg-green-100 text-green-700',
    icon: '🏘️'
  },
  'high-end': {
    label: 'ไฮเอนด์',
    color: 'bg-purple-100 text-purple-700',
    icon: '💎'
  },
  'outlet': {
    label: 'เอาท์เล็ต',
    color: 'bg-orange-100 text-orange-700',
    icon: '🏪'
  },
  'department-store': {
    label: 'ห้างสรรพสินค้า',
    color: 'bg-pink-100 text-pink-700',
    icon: '🏬'
  }
};

export function MallCategoryBadge({ category, categoryLabel, size = 'md' }: MallCategoryBadgeProps) {
  if (!category && !categoryLabel) {
    return null;
  }

  const config = category ? categoryConfig[category] : null;
  const label = categoryLabel || config?.label || 'ไม่ระบุ';
  const colorClass = config?.color || 'bg-gray-100 text-gray-700';
  const icon = config?.icon || '🏢';

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <div className={`inline-flex items-center space-x-1 rounded-full font-medium ${sizeClasses[size]} ${colorClass}`}>
      <span className={size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}>
        {icon}
      </span>
      <span>{label}</span>
    </div>
  );
}

export default MallCategoryBadge;
