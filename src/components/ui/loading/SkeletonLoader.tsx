import React from 'react';

import { cn } from '../../../utils/cn';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  animate?: boolean;
}

export function Skeleton({ 
  className, 
  width, 
  height, 
  rounded = true,
  animate = true 
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-gray-200',
        rounded && 'rounded',
        animate && 'animate-pulse',
        className
      )}
      style={{
        width: width || '100%',
        height: height || '1rem',
      }}
    />
  );
}

// Pre-built skeleton components
export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height="0.75rem" />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('p-6 border border-gray-200 rounded-lg', className)}>
      <div className="space-y-4">
        <Skeleton height="1.5rem" width="60%" />
        <SkeletonText lines={3} />
        <div className="flex space-x-2">
          <Skeleton height="2rem" width="4rem" />
          <Skeleton height="2rem" width="4rem" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height="1rem" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} height="1rem" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonMallCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="space-y-4">
        {/* Mall name */}
        <Skeleton height="1.5rem" width="70%" />
        
        {/* Address */}
        <SkeletonText lines={2} />
        
        {/* Stats row */}
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <Skeleton height="1rem" width="1rem" rounded />
            <Skeleton height="1rem" width="3rem" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton height="1rem" width="1rem" rounded />
            <Skeleton height="1rem" width="3rem" />
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <Skeleton height="2rem" width="5rem" />
          <Skeleton height="2rem" width="5rem" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonStoreRow() {
  return (
    <div className="flex items-center space-x-4 p-4 border-b border-gray-100">
      <Skeleton height="2.5rem" width="2.5rem" rounded />
      <div className="flex-1 space-y-2">
        <Skeleton height="1rem" width="40%" />
        <Skeleton height="0.75rem" width="60%" />
      </div>
      <Skeleton height="1rem" width="4rem" />
      <Skeleton height="1rem" width="3rem" />
      <Skeleton height="2rem" width="5rem" />
    </div>
  );
}

// Loading states for specific components
export function MallListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonMallCard key={i} />
      ))}
    </div>
  );
}

export function StoreTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <Skeleton height="1.5rem" width="30%" />
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonStoreRow key={i} />
        ))}
      </div>
    </div>
  );
}

export function AdminPanelSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <Skeleton height="2rem" width="40%" />
        <Skeleton height="1rem" width="60%" className="mt-2" />
      </div>
      
      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <Skeleton height="2.5rem" width="6rem" />
        <Skeleton height="2.5rem" width="6rem" />
        <Skeleton height="2.5rem" width="6rem" />
      </div>
      
      {/* Content */}
      <MallListSkeleton count={6} />
    </div>
  );
}
