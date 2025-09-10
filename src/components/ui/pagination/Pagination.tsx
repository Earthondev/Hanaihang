import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  maxVisiblePages?: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  showPrevNext = true,
  maxVisiblePages = 5,
  className
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const pages: (number | 'ellipsis')[] = [];
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calculate start and end of visible range
      let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      // Adjust start if we're near the end
      if (end - start + 1 < maxVisiblePages) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      
      // Add first page and ellipsis if needed
      if (start > 1) {
        pages.push(1);
        if (start > 2) {
          pages.push('ellipsis');
        }
      }
      
      // Add visible pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis and last page if needed
      if (end < totalPages) {
        if (end < totalPages - 1) {
          pages.push('ellipsis');
        }
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <nav className={cn('flex items-center justify-center space-x-1', className)}>
      {/* First page */}
      {showFirstLast && currentPage > 1 && (
        <button
          onClick={() => onPageChange(1)}
          className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="ไปหน้าแรก"
        >
          «
        </button>
      )}

      {/* Previous page */}
      {showPrevNext && currentPage > 1 && (
        <button
          onClick={() => onPageChange(currentPage - 1)}
          className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-1"
          aria-label="หน้าก่อนหน้า"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>ก่อนหน้า</span>
        </button>
      )}

      {/* Page numbers */}
      {visiblePages.map((page, index) => {
        if (page === 'ellipsis') {
          return (
            <span
              key={`ellipsis-${index}`}
              className="px-3 py-2 text-sm text-gray-500"
            >
              <MoreHorizontal className="w-4 h-4" />
            </span>
          );
        }

        const pageNumber = page as number;
        const isCurrentPage = pageNumber === currentPage;

        return (
          <button
            key={pageNumber}
            onClick={() => onPageChange(pageNumber)}
            className={cn(
              'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
              isCurrentPage
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            )}
            aria-label={`ไปหน้า ${pageNumber}`}
            aria-current={isCurrentPage ? 'page' : undefined}
          >
            {pageNumber}
          </button>
        );
      })}

      {/* Next page */}
      {showPrevNext && currentPage < totalPages && (
        <button
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-1"
          aria-label="หน้าถัดไป"
        >
          <span>ถัดไป</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Last page */}
      {showFirstLast && currentPage < totalPages && (
        <button
          onClick={() => onPageChange(totalPages)}
          className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="ไปหน้าสุดท้าย"
        >
          »
        </button>
      )}
    </nav>
  );
}

// Simple pagination for smaller lists
export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  className
}: Omit<PaginationProps, 'showFirstLast' | 'showPrevNext' | 'maxVisiblePages'>) {
  if (totalPages <= 1) return null;

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={cn(
          'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
          currentPage <= 1
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
        )}
      >
        ก่อนหน้า
      </button>

      <span className="text-sm text-gray-600">
        หน้า {currentPage} จาก {totalPages}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={cn(
          'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
          currentPage >= totalPages
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
        )}
      >
        ถัดไป
      </button>
    </div>
  );
}

// Pagination info component
export function PaginationInfo({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  className
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  className?: string;
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={cn('text-sm text-gray-600', className)}>
      แสดง {startItem}-{endItem} จาก {totalItems} รายการ
    </div>
  );
}
