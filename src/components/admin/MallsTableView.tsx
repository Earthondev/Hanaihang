import React, { useEffect, useMemo, useState } from 'react';
import { Edit, Building } from 'lucide-react';
import DataTable, { Column } from '../table/DataTable';
import TableToolbar from '../table/TableToolbar';
import Pagination from '../table/Pagination';
import { DeleteButton } from './DeleteButton';
import { listMalls, deleteMall } from '../../lib/firestore';
import { Mall } from '../../types/mall-system';

interface MallsTableViewProps {
  onRefresh?: () => void;
}

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
  const handleDelete = async (mallId: string) => {
    try {
      await deleteMall(mallId);
      // Refresh the data
      const updatedMalls = await listMalls();
      setMalls(updatedMalls);
      onRefresh?.();
    } catch (err) {
      console.error('Error deleting mall:', err);
      throw err; // Let DeleteButton handle the error
    }
  };

  // Table columns
  const columns: Column<Mall>[] = useMemo(() => [
    {
      key: "displayName",
      header: "ชื่อห้างสรรพสินค้า",
      sortable: true,
      render: (mall) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Building className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">
              {mall.displayName || mall.name}
            </div>
            <div className="text-sm text-gray-500">
              {mall.contact?.phone || 'ไม่มีเบอร์โทร'}
            </div>
          </div>
        </div>
      )
    },
    {
      key: "address",
      header: "ที่อยู่",
      sortable: true,
      render: (mall) => (
        <div>
          <div className="text-sm text-gray-900">{mall.address}</div>
          <div className="text-sm text-gray-500">
            {mall.contact?.website || 'ไม่มีเว็บไซต์'}
          </div>
        </div>
      )
    },
    {
      key: "district",
      header: "เขต",
      sortable: true,
      width: "120px"
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
          {mall.updatedAt ? new Date(mall.updatedAt.seconds * 1000).toLocaleDateString('th-TH') : '-'}
        </span>
      )
    },
    {
      key: "actions",
      header: "",
      width: "120px",
      render: (mall) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              // TODO: Implement edit functionality
              alert('ฟีเจอร์แก้ไขจะเปิดใช้งานเร็วๆ นี้');
            }}
            className="rounded-xl border px-3 py-2 hover:bg-gray-50 transition-colors"
            aria-label={`แก้ไขห้างสรรพสินค้า ${mall.displayName}`}
          >
            <Edit className="h-4 w-4" />
          </button>
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
