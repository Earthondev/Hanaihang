
import React, { useState } from 'react';
import { Outlet, useParams, Link, useLocation } from 'react-router-dom';
import { Home, Search, MapPin, Heart, Building } from 'lucide-react';

import { useFloors } from '@/legacy/hooks/useApi';
import Button from '@/ui/Button';

const MallLayout: React.FC = () => {
  const { mallId } = useParams<{ mallId: string }>();
  const location = useLocation();
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const { data: floors } = useFloors(mallId || '');

  // Mock mall data for now
  const mall = {
    id: mallId,
    name: 'Central Rama 3',
  };

  const isActive = (path: string) => {
    return location.pathname.includes(path);
  };

  const getCurrentFloor = () => {
    const floorMatch = location.pathname.match(/\/floors\/(.+)/);
    return floorMatch ? floorMatch[1] : 'all';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Navigation */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900" aria-label="กลับหน้าแรก">
                <Home className="h-5 w-5" />
                <span className="hidden sm:inline">หน้าหลัก</span>
              </Link>
              
              <div className="hidden sm:block">
                <span className="text-gray-400">/</span>
              </div>
              
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{mall.name}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to={`/${mallId}/explore`}>
                <Button
                  variant={isActive('/explore') ? 'primary' : 'ghost'}
                  size="sm"
                  leftIcon={<Search className="h-4 w-4" />}
                  aria-label="สำรวจร้านค้าในห้างสรรพสินค้า"
                >
                  <span className="hidden sm:inline">สำรวจ</span>
                </Button>
              </Link>
              
              <Link to={`/${mallId}/favorites`}>
                <Button
                  variant={isActive('/favorites') ? 'primary' : 'ghost'}
                  size="sm"
                  leftIcon={<Heart className="h-4 w-4" />}
                  aria-label="ดูร้านค้าที่โปรด"
                >
                  <span className="hidden sm:inline">โปรด</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Floor Picker */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4">
            <Button
              variant={getCurrentFloor() === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedFloor('all')}
              aria-label="แสดงร้านค้าทุกชั้น"
            >
              ทั้งหมด
            </Button>
            {floors.map((floor) => (
              <Link key={floor.id} to={`/${mallId}/floors/${floor.id}`}>
                <Button
                  variant={getCurrentFloor() === floor.id ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFloor(floor.id)}
                  aria-label={`แสดงร้านค้าชั้น ${floor.label}`}
                >
                  {floor.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-50">
        <div className="flex items-center justify-around py-2">
          <Link to={`/${mallId}`} className="flex flex-col items-center p-2" aria-label="หน้าแรก">
            <Home className={`h-5 w-5 ${isActive(`/${mallId}$`) ? 'text-blue-600' : 'text-gray-400'}`} />
            <span className={`text-xs mt-1 ${isActive(`/${mallId}$`) ? 'text-blue-600' : 'text-gray-400'}`}>
              หน้าแรก
            </span>
          </Link>
          
          <Link to={`/${mallId}/explore`} className="flex flex-col items-center p-2" aria-label="สำรวจร้านค้า">
            <Search className={`h-5 w-5 ${isActive('/explore') ? 'text-blue-600' : 'text-gray-400'}`} />
            <span className={`text-xs mt-1 ${isActive('/explore') ? 'text-blue-600' : 'text-gray-400'}`}>
              สำรวจ
            </span>
          </Link>
          
          <Link to={`/${mallId}/floors/G`} className="flex flex-col items-center p-2" aria-label="แผนที่ห้างสรรพสินค้า">
            <MapPin className={`h-5 w-5 ${isActive('/floors') ? 'text-blue-600' : 'text-gray-400'}`} />
            <span className={`text-xs mt-1 ${isActive('/floors') ? 'text-blue-600' : 'text-gray-400'}`}>
              แผนที่
            </span>
          </Link>
          
          <Link to={`/${mallId}/favorites`} className="flex flex-col items-center p-2" aria-label="ร้านค้าที่โปรด">
            <Heart className={`h-5 w-5 ${isActive('/favorites') ? 'text-blue-600' : 'text-gray-400'}`} />
            <span className={`text-xs mt-1 ${isActive('/favorites') ? 'text-blue-600' : 'text-gray-400'}`}>
              โปรด
            </span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="pb-16 lg:pb-0">
        <Outlet />
      </div>
    </div>
  );
};

export default MallLayout;
