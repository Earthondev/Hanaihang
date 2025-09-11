import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Search,
  Heart,
  Filter,
  ChevronLeft,
  ChevronRight,
  Building,
} from 'lucide-react';

import { useRealtimeMall } from '@/hooks/useRealtimeMalls';
import { useRealtimeStores } from '@/hooks/useRealtimeStores';
import { listFloors } from '@/services/firebase/firestore';
import { Store, Floor } from '@/types/mall-system';

const Explore: React.FC = () => {
  const { _mallId: mallId } = useParams<{ _mallId: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [selectedCategories, setSelectedCategories] = useState(['all']);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const storesPerPage = 6;
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError('ไม่สามารถโหลดข้อมูลชั้นได้');
      }
    };

    loadFloors();
  }, [mall?.id]);

  // Update loading and error states
  useEffect(() => {
    setLoading(mallLoading || storesLoading);
    setError(mallError || storesError);
  }, [mallLoading, storesLoading, mallError, storesError]);

  // Helper function to map store category to filter category
  const getCategoryFromStore = (store: any) => {
    const category = store.category.toLowerCase();
    if (
      category.includes('อาหาร') ||
      category.includes('food') ||
      category.includes('dining')
    )
      return 'food';
    if (category.includes('แฟชั่น') || category.includes('fashion'))
      return 'fashion';
    if (category.includes('เครื่องสำอาง') || category.includes('beauty'))
      return 'beauty';
    if (
      category.includes('เทคโนโลยี') ||
      category.includes('tech') ||
      category.includes('electronics')
    )
      return 'tech';
    if (category.includes('บริการ') || category.includes('service'))
      return 'service';
    if (category.includes('lifestyle')) return 'fashion';
    if (category.includes('sport')) return 'fashion';
    if (category.includes('entertainment')) return 'service';
    if (category.includes('fitness')) return 'service';
    if (category.includes('supermarket')) return 'food';
    if (category.includes('optical')) return 'beauty';
    if (category.includes('home') || category.includes('living'))
      return 'service';
    if (category.includes('kids') || category.includes('edutainment'))
      return 'service';
    return 'other';
  };

  // Categories mapping
  const categories = [
    { id: 'all', name: 'ทั้งหมด' },
    { id: 'food', name: 'ร้านอาหาร' },
    { id: 'fashion', name: 'แฟชั่น' },
    { id: 'beauty', name: 'เครื่องสำอาง' },
    { id: 'tech', name: 'เทคโนโลยี' },
    { id: 'service', name: 'บริการ' },
  ];

  // Helper function to check if store is open
  const isStoreOpen = (store: Store) => {
    if (!store.hours) return 'unknown';

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Parse hours (format: "10:00-22:00" or "10:00")
    const hours = store.hours.split('-');
    if (hours.length < 1) return 'unknown';

    const [openHour, openMin] = hours[0].split(':').map(Number);
    const openTimeMinutes = openHour * 60 + openMin;

    if (hours.length === 1) {
      // Only open time provided, assume closes at 22:00
      const closeTimeMinutes = 22 * 60;
      return currentTime >= openTimeMinutes && currentTime <= closeTimeMinutes
        ? 'open'
        : 'closed';
    }

    const [closeHour, closeMin] = hours[1].split(':').map(Number);
    const closeTimeMinutes = closeHour * 60 + closeMin;

    return currentTime >= openTimeMinutes && currentTime <= closeTimeMinutes
      ? 'open'
      : 'closed';
  };

  // Filter stores based on current filters
  const filteredStores = stores.filter(store => {
    // Search filter
    const matchesSearch =
      !searchQuery ||
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.category.toLowerCase().includes(searchQuery.toLowerCase());

    // Floor filter
    const matchesFloor =
      selectedFloor === 'all' || store.floorId === selectedFloor;

    // Category filter
    const storeCategory = getCategoryFromStore(store);
    const matchesCategory =
      selectedCategories.includes('all') ||
      selectedCategories.includes(storeCategory);

    // Open now filter
    const storeStatus = isStoreOpen(store);
    const matchesOpenNow = !openNowOnly || storeStatus === 'open';

    return matchesSearch && matchesFloor && matchesCategory && matchesOpenNow;
  });

  // Sort stores
  const sortedStores = [...filteredStores].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'floor':
        return a.floorId.localeCompare(b.floorId);
      case 'category':
        return a.category.localeCompare(b.category);
      default:
        return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedStores.length / storesPerPage);
  const startIndex = (currentPage - 1) * storesPerPage;
  const displayedStores = sortedStores.slice(
    startIndex,
    startIndex + storesPerPage,
  );

  // Get store status
  const getStoreStatus = (store: Store) => {
    try {
      const status = isStoreOpen(store);
      return {
        status,
        text:
          status === 'open'
            ? 'Open now'
            : status === 'closed'
              ? 'Closed'
              : 'Unknown',
        color:
          status === 'open'
            ? 'bg-green-100 text-green-700'
            : status === 'closed'
              ? 'bg-gray-100 text-gray-700'
              : 'bg-yellow-100 text-yellow-700',
      };
    } catch (error) {
      return {
        status: 'unknown',
        text: 'Unknown',
        color: 'bg-yellow-100 text-yellow-700',
      };
    }
  };

  // Get store color based on name
  const getStoreColor = (storeName: string) => {
    const colors = [
      'from-green-400 to-green-600',
      'from-red-400 to-red-600',
      'from-pink-400 to-pink-600',
      'from-blue-400 to-blue-600',
      'from-yellow-400 to-yellow-600',
      'from-indigo-400 to-indigo-600',
      'from-purple-400 to-purple-600',
      'from-orange-400 to-orange-600',
    ];
    const index = storeName.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Handle category selection
  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === 'all') {
      setSelectedCategories(['all']);
    } else {
      setSelectedCategories(prev => {
        const newCategories = prev.filter(c => c !== 'all');
        if (newCategories.includes(categoryId)) {
          return newCategories.filter(c => c !== categoryId);
        } else {
          return [...newCategories, categoryId];
        }
      });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedFloor('all');
    setSelectedCategories(['all']);
    setOpenNowOnly(false);
    setCurrentPage(1);
  };

  // Show toast notification
  const showToast = (message: string) => {
    const toast = document.createElement('div');
    toast.className =
      'fixed top-20 right-4 bg-green-100 border border-green-300 p-4 rounded-xl flex items-center space-x-3 z-50 transform translate-x-full transition-transform duration-300';
    toast.innerHTML = `
      <div class="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
      </div>
      <p class="text-green-700 font-medium">${message}</p>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 100);

    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 text-lg">กำลังโหลดข้อมูลห้าง...</p>
        </div>
      </div>
    );
  }

  if (error || !mall) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">
            {error || 'ไม่พบข้อมูลห้าง'}
          </p>
          <Link
            to="/"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
          >
            กลับไปหน้าแรก
          </Link>
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
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link
                to={`/mall/${mallId}`}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Building className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-lg font-semibold">
                  <span className="text-gray-900">HaaNai</span>
                  <span className="text-green-600">Hang</span>
                </div>
              </Link>
            </div>

            {/* Floor Picker (Center) - Hidden on mobile */}
            <div className="hidden md:flex flex-1 justify-center max-w-md">
              <div className="flex items-center space-x-2 bg-gray-50 p-1 rounded-xl overflow-x-auto">
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    selectedFloor === 'all'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-600 hover:bg-white hover:text-green-600'
                  }`}
                  onClick={() => setSelectedFloor('all')}
                >
                  ทั้งหมด
                </button>
                {floors.map(floor => (
                  <button
                    key={floor.id}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      selectedFloor === floor.id
                        ? 'bg-green-600 text-white'
                        : 'text-gray-600 hover:bg-white hover:text-green-600'
                    }`}
                    onClick={() => setSelectedFloor(floor.id)}
                  >
                    {floor.label ||
                      (floor.id === 'G' ? 'ชั้น G' : `${floor.id}st Floor`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Box */}
            <div className="flex-shrink-0 w-80 lg:w-96 relative">
              <input
                type="text"
                placeholder="ค้นหาร้านได้ตลอดเวลา..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none text-gray-900 placeholder-gray-500 transition-all"
              />
              <Search className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border p-6 sticky top-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">ตัวกรอง</h2>

              {/* Category Filter */}
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-4 text-lg">
                  หมวดหมู่
                </h3>
                <div className="space-y-3">
                  {categories.map(category => (
                    <label
                      key={category.id}
                      className="flex items-center space-x-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-200"
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => handleCategoryChange(category.id)}
                      />
                      <span className="text-gray-600">{category.name}</span>
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
                      selectedFloor === 'all'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
                    }`}
                    onClick={() => setSelectedFloor('all')}
                  >
                    ทั้งหมด
                  </button>
                  {floors.map(floor => (
                    <button
                      key={floor.id}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedFloor === floor.id
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
                      }`}
                      onClick={() => setSelectedFloor(floor.id)}
                    >
                      {floor.label || floor.id}
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
                      checked={openNowOnly}
                      onChange={e => setOpenNowOnly(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              </div>

              {/* Clear Filters */}
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors"
                aria-label="ล้างตัวกรองทั้งหมด"
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
              aria-label="เปิดตัวกรองการค้นหา"
            >
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-600">ตัวกรอง</span>
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                  สำรวจร้าน
                </h1>
                <p className="text-gray-600">พบ {filteredStores.length} ร้าน</p>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-2 pr-8 text-gray-600 focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none"
                >
                  <option value="name">เรียงตามชื่อ</option>
                  <option value="floor">เรียงตามชั้น</option>
                  <option value="category">เรียงตามหมวด</option>
                </select>
                <svg
                  className="w-4 h-4 text-gray-600 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
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
              {displayedStores.map(store => {
                const storeStatus = getStoreStatus(store);
                const storeColor = getStoreColor(store.name);
                const getFloorDisplay = (floorId: string) => {
                  return floorId === 'G'
                    ? 'ชั้น G'
                    : floorId === '1'
                      ? '1st Floor'
                      : floorId === '2'
                        ? '2nd Floor'
                        : floorId === '3'
                          ? '3rd Floor'
                          : floorId === '4'
                            ? '4th Floor'
                            : floorId === '5'
                              ? '5th Floor'
                              : floorId === '6'
                                ? '6th Floor'
                                : `ชั้น ${floorId}`;
                };

                return (
                  <div
                    key={store.id}
                    className="store-card bg-white rounded-2xl shadow-sm border hover:shadow-lg hover:border-green-200 transition-all duration-200 overflow-hidden"
                  >
                    <div
                      className={`aspect-video bg-gradient-to-br ${storeColor} flex items-center justify-center`}
                    >
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center">
                        <span className="text-2xl font-bold text-gray-700">
                          {store.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-xl mb-2">
                            {store.name}
                          </h3>
                          <p className="text-gray-700 text-base mb-3 leading-relaxed">
                            {store.category} • {getFloorDisplay(store.floorId)},{' '}
                            {store.unit || 'N/A'}
                          </p>
                          <div className="flex items-center space-x-2 mb-3">
                            <span
                              className={`px-2 py-1 text-xs rounded-lg font-medium ${storeStatus.color}`}
                            >
                              {storeStatus.text}
                            </span>
                            {store.tags?.slice(0, 2).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-lg font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button className="p-2 hover:bg-green-50 rounded-lg transition-colors">
                          <Heart className="w-5 h-5 text-gray-600 hover:text-green-600" />
                        </button>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            showToast(
                              `กำลังแสดงตำแหน่ง ${store.name} บนแผนที่...`,
                            )
                          }
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-xl text-sm font-medium transition-colors"
                        >
                          ดูตำแหน่งบนแผนที่
                        </button>
                        <Link
                          to={`/mall/${mallId}/stores/${store.id}`}
                          className="px-4 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors"
                        >
                          รายละเอียด
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="text-gray-600 text-sm">
                แสดง {startIndex + 1}-
                {Math.min(startIndex + storesPerPage, filteredStores.length)}{' '}
                จาก {filteredStores.length} ร้าน
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-green-600 text-white'
                          : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {totalPages > 5 && (
                  <>
                    <span className="px-2 text-gray-600">...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="px-3 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  onClick={() =>
                    setCurrentPage(prev => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => showToast('กำลังโหลดร้านเพิ่มเติม...')}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors"
              >
                โหลดเพิ่มเติม
              </button>
            </div>
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
                aria-label="ปิดตัวกรอง"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Category Filter */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">หมวดหมู่</h3>
                <div className="space-y-3">
                  {categories.map(category => (
                    <label
                      key={category.id}
                      className="flex items-center space-x-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-200"
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => handleCategoryChange(category.id)}
                      />
                      <span className="text-gray-600">{category.name}</span>
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
                      selectedFloor === 'all'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
                    }`}
                    onClick={() => setSelectedFloor('all')}
                    aria-label="แสดงร้านค้าทุกชั้น"
                  >
                    ทั้งหมด
                  </button>
                  {floors.map(floor => (
                    <button
                      key={floor.id}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedFloor === floor.id
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
                      }`}
                      onClick={() => setSelectedFloor(floor.id)}
                      aria-label={`แสดงร้านค้าชั้น ${floor.label || floor.id}`}
                    >
                      {floor.label || floor.id}
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
                      checked={openNowOnly}
                      onChange={e => setOpenNowOnly(e.target.checked)}
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
                aria-label="ล้างตัวกรองทั้งหมด"
              >
                ล้างตัวกรอง
              </button>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
                aria-label="ใช้ตัวกรองที่เลือก"
              >
                ใช้ตัวกรอง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Explore;
