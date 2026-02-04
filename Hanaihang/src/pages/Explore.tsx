import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Store as StoreIcon,
  X,
  Check
} from 'lucide-react';

import { useRealtimeMall } from '@/hooks/useRealtimeMalls';
import { useRealtimeStores } from '@/hooks/useRealtimeStores';
import { listFloors } from '@/services/firebase/firestore';
import { Store, Floor } from '@/types/mall-system';
import FadeIn from '@/components/ui/FadeIn';

const Explore: React.FC = () => {
  const { mallId } = useParams<{ mallId: string }>();
  const navigate = useNavigate();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all']);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [floors, setFloors] = useState<Floor[]>([]);

  const storesPerPage = 9;

  // Real-time Data
  const { mall, loading: mallLoading, error: mallError } = useRealtimeMall(mallId || '');
  const { stores, loading: storesLoading, error: storesError } = useRealtimeStores(mall?.id || '');

  const loading = mallLoading || storesLoading;
  const error = mallError || storesError;

  // Load Floors
  useEffect(() => {
    const loadFloors = async () => {
      if (!mall?.id) return;
      try {
        const floorsData = await listFloors(mall.id);
        const sortedFloors = floorsData.sort((a, b) => {
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

  // Categories Definition
  const categories = [
    { id: 'all', name: 'ทั้งหมด' },
    { id: 'food', name: 'อาหารและเครื่องดื่ม' },
    { id: 'fashion', name: 'แฟชั่น' },
    { id: 'beauty', name: 'ความงาม' },
    { id: 'tech', name: 'ไอทีและอิเล็กทรอนิกส์' },
    { id: 'service', name: 'บริการ' },
    { id: 'bank', name: 'ธนาคาร' },
    { id: 'entertainment', name: 'บันเทิง' },
  ];

  // Helper: Get generic category key from store category string
  const getCategoryKey = (storeCategory: string = '') => {
    const cat = storeCategory.toLowerCase();
    if (cat.includes('food') || cat.includes('อาหาร') || cat.includes('café') || cat.includes('drink')) return 'food';
    if (cat.includes('fashion') || cat.includes('clo') || cat.includes('เสื้อ')) return 'fashion';
    if (cat.includes('beauty') || cat.includes('cosmetic') || cat.includes('สวย')) return 'beauty';
    if (cat.includes('tech') || cat.includes('mobile') || cat.includes('gadget')) return 'tech';
    if (cat.includes('service') || cat.includes('บริการ')) return 'service';
    if (cat.includes('bank') || cat.includes('ธนาคาร')) return 'bank';
    if (cat.includes('cinema') || cat.includes('movie') || cat.includes('บันเทิง')) return 'entertainment';
    return 'other';
  };

  // Helper: Check open status
  const isStoreOpen = (store: Store) => {
    if (!store.hours) return true; // Default to true if no hours
    try {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();

      let openTimeStr = '10:00';
      let closeTimeStr = '22:00';

      if (store.hours.includes('-')) {
        [openTimeStr, closeTimeStr] = store.hours.split('-');
      } else {
        // Try to parse if object
        // fallback
      }

      const [oh, om] = openTimeStr.split(':').map(Number);
      const [ch, cm] = closeTimeStr.split(':').map(Number);

      const openMins = oh * 60 + (om || 0);
      const closeMins = ch * 60 + (cm || 0);

      if (closeMins < openMins) {
        // Cross midnight
        return currentMins >= openMins || currentMins <= closeMins;
      }
      return currentMins >= openMins && currentMins <= closeMins;
    } catch (e) {
      return true;
    }
  };

  // Filter Logic
  const filteredStores = stores.filter(store => {
    // 1. Search
    const searchMatch = !searchQuery.trim() ||
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.category?.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Floor
    const floorMatch = selectedFloor === 'all' || store.floorId === selectedFloor;

    // 3. Category
    const storeCatKey = getCategoryKey(store.category);
    const catMatch = selectedCategories.includes('all') || selectedCategories.some(c => c === storeCatKey);

    // 4. Open Now
    const openMatch = !openNowOnly || isStoreOpen(store);

    return searchMatch && floorMatch && catMatch && openMatch;
  });

  // Sort Logic
  const sortedStores = [...filteredStores].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name, 'th');
    if (sortBy === 'floor') return a.floorId.localeCompare(b.floorId);
    if (sortBy === 'category') return (a.category || '').localeCompare(b.category || '');
    return 0;
  });

  // Pagination Logic
  const totalPages = Math.ceil(sortedStores.length / storesPerPage);
  const displayedStores = sortedStores.slice((currentPage - 1) * storesPerPage, currentPage * storesPerPage);

  const handleCategoryToggle = (id: string) => {
    if (id === 'all') {
      setSelectedCategories(['all']);
    } else {
      setSelectedCategories(prev => {
        const withoutAll = prev.filter(c => c !== 'all');
        if (withoutAll.includes(id)) {
          const next = withoutAll.filter(c => c !== id);
          return next.length === 0 ? ['all'] : next;
        } else {
          return [...withoutAll, id];
        }
      });
    }
    setCurrentPage(1);
  };

  const getStoreColor = (name: string) => {
    const colors = ['bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-purple-100 text-purple-800', 'bg-orange-100 text-orange-800', 'bg-pink-100 text-pink-800'];
    return colors[name.length % colors.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-prompt">กำลังโหลดข้อมูลร้านค้า...</p>
        </div>
      </div>
    );
  }

  if (error || !mall) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4 font-prompt">ไม่พบข้อมูลห้าง ({error})</p>
          <button onClick={() => navigate('/')} className="text-primary-600 hover:underline">กลับหน้าหลัก</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-prompt">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to={`/mall/${mallId}`} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900 font-kanit">ค้นหาร้านค้า</h1>
            </div>

            {/* Desktop Search */}
            <div className="hidden md:block w-96 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อร้าน หรือหมวดหมู่..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>

            <button
              onClick={() => setShowMobileFilters(true)}
              className="md:hidden p-2 text-gray-600 relative"
            >
              <Filter className="w-6 h-6" />
              {(selectedCategories.length > 1 || selectedFloor !== 'all' || openNowOnly) && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden mt-4 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อร้าน..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden lg:block w-72 flex-shrink-0 space-y-8">
            {/* Filter Box */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Filter className="w-4 h-4" /> ตัวกรอง
                </h2>
                {(selectedFloor !== 'all' || !selectedCategories.includes('all') || openNowOnly) && (
                  <button
                    onClick={() => {
                      setSelectedFloor('all');
                      setSelectedCategories(['all']);
                      setOpenNowOnly(false);
                    }}
                    className="text-xs text-red-500 hover:underline"
                  >
                    ล้างทั้งหมด
                  </button>
                )}
              </div>

              {/* Open Now */}
              <div className="mb-6 pb-6 border-b border-gray-100">
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-gray-700 font-medium group-hover:text-primary-600 transition-colors">เปิดอยู่ตอนนี้</span>
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${openNowOnly ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${openNowOnly ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                  <input type="checkbox" checked={openNowOnly} onChange={(e) => setOpenNowOnly(e.target.checked)} className="hidden" />
                </label>
              </div>

              {/* Floor Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">ชั้น</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedFloor('all')}
                    className={`py-2 px-1 text-sm rounded-lg border transition-all ${selectedFloor === 'all' ? 'border-primary-500 bg-primary-50 text-primary-700 font-bold' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    All
                  </button>
                  {floors.map(floor => (
                    <button
                      key={floor.id}
                      onClick={() => setSelectedFloor(floor.label)}
                      className={`py-2 px-1 text-sm rounded-lg border transition-all ${selectedFloor === floor.label ? 'border-primary-500 bg-primary-50 text-primary-700 font-bold' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      {floor.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories Filter */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">หมวดหมู่</h3>
                <div className="space-y-2">
                  {categories.map(cat => {
                    const isSelected = selectedCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryToggle(cat.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${isSelected ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                        <span>{cat.name}</span>
                        {isSelected && <Check className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* Results Area */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <h2 className="text-gray-900 font-medium">
                ค้นพบ <span className="font-bold text-primary-600">{filteredStores.length}</span> ร้านค้า
              </h2>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">เรียงตาม:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="name">ชื่อร้าน (ก-ฮ)</option>
                  <option value="floor">ชั้น (ล่าง-บน)</option>
                  <option value="category">หมวดหมู่</option>
                </select>
              </div>
            </div>

            {/* Grid */}
            <FadeIn>
              {displayedStores.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedStores.map((store) => (
                    <Link
                      key={store.id}
                      to={`/mall/${mallId}/stores/${store.id}`}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-primary-200 transition-all duration-300 group flex flex-col"
                    >
                      <div className="h-32 bg-gray-50 relative overflow-hidden">
                        {/* Mock Cover Image - In real app, use store.coverImage */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${getStoreColor(store.name || '')} opacity-10 group-hover:opacity-20 transition-opacity`} />

                        {/* Floor Tag */}
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-700 shadow-sm border border-gray-100">
                          ชั้น {store.floorId}
                        </div>

                        {/* Store Initials/Icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-4xl font-black text-gray-200 group-hover:text-primary-200 transition-colors select-none">
                            {(store.name || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-gray-900 text-lg line-clamp-1 group-hover:text-primary-600 transition-colors">
                            {store.name}
                          </h3>
                        </div>

                        <p className="text-sm text-gray-500 mb-4 line-clamp-1">
                          {store.category || 'ร้านค้าทั่วไป'}
                        </p>

                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                          <div className={`flex items-center text-xs font-medium ${isStoreOpen(store) ? 'text-green-600' : 'text-red-500'}`}>
                            <span className={`w-2 h-2 rounded-full mr-1.5 ${isStoreOpen(store) ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            {isStoreOpen(store) ? 'เปิดอยู่' : 'ปิดแล้ว'}
                          </div>
                          <span className="text-xs text-primary-600 font-medium group-hover:underline">ดูรายละเอียด</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <StoreIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">ไม่พบร้านค้า</h3>
                  <p className="text-gray-500 mb-6">ลองปรับตัวกรองหรือคำค้นหาใหม่ดูนะครับ</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedFloor('all');
                      setSelectedCategories(['all']);
                      setOpenNowOnly(false);
                    }}
                    className="px-6 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
                  >
                    ล้างตัวกรองทั้งหมด
                  </button>
                </div>
              )}
            </FadeIn>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex justify-center space-x-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-lg border font-medium transition-colors ${currentPage === i + 1 ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Filter Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute inset-y-0 right-0 w-80 bg-white shadow-2xl p-6 flex flex-col h-full transform transition-transform duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-kanit">ตัวกรอง</h2>
              <button onClick={() => setShowMobileFilters(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-8 pr-2">
              {/* Duplicate content from sidebar filters for mobile */}
              {/* Open Now */}
              <div className="border-b border-gray-100 pb-6">
                <label className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">เปิดอยู่ตอนนี้</span>
                  <input type="checkbox" checked={openNowOnly} onChange={e => setOpenNowOnly(e.target.checked)} className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500" />
                </label>
              </div>

              {/* Floors */}
              <div>
                <h3 className="font-semibold mb-3 text-gray-900">ชั้น</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setSelectedFloor('all')} className={`py-2 text-sm border rounded ${selectedFloor === 'all' ? 'bg-primary-50 border-primary-500 text-primary-700 font-bold' : 'text-gray-600'}`}>All</button>
                  {floors.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFloor(f.label)}
                      className={`py-2 text-sm border rounded ${selectedFloor === f.label ? 'bg-primary-50 border-primary-500 text-primary-700 font-bold' : 'text-gray-600'}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="font-semibold mb-3 text-gray-900">หมวดหมู่</h3>
                <div className="space-y-3">
                  {categories.map(cat => (
                    <label key={cat.id} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.id)}
                        onChange={() => handleCategoryToggle(cat.id)}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-gray-700">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t mt-auto">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold text-lg hover:bg-primary-700 transition-colors"
              >
                ดูผลลัพธ์ ({filteredStores.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Explore;
