import React from 'react';

interface SkeletonListProps {
  rows?: number;
  className?: string;
}

export default function SkeletonList({ rows = 6, className = '' }: SkeletonListProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div 
          key={i} 
          className="h-16 w-full animate-pulse rounded-xl bg-gray-100 flex items-center p-4"
        >
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-8 w-20 bg-gray-200 rounded-lg ml-4"></div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 p-4">
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </th>
              <th className="px-4 py-3 text-left font-semibold">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </th>
              <th className="px-4 py-3 text-left font-semibold">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </th>
              <th className="px-4 py-3 text-left font-semibold">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="border-t">
                <td className="px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex space-x-2">
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
