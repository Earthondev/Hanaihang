import React from 'react';
import { useNavigate } from 'react-router-dom';

import { deleteMall } from '../../lib/firestore';

import { DeleteButton } from './DeleteButton';

interface MallsTableProps {
  malls: unknown[];
  stores: unknown[];
  onRefresh: () => void;
}

const MallsTable: React.FC<MallsTableProps> = ({ malls, stores, onRefresh }) => {
  const navigate = useNavigate();

  const handleDelete = async (mallId: string) => {
    await deleteMall(mallId);
    
    // อัปเดตข้อมูลทันที
    onRefresh();
    
    // โหลดหน้าใหม่เพื่อให้แน่ใจว่าข้อมูลอัปเดต
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleEdit = (_mallId: string) => {
    navigate(`/admin/malls/${mallId}/edit`);
  };

  const getStoreCount = (_mallId: string) => {
    return stores.filter(store => store.mallId === mallId).length;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published':
        return 'bg-green-100 text-green-800';
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (malls.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีข้อมูลห้างสรรพสินค้า</h3>
        <p className="text-gray-500">เริ่มต้นโดยการเพิ่มห้างสรรพสินค้าใหม่หรือใช้ข้อมูลตัวอย่าง</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ห้างสรรพสินค้า
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ที่อยู่
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              เขต
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              เวลาเปิด-ปิด
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              จำนวนร้าน
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              สถานะ
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              จัดการ
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {malls.map((mall) => (
            <tr key={mall.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-green-600">
                        {(mall.displayName || mall.name).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {mall.displayName || mall.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {mall.contact?.phone || 'ไม่มีเบอร์โทร'}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{mall.address}</div>
                <div className="text-sm text-gray-500">
                  {mall.contact?.website || 'ไม่มีเว็บไซต์'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {mall.district}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {mall.hours ? `${mall.hours.open} - ${mall.hours.close}` : 'ไม่ระบุ'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getStoreCount(mall.id)} ร้าน
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(mall.status)}`}>
                  {mall.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(mall.id)}
                    className="text-blue-600 hover:text-blue-900 transition-colors"
                    title="แก้ไข"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <DeleteButton
                    id={mall.id}
                    name={mall.displayName || mall.name}
                    type="mall"
                    onDelete={handleDelete}
                    onSuccess={onRefresh}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MallsTable;
