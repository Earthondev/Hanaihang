import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  sizes?: number[];
  className?: string;
}

export default function Pagination({ 
  page, 
  pageSize, 
  total, 
  onPageChange, 
  onPageSizeChange, 
  sizes = [10, 20, 50],
  className = ''
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  const handlePageChange = (newPage: number) => {
    onPageChange(newPage);
    
    // Analytics tracking
    if (typeof window !== 'undefined' && (window as unknown).gtag) {
      (window as unknown).gtag('event', 'table_pagination', {
        event_category: 'table_actions',
        event_label: 'page_change',
        custom_parameter: {
          page: newPage,
          page_size: pageSize
        }
      });
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    onPageSizeChange?.(newPageSize);
    
    // Analytics tracking
    if (typeof window !== 'undefined' && (window as unknown).gtag) {
      (window as unknown).gtag('event', 'table_pagination', {
        event_category: 'table_actions',
        event_label: 'page_size_change',
        custom_parameter: {
          page: 1,
          page_size: newPageSize
        }
      });
    }
  };

  return (
    <div className={`flex items-center justify-between p-4 bg-gray-50 rounded-xl ${className}`}>
      {/* Results Info */}
      <div className="text-sm text-gray-600">
        แสดง {startItem}–{endItem} จาก {total} รายการ
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-3">
        {/* Page Size Selector */}
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">แสดง:</label>
            <select
              className="h-9 rounded-lg border border-gray-300 px-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
              aria-label="จำนวนต่อหน้า"
            >
              {sizes.map((size) => (
                <option key={size} value={size}>
                  {size}/หน้า
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="h-9 w-9 rounded-lg border border-gray-300 bg-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            aria-label="หน้าก่อนหน้า"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="px-3 text-sm text-gray-700">
            หน้า {page} จาก {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="h-9 w-9 rounded-lg border border-gray-300 bg-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            aria-label="หน้าถัดไป"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
