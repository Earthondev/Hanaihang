import React, { useMemo, useState, useEffect } from 'react';
import { Edit, Building } from 'lucide-react';
import { Link } from 'react-router-dom';

import { DeleteButton } from './DeleteButton';

import DataTable, { Column } from '@/ui/table/DataTable';
import TableToolbar from '@/ui/table/TableToolbar';
import Pagination from '@/ui/table/Pagination';
import { listMalls, deleteMall } from '@/services/firebase/firestore';
import { Mall } from '@/types/mall-system';


interface MallsTableViewProps {
  onRefresh?: () => void;
}

// Helper function to format date safely
const _formatDate = (date: any): string => {
  if (!date) return '—';
  
  try {
    let dateObj: Date;
    
    // Handle Firestore Timestamp
    if (date.toDate && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    }
    // Handle timestamp with seconds
    else if (date.seconds) {
      dateObj = new Date(date.seconds * 1000);
    }
    // Handle Date object or ISO string
    else if (date instanceof Date) {
      dateObj = date;
    }
    // Handle ISO string
    else if (typeof date === 'string') {
      dateObj = new Date(date);
    }
    // Handle number (timestamp)
    else if (typeof date === 'number') {
      dateObj = new Date(date);
    }
    else {
      return '—';
    }
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return '—';
    }
    
    return dateObj.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '—';
  }
};

export default function MallsTableView({ onRefresh }: MallsTableViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [malls, setMalls] = useState<Mall[]>([]);
  const [filteredMalls, setFilteredMalls] = useState<Mall[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" | null }>({ 
    key: "updatedAt", 
    dir: "desc" 
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load malls data
  useEffect(() => {
    const loadMalls = async () => {
      try {
        setLoading(true);
        setError(null);
        const mallsData = await listMalls();
        setMalls(mallsData);
      } catch (err) {
        setError('ไม่สามารถโหลดข้อมูลห้างสรรพสินค้าได้');
        console.error('Error loading malls:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMalls();
  }, []);

  // Filter and sort malls
  useEffect(() => {
    let filtered = [...malls];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(mall => 
        mall.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mall.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mall.district?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply district filter
    if (districtFilter) {
      filtered = filtered.filter(mall => mall.district === districtFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = (a as any)[sort.key];
      const bValue = (b as any)[sort.key];
      
      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      const comparison = aValue < bValue ? -1 : 1;
      return sort.dir === "desc" ? -comparison : comparison;
    });

    setFilteredMalls(filtered);
    setPage(1); // Reset to first page when filters change
  }, [malls, searchQuery, districtFilter, sort]);

  // Get paginated data
  const paginatedMalls = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredMalls.slice(start, end);
  }, [filteredMalls, page, pageSize]);

  // Get unique districts for filter
  const districts = useMemo(() => {
    const uniqueDistricts = [...new Set(malls.map(mall => mall.district).filter(Boolean))];
    return uniqueDistricts.map(district => ({ label: district, value: district }));
  }, [malls]);

  // Handle delete
  const handleDelete = async (_mallId: string) => {
    try {
      await deleteMall(mallId);
      // Refresh the data
      const updatedMalls = await listMalls();
      setMalls(updatedMalls);
      onRefresh?.();
    } catch (err) {
      console.error('Error deleting mall:', err);
    }
  };

  const columns: Column<Mall>[] = useMemo(() => [
    {
      key: "displayName",
      header: "ชื่อห้างสรรพสินค้า",
      sortable: true,
      width: "200px",
      render: (mall) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Building className="h-5 w-5 text-gray-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {mall.displayName || mall.name || 'ไม่มีชื่อ'}
            </p>
            {mall.name && (
              <div className="text-sm text-gray-500">
                <span className="font-medium">Slug:</span> {mall.name}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: "district",
      header: "เขต",
      sortable: true,
      width: "120px",
      render: (mall) => (
        <span className="text-sm text-gray-900">
          {mall.district || 'ไม่ระบุ'}
        </span>
      )
    },
    {
      key: "address",
      header: "ที่อยู่",
      sortable: false,
      width: "250px",
      render: (mall) => (
        <span className="text-sm text-gray-900 truncate block">
          {mall.address || 'ไม่ระบุ'}
        </span>
      )
    },
    {
      key: "floorCount",
      header: "จำนวนชั้น",
      sortable: true,
      width: "100px",
      render: (mall) => (
        <div className="flex items-center space-x-1">
          <span className="text-sm font-medium text-gray-900">
            {mall.floorCount || 0}
          </span>
          <span className="text-xs text-gray-500">ชั้น</span>
        </div>
      )
    },
    {
      key: "storeCount",
      header: "จำนวนร้าน",
      sortable: true,
      width: "100px",
      render: (mall) => (
        <div className="flex items-center space-x-1">
          <span className="text-sm font-medium text-gray-900">
            {mall.storeCount || 0}
          </span>
          <span className="text-xs text-gray-500">ร้าน</span>
        </div>
      )
    },
    {
      key: "hours",
      header: "เวลาเปิด-ปิด",
      sortable: false,
      width: "140px",
      render: (mall) => (
        <span className="text-sm text-gray-900">
          {mall.hours ? `${mall.hours.open} - ${mall.hours.close}` : 'ไม่ระบุ'}
        </span>
      )
    },
    {
      key: "updatedAt",
      header: "แก้ไขล่าสุด",
      sortable: true,
      width: "160px",
      render: (mall) => (
        <span className="text-sm text-gray-500">
          {formatDate(mall.updatedAt)}
        </span>
      )
    },
    {
      key: "actions",
      header: "",
      width: "140px",
      render: (mall) => (
        <div className="flex justify-end gap-2">
          <Link
            to={`/admin/malls/${mall.id}/edit`}
            className="inline-flex items-center space-x-1 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            aria-label={`แก้ไขห้าง: ${mall.displayName}`}
          >
            <Edit className="h-4 w-4" />
            <span className="text-sm">แก้ไข</span>
          </Link>
          <DeleteButton
            id={mall.id}
            name={mall.displayName || mall.name}
            type="mall"
            onDelete={handleDelete}
            onSuccess={() => {
              // Data is already refreshed in handleDelete
            }}
          />
        </div>
      )
    }
  ], [handleDelete]);

  const handleReset = () => {
    setSearchQuery('');
    setDistrictFilter('');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <TableToolbar
        placeholder="ค้นหาห้างสรรพสินค้า..."
        onSearch={setSearchQuery}
        onReset={handleReset}
        filters={[
          {
            label: "เขต",
            key: "district",
            value: districtFilter,
            onChange: setDistrictFilter,
            options: districts
          }
        ]}
      />

      <DataTable<Mall>
        loading={loading}
        error={error}
        emptyType={searchQuery || districtFilter ? "search" : "malls"}
        columns={columns}
        rows={paginatedMalls}
        sort={sort.dir ? { key: sort.key, dir: sort.dir } : undefined}
        onSortChange={(key, dir) => setSort({ key, dir })}
        rowKey={(mall) => mall.id}
        data-testid="malls-table"
        footer={
          <Pagination
            page={page}
            pageSize={pageSize}
            total={filteredMalls.length}
            onPageChange={setPage}
            onPageSizeChange={(newPageSize) => {
              setPageSize(newPageSize);
              setPage(1);
            }}
          />
        }
      />
    </div>
  );
}
