import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Building, Store, ChevronRight } from 'lucide-react';

import { useRealtimeMall } from '@/hooks/useRealtimeMalls';
import { useRealtimeStores } from '@/hooks/useRealtimeStores';
import { listFloors } from '@/services/firebase/firestore';
import { Floor } from '@/types/mall-system';
import FadeIn from '@/components/ui/FadeIn';

const MallHome: React.FC = () => {
  const { mallId } = useParams<{ mallId: string }>();
  const navigate = useNavigate();
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time data
  const { mall, loading: mallLoading, error: mallError } = useRealtimeMall(mallId || '');
  const { stores, loading: storesLoading, error: storesError } = useRealtimeStores(mall?.id || '');

  // Load floors
  useEffect(() => {
    const loadFloors = async () => {
      if (!mall?.id) return;
      try {
        const floorsData = await listFloors(mall.id);
        const sortedFloors = floorsData.sort((a, b) => {
          // Custom sort logic if needed, typically handled by DB or simple index
          const order = ['G', 'M', '1', '2', '3', '4', '5', '6', '7', '8'];
          return order.indexOf(a.label) - order.indexOf(b.label);
        });
        setFloors(sortedFloors);
      } catch (err) {
        console.error('Error loading floors:', err);
      }
    };
    loadFloors();
  }, [mall?.id]);

  useEffect(() => {
    setLoading(mallLoading || storesLoading);
    setError(mallError || storesError);
  }, [mallLoading, storesLoading, mallError, storesError]);


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-prompt">กำลังโหลดข้อมูลห้าง...</p>
        </div>
      </div>
    );
  }

  if (error || !mall) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4 font-prompt">{error || 'ไม่พบข้อมูลห้าง'}</p>
          <button onClick={() => navigate('/')} className="text-primary-600 hover:text-primary-700 font-medium font-prompt">
            กลับไปหน้าแรก
          </button>
        </div>
      </div>
    );
  }

  // Filter stores
  const filteredStores = stores.filter(store => {
    const matchesFloor = selectedFloor === 'all' || store.floorId === selectedFloor;
    const matchesSearch = !searchQuery ||
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (store.category && store.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFloor && matchesSearch;
  });

  const getFloorTitle = (label: string) => {
    if (label === 'G') return 'ชั้น G';
    if (label === 'M') return 'ชั้น M';
    return `ชั้น ${label}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between space-x-4">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <MapPin className="w-6 h-6 text-primary-600" />
              </div>
              <div className="hidden sm:block">
                <span className="text-gray-900 font-semibold text-lg font-kanit">HaaNai</span>
                <span className="text-primary-600 font-semibold text-lg font-kanit">Hang</span>
              </div>
            </Link>

            {/* Desktop Floor Filter */}
            <div className="hidden md:flex flex-1 justify-center max-w-xl mx-4">
              <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto no-scrollbar space-x-1">
                <button
                  onClick={() => setSelectedFloor('all')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap font-prompt ${selectedFloor === 'all'
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  ทั้งหมด
                </button>
                {floors.map(floor => (
                  <button
                    key={floor.id}
                    onClick={() => setSelectedFloor(floor.label)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap font-prompt ${selectedFloor === floor.label
                        ? 'bg-white text-primary-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    {getFloorTitle(floor.label)}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              <div className="relative hidden sm:block">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาร้านค้า..."
                  className="pl-9 pr-4 py-2 bg-gray-100 border-none rounded-xl text-sm w-48 focus:w-64 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all font-prompt"
                />
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>

              <Link
                to={`/mall/${mallId}/explore`}
                className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors font-prompt"
              >
                <span>แผนที่</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar (Below Header) */}
        <div className="sm:hidden px-4 pb-3 bg-white border-b">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาร้านค้า..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all font-prompt"
            />
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {/* Mall Hero */}
        <FadeIn delay={0.1}>
          <div className="bg-white rounded-2xl p-6 shadow-sm border mb-6 relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 font-kanit">{mall.displayName}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 font-prompt">
                <div className="flex items-center">
                  <Building className="w-4 h-4 mr-1.5" />
                  <span>{floors.length} ชั้น</span>
                </div>
                <div className="flex items-center">
                  <Store className="w-4 h-4 mr-1.5" />
                  <span>{stores.length} ร้านค้า</span>
                </div>
                <div className="flex items-center text-green-600 font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  เปิดให้บริการ • {mall.hours?.open || '10:00'} - {mall.hours?.close || '22:00'}
                </div>
              </div>
            </div>

            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-primary-50 to-transparent opacity-50" />
          </div>
        </FadeIn>

        {/* Highlight Categories */}
        {stores.length > 0 && (
          <FadeIn delay={0.2}>
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 font-kanit">หมวดหมู่ในห้าง</h2>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(stores.map(s => s.category).filter(Boolean))).slice(0, 8).map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSearchQuery(cat!)}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors font-prompt"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </FadeIn>
        )}

        {/* Stores Grid */}
        <FadeIn delay={0.3}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 font-kanit">
              {selectedFloor === 'all' ? 'ร้านค้าทั้งหมด' : `ร้านค้า ${getFloorTitle(selectedFloor)}`}
            </h2>
            <span className="text-sm text-gray-500 font-prompt">{filteredStores.length} ร้าน</span>
          </div>

          {filteredStores.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStores.map((store) => (
                <div
                  key={store.id}
                  onClick={() => navigate(`/mall/${mallId}/stores/${store.id}`)}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 font-kanit group-hover:text-primary-600 transition-colors">
                        {store.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1 font-prompt">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs mr-2 text-gray-700 font-medium">
                          {getFloorTitle(store.floorId)}
                        </span>
                        <span>{store.category}</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 font-bold group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                      {store.name.charAt(0)}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-sm">
                    <span className="text-green-600 font-medium font-prompt flex items-center">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                      เปิดอยู่
                    </span>
                    <span className="text-gray-400 flex items-center font-prompt group-hover:text-primary-600 transition-colors">
                      ดูรายละเอียด <ChevronRight className="w-4 h-4 ml-1" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1 font-kanit">ไม่พบร้านค้า</h3>
              <p className="text-gray-500 font-prompt">
                ลองเปลี่ยนคำค้นหาหรือเลือกชั้นอื่นดูนะครับ
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedFloor('all'); }}
                className="mt-4 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 font-prompt"
              >
                ล้างตัวกรอง
              </button>
            </div>
          )}
        </FadeIn>
      </main>

      {/* Mobile Floor Floating Filter */}
      <div className="fixed bottom-6 left-4 right-4 z-40 md:hidden">
        <div className="bg-white/90 backdrop-blur-md shadow-lg border rounded-2xl p-2 flex overflow-x-auto no-scrollbar space-x-2">
          <button
            onClick={() => setSelectedFloor('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap font-prompt ${selectedFloor === 'all'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 bg-transparent'
              }`}
          >
            ทั้งหมด
          </button>
          {floors.map(floor => (
            <button
              key={floor.id}
              onClick={() => setSelectedFloor(floor.label)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap font-prompt ${selectedFloor === floor.label
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 bg-transparent'
                }`}
            >
              {getFloorTitle(floor.label)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MallHome;
