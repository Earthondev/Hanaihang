import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Building2, Search, Filter, X, Heart, MapPin, Navigation, Phone, Share2, ChevronLeft, LayoutGrid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useRealtimeMall } from '../hooks/useRealtimeMalls';
import { useRealtimeStores } from '../hooks/useRealtimeStores';
import { listFloors } from '../services/firebase/firestore';
import { Store, Floor } from '../types/mall-system';
import { ErrorState } from '@/ui';
import MallStatusBadge from '../components/ui/MallStatusBadge';
import SEO from '@/components/SEO';

interface FilterState {
  categories: string[];
  floors: string[];
  openNow: boolean;
  search: string;
}

export default function MallDetail() {
  const { mallId } = useParams<{ mallId: string }>();
  const navigate = useNavigate();

  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [filters, setFilters] = useState<FilterState>({
    categories: ['all'],
    floors: ['all'],
    openNow: false,
    search: '',
  });

  const {
    mall,
    loading: mallLoading,
    error: mallError,
  } = useRealtimeMall(mallId || '');
  const {
    stores,
    loading: storesLoading,
    error: storesError,
  } = useRealtimeStores(mall?.id || '');

  useEffect(() => {
    const loadFloors = async () => {
      if (!mall?.id) return;
      try {
        const floorsData = await listFloors(mall.id);
        setFloors(floorsData);
      } catch (err) {
        console.error('❌ Error loading floors:', err);
      }
    };
    loadFloors();
  }, [mall?.id]);

  const loading = mallLoading || storesLoading;
  const error = mallError || storesError;

  const filteredStores = useMemo(() => {
    if (!stores.length) return [];
    return stores.filter(store => {
      if (!filters.categories.includes('all') && !filters.categories.includes(store.category || '')) return false;
      if (!filters.floors.includes('all') && !filters.floors.includes(store.floorId || '')) return false;
      if (filters.openNow && store.status !== 'Active') return false;
      if (filters.search && !store.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [stores, filters]);

  const getFloorLabel = (floorId: string) => {
    const floor = floors.find(f => f.id === floorId);
    return floor?.label || floorId;
  };

  const handleFloorSelect = (floor: string) => {
    setSelectedFloor(floor);
    setFilters(prev => ({ ...prev, floors: [floor] }));
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    setFilters(prev => {
      if (category === 'all') return { ...prev, categories: checked ? ['all'] : [] };
      const newCategories = checked
        ? [...prev.categories.filter(c => c !== 'all'), category]
        : prev.categories.filter(c => c !== category);
      return { ...prev, categories: newCategories.length ? newCategories : ['all'] };
    });
  };

  const clearFilters = () => {
    setFilters({ categories: ['all'], floors: ['all'], openNow: false, search: '' });
    setSelectedFloor('all');
  };

  const categories = useMemo(() => {
    const cats = stores.map(s => s.category).filter(Boolean) as string[];
    return [...new Set(cats)];
  }, [stores]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfdfd] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-primary/20 border-t-primary"></div>
        <p className="text-gray-500 mt-6 font-prompt font-medium">กำลังโหลดข้อมูลห้าง...</p>
      </div>
    );
  }

  if (error || !mall) {
    return <ErrorState message={error || 'ไม่พบข้อมูลห้าง'} onRetry={() => navigate('/')} />;
  }

  return (
    <div className="min-h-screen bg-[#fcfdfd]">
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => navigate('/')}
              className="group flex items-center space-x-2 text-gray-500 hover:text-gray-900 transition-colors"
            >
              <div className="p-2 rounded-xl group-hover:bg-gray-100 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </div>
              <span className="font-semibold hidden sm:inline font-prompt text-sm">กลับหน้าหลัก</span>
            </button>

            <div className="flex-1 max-w-2xl relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder={`ค้นหาร้านค้าใน ${mall.displayName}...`}
                value={filters.search}
                onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full bg-gray-100 border-transparent focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/20 rounded-2xl pl-11 pr-4 py-2.5 text-sm transition-all font-prompt outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button onClick={() => { }} className="p-2.5 rounded-xl text-gray-400 hover:text-primary hover:bg-primary/5 transition-all">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Content Section */}
      <section className="bg-white border-b border-gray-100 pt-8 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-primary/5 rounded-[40px] flex items-center justify-center flex-shrink-0">
              {mall.logoUrl ? (
                <img src={mall.logoUrl} alt={mall.displayName} className="w-20 h-20 sm:w-28 sm:h-28 object-contain" />
              ) : (
                <Building2 className="w-10 h-10 sm:w-14 sm:h-14 text-primary" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 font-kanit">{mall.displayName}</h1>
                <MallStatusBadge mall={mall} size="sm" />
              </div>
              <p className="text-gray-500 font-prompt flex items-center mb-6">
                <MapPin className="w-4 h-4 mr-2 text-primary" />
                {mall.address || mall.district}
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${mall.coords?.lat},${mall.coords?.lng}`, '_blank')}
                  className="inline-flex items-center space-x-2 bg-gray-900 text-white px-5 py-2.5 rounded-2xl text-sm font-semibold hover:bg-gray-800 transition-all font-prompt shadow-lg shadow-gray-200"
                >
                  <Navigation className="w-4 h-4" />
                  <span>นำทาง</span>
                </button>
                {mall.contact?.phone && (
                  <a href={`tel:${mall.contact.phone}`} className="inline-flex items-center space-x-2 bg-white border border-gray-200 px-5 py-2.5 rounded-2xl text-sm font-semibold hover:bg-gray-50 transition-all font-prompt">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{mall.contact.phone}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Filter and Results Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="sticky top-28 space-y-8">
              {/* Floor Selection */}
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 font-kanit">ชั้นทั้งหมด</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleFloorSelect('all')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all font-prompt ${selectedFloor === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white border border-gray-100 text-gray-500 hover:border-primary/30'}`}
                  >
                    ทั้งหมด
                  </button>
                  {floors.map(floor => (
                    <button
                      key={floor.id}
                      onClick={() => handleFloorSelect(floor.id || floor.label)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all font-prompt ${selectedFloor === (floor.id || floor.label) ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white border border-gray-100 text-gray-500 hover:border-primary/30'}`}
                    >
                      {floor.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 font-kanit">หมวดหมู่ร้านค้า</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => handleCategoryChange('all', true)}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all font-prompt ${filters.categories.includes('all') ? 'bg-primary/5 text-primary' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${filters.categories.includes('all') ? 'bg-primary' : 'bg-gray-200'}`}></div>
                    <span className="text-sm font-medium">ทั้งหมด</span>
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => handleCategoryChange(cat, !filters.categories.includes(cat))}
                      className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all font-prompt ${filters.categories.includes(cat) ? 'bg-primary/5 text-primary' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${filters.categories.includes(cat) ? 'bg-primary' : 'bg-gray-200'}`}></div>
                      <span className="text-sm font-medium">{cat}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Toggle */}
              <div className="pt-6 border-t border-gray-100">
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm font-bold text-gray-900 font-kanit">เฉพาะร้านที่เปิดตอนนี้</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={filters.openNow}
                      onChange={e => setFilters(prev => ({ ...prev, openNow: e.target.checked }))}
                    />
                    <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-5"></div>
                  </div>
                </label>
              </div>
            </div>
          </aside>

          {/* Results Area */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 font-kanit">
                ร้านค้าทั้งหมด <span className="text-gray-400 ml-2 font-prompt text-lg font-normal">{filteredStores.length}</span>
              </h2>

              <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}>
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}>
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              {filteredStores.length > 0 ? (
                <motion.div
                  layout
                  className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}
                >
                  {filteredStores.map((store, idx) => (
                    <StoreCard key={store.id} store={store} floorLabel={getFloorLabel(store.floorId || '')} index={idx} viewMode={viewMode} />
                  ))}
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 bg-white rounded-[40px] border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 font-kanit">ไม่พบร้านค้าที่ต้องการ</h3>
                  <p className="text-gray-500 font-prompt mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรองใหม่อีกครั้ง</p>
                  <button onClick={clearFilters} className="mt-6 text-primary font-bold font-prompt border-b-2 border-primary/20 hover:border-primary transition-all">ล้างตัวกรองทั้งหมด</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

function StoreCard({ store, floorLabel, index, viewMode }: { store: Store; floorLabel: string; index: number; viewMode: 'grid' | 'list' }) {
  const isGrid = viewMode === 'grid';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`group bg-white rounded-[32px] border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 ${!isGrid && 'flex items-center'}`}
    >
      <div className={`${isGrid ? 'aspect-[1.5] w-full' : 'w-32 sm:w-48 aspect-square'} bg-gray-50 flex items-center justify-center relative overflow-hidden flex-shrink-0`}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className={`w-12 h-12 ${isGrid ? 'sm:w-16 sm:h-16' : 'sm:w-20 sm:h-20'} bg-white shadow-xl rounded-2xl sm:rounded-[24px] flex items-center justify-center text-xl sm:text-2xl font-bold font-kanit text-gray-400 group-hover:scale-110 group-hover:text-primary transition-all duration-500`}>
          {store.name.charAt(0).toUpperCase()}
        </div>
        {store.status === 'Active' && isGrid && (
          <div className="absolute top-4 left-4 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center space-x-1 uppercase tracking-wider">
            <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>
            <span>Open</span>
          </div>
        )}
      </div>

      <div className="p-6 flex-1">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1 font-kanit">
              {store.category} • ชั้น {floorLabel}
            </div>
            <h3 className="text-xl font-bold text-gray-900 font-kanit group-hover:text-primary transition-colors leading-tight">
              {store.name}
            </h3>
          </div>
          <button className="text-gray-300 hover:text-red-500 transition-colors">
            <Heart className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button className="flex-1 bg-gray-50 hover:bg-primary hover:text-white text-gray-600 px-4 py-2.5 rounded-xl text-xs font-bold font-prompt transition-all">ดูรายละเอียด</button>
          <button
            onClick={() => window.open(`https://www.google.com/maps?q=${store.location?.lat},${store.location?.lng}`, '_blank')}
            className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-400 rounded-xl transition-all"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
