import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Building, Store as StoreIcon, ChevronRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useRealtimeMall } from '@/hooks/useRealtimeMalls';
import { useRealtimeStores } from '@/hooks/useRealtimeStores';
import { listFloors } from '@/services/firebase/firestore';
import { Floor, Store } from '@/types/mall-system';
import FadeIn from '@/components/ui/FadeIn';
import SEO from '@/components/SEO';

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
          // Custom sort logic
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
      <div className="bg-[#fcfdfd] font-sans min-h-screen overflow-hidden">
        {/* Skeleton Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="h-6 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </header>

        {/* Skeleton Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[20px] border border-gray-100 p-4 h-32 flex flex-col justify-between animate-pulse">
                <div className="flex justify-between">
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                </div>
                <div className="h-3 w-20 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
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
  const filteredStores = stores.filter((store: Store) => {
    const matchesFloor = selectedFloor === 'all' || store.floorId === selectedFloor;
    const matchesSearch = !searchQuery ||
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (store.category && store.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFloor && matchesSearch;
  });

  const getFloorTitle = (label: string) => {
    if (label === 'G') return 'ชั้น G';
    if (label === 'M') return 'ชั้น M';
    // If it already says "ชั้น", just return it
    if (label.startsWith('ชั้น')) return label;
    return `ชั้น ${label}`;
  };

  return (
    <div className="min-h-screen bg-[#fcfdfd]">
      <SEO
        title={`ร้านค้าใน ${mall.displayName}`}
        description={`ค้นหารายชื่อร้านค้าทั้งหมดใน ${mall.displayName} แบ่งตามชั้นและหมวดหมู่`}
      />

      {/* Glass Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900 font-kanit leading-none">{mall.displayName}</h1>
                <p className="text-xs text-gray-500 font-prompt mt-0.5">Directory</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative hidden sm:block group">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาร้านค้า..."
                  className="pl-9 pr-4 py-2 bg-gray-100 border-none rounded-xl text-sm w-48 focus:w-64 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-prompt outline-none"
                />
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2 group-focus-within:text-primary transition-colors" />
              </div>

              <Link
                to={`/malls/${mallId}`}
                className="p-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
              >
                <MapPin className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Mobile Search Bar (integrated in header) */}
          <div className="sm:hidden mt-3 pb-1">
            <div className="relative group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาร้านค้า..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-prompt outline-none"
              />
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 transform -translate-y-1/2 group-focus-within:text-primary transition-colors" />
            </div>
          </div>
        </div>

        {/* Floor Filter Scroller */}
        <div className="px-4 pb-0 overflow-x-auto no-scrollbar border-t border-gray-50">
          <div className="flex space-x-6 py-3 min-w-max mx-auto max-w-7xl">
            <button
              onClick={() => setSelectedFloor('all')}
              className={`relative pb-1 text-sm font-medium transition-all font-prompt ${selectedFloor === 'all' ? 'text-primary' : 'text-gray-500 hover:text-gray-900'}`}
            >
              ทั้งหมด
              {selectedFloor === 'all' && <motion.div layoutId="underline" className="absolute left-0 right-0 bottom-[-13px] h-[3px] bg-primary rounded-t-full" />}
            </button>
            {floors.map(floor => (
              <button
                key={floor.id}
                onClick={() => setSelectedFloor(floor.label)}
                className={`relative pb-1 text-sm font-medium transition-all font-prompt ${selectedFloor === floor.label ? 'text-primary' : 'text-gray-500 hover:text-gray-900'}`}
              >
                {getFloorTitle(floor.label)}
                {selectedFloor === floor.label && <motion.div layoutId="underline" className="absolute left-0 right-0 bottom-[-13px] h-[3px] bg-primary rounded-t-full" />}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {/* Highlight Categories (Pills) */}
        {stores.length > 0 && !searchQuery && (
          <div className="mb-8 overflow-x-auto no-scrollbar pb-2">
            <div className="flex space-x-2 min-w-max">
              {Array.from(new Set(stores.map((s: Store) => s.category).filter(Boolean))).slice(0, 10).map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setSearchQuery(cat!)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all font-prompt shadow-sm"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stores Grid */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 font-kanit">
            {selectedFloor === 'all' ? 'ร้านค้าทั้งหมด' : `ร้านค้า ${getFloorTitle(selectedFloor)}`}
          </h2>
          <span className="text-sm font-medium bg-gray-100 text-gray-500 px-2 py-1 rounded-lg font-prompt">{filteredStores.length} ร้าน</span>
        </div>

        <AnimatePresence mode="popLayout">
          {filteredStores.length > 0 ? (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStores.map((store: Store) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  key={store.id}
                  onClick={() => navigate(`/mall/${mallId}/stores/${store.id}`)}
                  className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:opacity-20 transition-opacity">
                    <StoreIcon className="w-16 h-16 text-primary rotate-12" />
                  </div>

                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="bg-primary/5 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-kanit">
                          {getFloorTitle(store.floorId)}
                        </span>
                        <span className="text-[10px] text-gray-400 font-prompt">{store.category}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 font-kanit group-hover:text-primary transition-colors line-clamp-1">
                        {store.name}
                      </h3>
                    </div>
                    <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 font-bold group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                      {store.name.charAt(0)}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-dashed border-gray-100 flex items-center justify-between text-sm relative z-10">
                    <span className="text-green-600 font-bold text-xs font-prompt flex items-center bg-green-50 px-2 py-1 rounded-lg">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                      OPEN
                    </span>
                    <span className="text-gray-400 flex items-center text-xs font-prompt font-medium group-hover:translate-x-1 transition-transform">
                      ดูรายละเอียด <ChevronRight className="w-3 h-3 ml-1" />
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white rounded-[32px] border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1 font-kanit">ไม่พบร้านค้าที่คุณค้นหา</h3>
              <p className="text-gray-500 font-prompt mb-6">ลองเปลี่ยนคำค้นหาหรือเลือกชั้นอื่นดูนะครับ</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedFloor('all'); }}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all font-prompt shadow-lg shadow-gray-200"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default MallHome;
