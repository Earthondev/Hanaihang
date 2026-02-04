import React from 'react';
import { Heart, HeartOff } from 'lucide-react';

import { useBookmarks } from '../../hooks/useBookmarks';

interface BookmarkButtonProps {
  mall: {
    id: string;
    name: string;
    displayName: string;
    address?: string;
    district?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function BookmarkButton({ mall, size = 'md', showText = false, className = '' }: BookmarkButtonProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  
  const isBooked = isBookmarked(mall.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark(mall);
  };

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <button
      onClick={handleClick}
      className={`
        ${sizeClasses[size]}
        ${className}
        rounded-full transition-all duration-200
        ${isBooked 
          ? 'bg-red-100 text-red-600 hover:bg-red-200' 
          : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
        }
        focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
      `}
      title={isBooked ? 'ลบออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
      aria-label={isBooked ? 'ลบออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
    >
      <div className="flex items-center space-x-1">
        {isBooked ? (
          <Heart className={`${iconSizes[size]} fill-current`} />
        ) : (
          <HeartOff className={iconSizes[size]} />
        )}
        {showText && (
          <span className={`${textSizes[size]} font-medium`}>
            {isBooked ? 'บันทึกแล้ว' : 'บันทึก'}
          </span>
        )}
      </div>
    </button>
  );
}

export default BookmarkButton;
