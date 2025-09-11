import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, Search, Filter, X, Heart } from 'lucide-react';

import { useRealtimeMall } from '../hooks/useRealtimeMalls';
import { useRealtimeStores } from '../hooks/useRealtimeStores';
import { listFloors } from '../services/firebase/firestore';
import { Store, Floor } from '../types/mall-system';

interface FilterState {
  categories: string[];
  floors: string[];
  openNow: boolean;
  search: string;
}

export default function MallDetail() {
  const { mallId } = useParams<{ mallId: string }>();
  const navigate = useNavigate();
  // const { push } = useToast();

  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    categories: ['all'],
    floors: ['all'],
    openNow: false,
    search: '',
  });

  // ใช้ real-time data สำหรับห้างและร้าน
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

  // Load floors data
  useEffect(() => {
    const loadFloors = async () => {
      if (!mall?.id) return;

      try {
        console.log('🔍 Loading floors for mall:', mall.id);
        const floorsData = await listFloors(mall.id);
        console.log('✅ Floors loaded:', floorsData);
        setFloors(floorsData);
      } catch (err) {
        console.error('❌ Error loading floors:', err);
      }
    };

    loadFloors();
  }, [mall?.id]);

  // Update loading and error states
  const loading = mallLoading || storesLoading;
  const error = mallError || storesError;

  // Filter stores based on current filters
  const filteredStores = useMemo(() => {
    if (!stores.length) return [];

    return stores.filter(store => {
      // Category filter
      if (
        !filters.categories.includes('all') &&
        !filters.categories.includes(store.category || '')
      ) {
        return false;
      }

      // Floor filter
      if (
        !filters.floors.includes('all') &&
        !filters.floors.includes(store.floorId || '')
      ) {
        return false;
      }

      // Open now filter
      if (filters.openNow && store.status !== 'Active') {
        return false;
      }

      // Search filter
      if (
        filters.search &&
        !store.name.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [stores, filters]);

  // Get floor label by ID
  const getFloorLabel = (floorId: string) => {
    const floor = floors.find(f => f.id === floorId);
    return floor?.label || floorId;
  };

  // Handle floor selection
  const handleFloorSelect = (floor: string) => {
    setSelectedFloor(floor);
    setFilters(prev => ({
      ...prev,
      floors: [floor],
    }));
  };

  // Handle category filter
  const handleCategoryChange = (category: string, checked: boolean) => {
    setFilters(prev => {
      if (category === 'all') {
        return { ...prev, categories: checked ? ['all'] : [] };
      }

      const newCategories = checked
        ? [...prev.categories.filter(c => c !== 'all'), category]
        : prev.categories.filter(c => c !== category);

      return {
        ...prev,
        categories: newCategories.length ? newCategories : ['all'],
      };
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      categories: ['all'],
      floors: ['all'],
      openNow: false,
      search: '',
    });
    setSelectedFloor('all');
  };

  // Get unique categories from stores
  const categories = useMemo(() => {
    const cats = stores.map(s => s.category).filter(Boolean) as string[];
    return [...new Set(cats)];
  }, [stores]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูลห้าง...</p>
        </div>
      </div>
    );
  }

  if (error || !mall) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            ไม่พบข้อมูลห้าง
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between space-x-6">
            {/* Logo / Back */}
            <div className="flex-shrink-0">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-lg font-semibold">
                  <span className="text-gray-900">HaaNai</span>
                  <span className="text-green-600">Hang</span>
                </div>
              </button>
            </div>

            {/* Floor Picker (Desktop) */}
            <div className="hidden md:flex flex-1 justify-center max-w-md">
              <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-xl overflow-x-auto">
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    selectedFloor === 'all'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-600 hover:bg-white hover:text-green-600'
                  }`}
                  onClick={() => handleFloorSelect('all')}
                >
                  ทั้งหมด
                </button>
                {floors.map(floor => (
                  <button
                    key={floor.id || floor.label}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      selectedFloor === floor.id
                        ? 'bg-green-600 text-white'
                        : 'text-gray-600 hover:bg-white hover:text-green-600'
                    }`}
                    onClick={() => handleFloorSelect(floor.id || floor.label)}
                  >
                    ชั้น {floor.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Box */}
            <div className="flex-shrink-0 w-80 lg:w-96 relative">
              <input
                type="text"
                placeholder="ค้นหาร้านได้ตลอดเวลา..."
                value={filters.search}
                onChange={e =>
                  setFilters(prev => ({ ...prev, search: e.target.value }))
                }
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none text-gray-900 placeholder-gray-500 transition-all"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                ตัวกรอง
              </h2>

              {/* Category Filter */}
              <div className="mb-8">
                <h3 className="font-medium text-gray-900 mb-4">หมวดหมู่</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-200"
                      checked={filters.categories.includes('all')}
                      onChange={e =>
                        handleCategoryChange('all', e.target.checked)
                      }
                    />
                    <span className="text-gray-600">ทั้งหมด</span>
                  </label>
                  {categories.map(category => (
                    <label
                      key={category}
                      className="flex items-center space-x-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-200"
                        checked={filters.categories.includes(category)}
                        onChange={e =>
                          handleCategoryChange(category, e.target.checked)
                        }
                      />
                      <span className="text-gray-600">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Floor Filter */}
              <div className="mb-8">
                <h3 className="font-medium text-gray-900 mb-4">ชั้น</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      filters.floors.includes('all')
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
                    }`}
                    onClick={() =>
                      setFilters(prev => ({ ...prev, floors: ['all'] }))
                    }
                  >
                    ทั้งหมด
                  </button>
                  {floors.map(floor => (
                    <button
                      key={floor.id || floor.label}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        filters.floors.includes(floor.id || floor.label)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
                      }`}
                      onClick={() =>
                        setFilters(prev => ({
                          ...prev,
                          floors: [floor.id || floor.label],
                        }))
                      }
                    >
                      {floor.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Open Now Toggle */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">เปิดตอนนี้</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={filters.openNow}
                      onChange={e =>
                        setFilters(prev => ({
                          ...prev,
                          openNow: e.target.checked,
                        }))
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              </div>

              {/* Clear Filters */}
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors"
              >
                ล้างตัวกรอง
              </button>
            </div>
          </aside>

          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-600">ตัวกรอง</span>
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Mall Info Section */}
            <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Mall Basic Info */}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {mall.displayName || mall.name}
                  </h1>
                  {mall.address && (
                    <p className="text-gray-600 mb-4 flex items-start">
                      <span className="mr-2">📍</span>
                      {mall.address}
                    </p>
                  )}

                  {/* Mall Hours */}
                  {(mall.openTime || mall.hours) && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        เวลาเปิด-ปิด
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {(mall.openTime || mall.hours?.open) && (
                          <div className="flex items-center text-gray-600">
                            <span className="mr-2">🕐</span>
                            เปิด: {mall.openTime || mall.hours?.open}
                          </div>
                        )}
                        {(mall.closeTime || mall.hours?.close) && (
                          <div className="flex items-center text-gray-600">
                            <span className="mr-2">🕐</span>
                            ปิด: {mall.closeTime || mall.hours?.close}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  {mall.contact?.phone && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        ข้อมูลติดต่อ
                      </h3>
                      <div className="flex items-center text-gray-600">
                        <span className="mr-2">📞</span>
                        {mall.contact.phone}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-3 lg:w-80">
                  {/* Google Maps Button */}
                  {mall.coords && (
                    <button
                      onClick={() => {
                        const { lat, lng } = mall.coords!;
                        const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                        window.open(googleMapsUrl, '_blank');
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <span>🗺️</span>
                      <span>ดูตำแหน่งบน Google Maps</span>
                    </button>
                  )}

                  {/* Directions Button */}
                  {mall.coords && (
                    <button
                      onClick={() => {
                        const { lat, lng } = mall.coords!;
                        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                        window.open(directionsUrl, '_blank');
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <span>🧭</span>
                      <span>เส้นทางไปยังห้าง</span>
                    </button>
                  )}

                  {/* Share Button */}
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: mall.displayName || mall.name,
                          text: `ห้าง ${mall.displayName || mall.name}`,
                          url: window.location.href,
                        });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        // You can add a toast notification here
                      }
                    }}
                    className="w-full border border-gray-300 text-gray-600 hover:bg-gray-50 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>📤</span>
                    <span>แชร์ห้างนี้</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                  สำรวจร้าน
                </h1>
                <p className="text-gray-600">
                  พบ{' '}
                  <span className="font-medium">{filteredStores.length}</span>{' '}
                  ร้าน
                </p>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-2 pr-8 text-gray-600 focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none">
                  <option value="name">เรียงตามชื่อ</option>
                  <option value="floor">เรียงตามชั้น</option>
                  <option value="category">เรียงตามหมวด</option>
                </select>
                <svg
                  className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {/* Store Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {filteredStores.map(store => (
                <StoreCard
                  key={store.id}
                  store={store}
                  floorLabel={getFloorLabel(store.floorId || '')}
                />
              ))}
            </div>

            {/* Empty State */}
            {filteredStores.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ไม่พบร้านค้า
                </h3>
                <p className="text-gray-600 mb-4">
                  ลองปรับตัวกรองหรือคำค้นหาใหม่
                </p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  ล้างตัวกรอง
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Filter Modal */}
      {showMobileFilters && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">ตัวกรอง</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Mobile filter content */}
            <div className="space-y-6">
              {/* Category Filter */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">หมวดหมู่</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-200"
                      checked={filters.categories.includes('all')}
                      onChange={e =>
                        handleCategoryChange('all', e.target.checked)
                      }
                    />
                    <span className="text-gray-600">ทั้งหมด</span>
                  </label>
                  {categories.map(category => (
                    <label
                      key={category}
                      className="flex items-center space-x-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-200"
                        checked={filters.categories.includes(category)}
                        onChange={e =>
                          handleCategoryChange(category, e.target.checked)
                        }
                      />
                      <span className="text-gray-600">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Floor Filter */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">ชั้น</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      filters.floors.includes('all')
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
                    }`}
                    onClick={() =>
                      setFilters(prev => ({ ...prev, floors: ['all'] }))
                    }
                  >
                    ทั้งหมด
                  </button>
                  {floors.map(floor => (
                    <button
                      key={floor.id || floor.label}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        filters.floors.includes(floor.id || floor.label)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
                      }`}
                      onClick={() =>
                        setFilters(prev => ({
                          ...prev,
                          floors: [floor.id || floor.label],
                        }))
                      }
                    >
                      {floor.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Open Now Toggle */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">เปิดตอนนี้</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={filters.openNow}
                      onChange={e =>
                        setFilters(prev => ({
                          ...prev,
                          openNow: e.target.checked,
                        }))
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Apply Filters Button */}
            <div className="flex space-x-3 mt-8">
              <button
                onClick={clearFilters}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors"
              >
                ล้างตัวกรอง
              </button>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
              >
                ใช้ตัวกรอง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Store Card Component
function StoreCard({
  store,
  floorLabel,
}: {
  store: Store;
  floorLabel: string;
}) {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      ร้านอาหาร: 'from-green-400 to-green-600',
      แฟชั่น: 'from-red-400 to-red-600',
      เครื่องสำอาง: 'from-pink-400 to-pink-600',
      เทคโนโลยี: 'from-blue-400 to-blue-600',
      บริการ: 'from-indigo-400 to-indigo-600',
      default: 'from-gray-400 to-gray-600',
    };
    return colors[category] || colors.default;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border hover:shadow-lg hover:border-green-200 transition-all duration-200 overflow-hidden">
      <div
        className={`aspect-video bg-gradient-to-br ${getCategoryColor(store.category || '')} flex items-center justify-center`}
      >
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-700">
            {getInitials(store.name)}
          </span>
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg mb-1">
              {store.name}
            </h3>
            <p className="text-gray-600 text-sm mb-2">
              {store.category} • ชั้น {floorLabel}, ยูนิต {store.unit || 'N/A'}
            </p>
            <div className="flex items-center space-x-2 mb-3">
              <span
                className={`px-2 py-1 text-xs rounded-lg font-medium ${
                  store.status === 'Active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {store.status === 'Active' ? 'Open now' : 'Closed'}
              </span>
              {store.phone && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-lg font-medium">
                  Phone
                </span>
              )}
              {store.hours && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-lg font-medium">
                  Hours
                </span>
              )}
            </div>
          </div>
          <button className="p-2 hover:bg-green-50 rounded-lg transition-colors">
            <Heart className="w-5 h-5 text-gray-400 hover:text-green-600" />
          </button>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              // You can add store-specific location logic here
              // For now, we'll use the mall's coordinates
              if (store.location) {
                const { lat, lng } = store.location;
                const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                window.open(googleMapsUrl, '_blank');
              }
            }}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-xl text-sm font-medium transition-colors"
          >
            ดูตำแหน่งบนแผนที่
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors">
            รายละเอียด
          </button>
        </div>
      </div>
    </div>
  );
}
