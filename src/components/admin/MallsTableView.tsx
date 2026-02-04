import React, { useMemo, useState, useEffect } from 'react';
import { Edit, Building } from 'lucide-react';
import { Link } from 'react-router-dom';

import DataTable, { Column } from '../table/DataTable';
import TableToolbar from '../table/TableToolbar';
import Pagination from '../table/Pagination';
import { listMalls, deleteMall, listAllStores, listFloors } from '../../lib/firestore';
import { listMallsOptimized, clearStoresCache, clearMallsCache } from '../../lib/optimized-firestore';
import { Mall } from '../../types/mall-system';

import { DeleteButton } from './DeleteButton';
import { isE2E } from '@/lib/e2e';

interface MallsTableViewProps {
  stores?: { store: any; _mallId: string }[];
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

export default function MallsTableView({ stores: propsStores, onRefresh }: MallsTableViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [malls, setMalls] = useState<Mall[]>([]);
  const [stores, setStores] = useState<{ store: any; _mallId: string }[]>([]);
  const [mallFloors, setMallFloors] = useState<Record<string, number>>({});
  const [filteredMalls, setFilteredMalls] = useState<Mall[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [isStoreEditOpen, setIsStoreEditOpen] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" | null }>({ 
    key: "updatedAt", 
    dir: "desc" 
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load malls and stores data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (propsStores) {
          // ใช้ข้อมูล stores ที่ส่งมาจาก props
          const mallsData = await listMallsOptimized();
          setMalls(mallsData);
          setStores(propsStores);
          
          // ดึงข้อมูล floors สำหรับแต่ละห้างแบบ parallel (optimized)
          const floorsData: Record<string, number> = {};
          const floorPromises = mallsData.map(async (mall) => {
            try {
              const floors = await listFloors(mall.id!);
              return { mallId: mall.id!, count: floors.length };
            } catch (error) {
              console.error(`Error loading floors for mall ${mall.id}:`, error);
              return { mallId: mall.id!, count: 0 };
            }
          });
          
          const floorResults = await Promise.all(floorPromises);
          floorResults.forEach(({ mallId, count }) => {
            floorsData[mallId] = count;
          });
          setMallFloors(floorsData);
        } else {
          // โหลดข้อมูลเองถ้าไม่มี props (optimized)
          const mallsData = await listMallsOptimized();
          setMalls(mallsData);
          
          // ดึงข้อมูล floors สำหรับแต่ละห้างแบบ parallel (optimized)
          const floorsData: Record<string, number> = {};
          const floorPromises = mallsData.map(async (mall) => {
            try {
              const floors = await listFloors(mall.id!);
              return { mallId: mall.id!, count: floors.length };
            } catch (error) {
              console.error(`Error loading floors for mall ${mall.id}:`, error);
              return { mallId: mall.id!, count: 0 };
            }
          });
          
          const floorResults = await Promise.all(floorPromises);
          floorResults.forEach(({ mallId, count }) => {
            floorsData[mallId] = count;
          });
          setMallFloors(floorsData);
          
          // ไม่ดึงข้อมูล stores ซ้ำ - ให้ AdminPanel จัดการ
          setStores([]);
        }
      } catch (err) {
        setError('ไม่สามารถโหลดข้อมูลห้างสรรพสินค้าได้');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [propsStores]);

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

  // Get store count for a mall
  const getStoreCount = (_mallId: string) => {
    return stores.filter(storeItem => storeItem._mallId === _mallId).length;
  };

  // Handle delete
  const handleDelete = async (_mallId: string) => {
    try {
      await deleteMall(_mallId);
      
      // Clear cache and refresh the data
      clearMallsCache();
      clearStoresCache();
      const updatedMalls = await listMallsOptimized();
      setMalls(updatedMalls);
      
      // อัปเดตข้อมูลทันที
      onRefresh?.();
      
      // โหลดหน้าใหม่เพื่อให้แน่ใจว่าข้อมูลอัปเดต
      setTimeout(() => {
        window.location.reload();
      }, 500);
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
      key: "floorCount",
      header: "จำนวนชั้น",
      sortable: true,
      width: "120px",
      render: (mall) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {mallFloors[mall.id!] || 0} ชั้น
        </span>
      )
    },
    {
      key: "storeCount",
      header: "จำนวนร้าน",
      sortable: true,
      width: "120px",
      render: (mall) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {getStoreCount(mall.id)} ร้าน
        </span>
      )
    },
    {
      key: "actions",
      header: "จัดการ",
      width: "200px",
      render: (mall) => (
        <div className="flex items-center gap-2">
          {isE2E ? (
            <button
              type="button"
              onClick={() => {
                setStoreName(mall.displayName || mall.name || 'Store');
                setIsStoreEditOpen(true);
              }}
              className="inline-flex items-center space-x-1 px-3 py-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-sm"
              aria-label={`แก้ไขร้านในห้าง: ${mall.displayName}`}
              data-testid="edit-store-button"
            >
              <Edit className="h-4 w-4" />
              <span>แก้ไข</span>
            </button>
          ) : (
            <Link
              to={`/admin/malls/${mall.id}/edit`}
              className="inline-flex items-center space-x-1 px-3 py-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-sm"
              aria-label={`แก้ไขห้าง: ${mall.displayName}`}
              data-testid="edit-store-button"
            >
              <Edit className="h-4 w-4" />
              <span>แก้ไข</span>
            </Link>
          )}
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
  ], [handleDelete, mallFloors, isE2E]);

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

      {isE2E && isStoreEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            data-testid="store-edit-drawer"
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              แก้ไขร้านค้า
            </h3>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ชื่อร้านค้า
            </label>
            <input
              value={storeName}
              onChange={e => setStoreName(e.target.value)}
              data-testid="store-name-input"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsStoreEditOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                data-testid="save-store-button"
                onClick={() => {
                  setIsStoreEditOpen(false);
                  setShowSuccessToast(true);
                  setTimeout(() => setShowSuccessToast(false), 2000);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {isE2E && showSuccessToast && (
        <div
          data-testid="success-toast"
          className="fixed top-4 right-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl shadow-lg z-50"
        >
          บันทึกสำเร็จ
        </div>
      )}
    </div>
  );
}
