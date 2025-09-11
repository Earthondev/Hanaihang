import React from 'react';

interface SkeletonBlockProps {
  className?: string;
  lines?: number;
}

export function SkeletonBlock({ className = '', lines = 3 }: SkeletonBlockProps) {
  return (
    <div className={`animate-pulse space-y-4 ${className}`}>
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div 
            key={index}
            className={`h-4 bg-gray-200 rounded ${index === lines - 1 ? 'w-5/6' : 'w-full'}`}
          ></div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="h-24 bg-gray-200 rounded-xl"></div>
        <div className="h-24 bg-gray-200 rounded-xl"></div>
        <div className="h-24 bg-gray-200 rounded-xl"></div>
      </div>
    </div>
  );
}

export default SkeletonBlock;
