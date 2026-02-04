import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

import { SkeletonTable } from '../feedback/SkeletonList';
import { ErrorState } from '../feedback/ErrorState';
import { EmptyState } from '../ui/EmptyState';

export type Column<T> = {
  key: keyof T | string;
  header: string;
  width?: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
};

interface DataTableProps<T> {
  loading?: boolean;
  error?: string | null;
  emptyType?: "malls" | "stores" | "search";
  columns: Column<T>[];
  rows: T[];
  sort?: { key: string; dir: "asc" | "desc" | null };
  onSortChange?: (key: string, dir: "asc" | "desc") => void;
  rowKey: (row: T) => string;
  footer?: React.ReactNode;
  className?: string;
}

export default function DataTable<T>({ 
  loading, 
  error, 
  emptyType, 
  columns, 
  rows, 
  sort, 
  onSortChange, 
  rowKey, 
  footer,
  className = ''
}: DataTableProps<T>) {
  
  if (loading) {
    return <SkeletonTable rows={5} />;
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorState 
          message={error} 
          onRetry={() => {
            // Retry logic would be handled by parent component
            window.location.reload();
          }}
        />
      </div>
    );
  }

  if (!rows?.length) {
    const emptyStateProps = {
      type: emptyType ?? "search" as const,
      title: emptyType === "malls" ? "ไม่พบห้างสรรพสินค้า" : 
             emptyType === "stores" ? "ไม่พบร้านค้า" : "ไม่พบผลลัพธ์",
      description: emptyType === "malls" ? "ยังไม่มีข้อมูลห้างสรรพสินค้าในระบบ" :
                  emptyType === "stores" ? "ยังไม่มีข้อมูลร้านค้าในระบบ" :
                  "ลองค้นหาด้วยคำอื่น หรือเลือกจากรายการด้านล่าง"
    };
    return <EmptyState {...emptyStateProps} />;
  }

  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !onSortChange) return;
    
    const columnKey = String(column.key);
    const nextDir = (!sort || sort.key !== columnKey) 
      ? "asc" 
      : (sort.dir === "asc" ? "desc" : "asc");
    
    onSortChange(columnKey, nextDir);
    
    // Analytics tracking
    if (typeof window !== 'undefined' && (window as unknown).gtag) {
      (window as unknown).gtag('event', 'table_sort', {
        event_category: 'table_actions',
        event_label: 'sort',
        custom_parameter: {
          key: columnKey,
          direction: nextDir
        }
      });
    }
  };

  const getSortIcon = (column: Column<T>) => {
    if (!column.sortable || sort?.key !== String(column.key)) {
      return null;
    }
    
    return sort.dir === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  return (
    <div className={`rounded-2xl border border-gray-200 overflow-hidden bg-white ${className}`}>
      <div className="overflow-x-auto max-h-[70vh]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white shadow-sm z-10">
            <tr>
              {columns.map((column) => (
                <th 
                  key={String(column.key)} 
                  style={{ width: column.width }}
                  className={`px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50 ${
                    column.sortable 
                      ? "cursor-pointer select-none hover:bg-gray-100 transition-colors" 
                      : ""
                  }`}
                  onClick={() => handleSort(column)}
                  aria-sort={
                    sort?.key === String(column.key) 
                      ? (sort.dir === "asc" ? "ascending" : "descending") 
                      : "none"
                  }
                >
                  <div className="inline-flex items-center gap-1">
                    <span>{column.header}</span>
                    {getSortIcon(column)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((row) => (
              <tr 
                key={rowKey(row)} 
                className="hover:bg-gray-50 transition-colors focus-within:bg-blue-50"
              >
                {columns.map((column) => (
                  <td 
                    key={String(column.key)} 
                    className="px-4 py-3 align-middle"
                  >
                    {column.render ? column.render(row) : (row as unknown)[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {footer && (
            <tfoot>
              <tr>
                <td colSpan={columns.length} className="p-0">
                  {footer}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
