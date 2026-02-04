import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Settings, Navigation } from 'lucide-react';

import MallStatusBadge from '../components/ui/MallStatusBadge';
import MallCategoryBadge from '../components/ui/MallCategoryBadge';
// import BookmarkButton from '../components/ui/BookmarkButton';
import MallSortFilter, {
  SortOption,
  FilterOption,
} from '../components/ui/MallSortFilter';
import { listMalls } from '../services/firebase/firestore';
import { useRealtimeMalls } from '../hooks/useRealtimeMalls';

import { distanceKm } from '@/services/geoutils/geo-utils';
import {
  Mall,
  Store as StoreType,
  MallWithDistance,
} from '@/types/mall-system';
import EnhancedSearchBox from '@/components/search/EnhancedSearchBox';
import { UnifiedSearchResult } from '@/lib/enhanced-search';
import { ErrorState } from '@/ui';
import { EmptyState } from '@/ui/EmptyState';
import MapView from '@/components/map/MapView';
import MapControls from '@/components/map/MapControls';
import MapFilters from '@/components/map/MapFilters';

// Analytics tracking function with device info
const trackEvent = (eventName: string, category: string, label: string) => {
  if (
    typeof window !== 'undefined' &&
    (window as Window & { gtag?: unknown }).gtag
  ) {
    const device = window.innerWidth < 640 ? 'mobile' : 'desktop';
    (window as unknown as Window & { gtag: (...args: unknown[]) => void }).gtag(
      'event',
      eventName,
      {
        event_category: category,
        event_label: label,
        custom_parameter: {
          device: device,
          viewport_width: window.innerWidth,
        },
      },
    );
  }
};

type Loc = { lat: number; lng: number } | null;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [userLoc, setUserLoc] = useState<Loc>(null);
  const [results, setResults] = useState<Mall[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSmartAlert, setShowSmartAlert] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [mapFilteredMalls, setMapFilteredMalls] = useState<Mall[]>([]);
  const [showMapFilters, setShowMapFilters] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [storeResults] = useState<
    (StoreType & { mallName?: string; mallSlug?: string })[]
  >([]);
  const [isDistanceReady, setIsDistanceReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ใช้ real-time data สำหรับห้าง
  const {
    malls,
    loading: loadingMalls,
    error: realtimeError,
  } = useRealtimeMalls();

  // อัปเดต results และ mapFilteredMalls เมื่อ malls เปลี่ยนแปลง
  useEffect(() => {
    console.log('📊 ข้อมูลห้างเปลี่ยนแปลง:', malls.length, 'ห้าง');
    if (malls.length > 0) {
      console.log('📊 อัปเดตข้อมูลห้างแบบ real-time:', malls.length, 'ห้าง');
      console.log('📋 รายการห้าง:', malls.map(m => m.displayName).join(', '));
      console.log('🔍 ข้อมูลห้างตัวอย่าง:', malls[0]);
      setResults(malls);
      setMapFilteredMalls(malls);
    } else {
      console.log('⚠️ ไม่มีข้อมูลห้าง');
      setResults([]);
      setMapFilteredMalls([]);
    }
  }, [malls]);

  // ขอตำแหน่งผู้ใช้อัตโนมัติ
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const newLoc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setUserLoc(newLoc);
          console.log('📍 ได้ตำแหน่งผู้ใช้:', newLoc);
        },
        () => {
          console.log('⚠️ ไม่สามารถดึงตำแหน่งได้ แต่จะแสดงห้างทั้งหมด');
        },
      );
    }
  }, []);

  // Search result handler
  const handleSearchResultClick = (result: UnifiedSearchResult) => {
    if (result.kind === 'mall') {
      navigate(`/malls/${result.name}`);
    } else {
      navigate(`/stores/${result.id}`);
    }
  };

  const withDistance = useMemo((): MallWithDistance[] => {
    return results
      .map(m => {
        let distance = null;
        if (userLoc && m.coords) {
          distance = distanceKm(userLoc, m.coords);
        }

        return {
          ...m,
          distanceKm: distance,
          hasActiveCampaign: false, // TODO: Load promotions from Firebase
        };
      })
      .sort((a, b) => {
        // เรียงตามระยะทางใกล้ที่สุดก่อน
        if (a.distanceKm != null && b.distanceKm != null) {
          return a.distanceKm - b.distanceKm;
        }
        // ถ้าไม่มีตำแหน่ง ให้เรียงตามชื่อ
        if (a.distanceKm == null && b.distanceKm == null) {
          return a.displayName.localeCompare(b.displayName, 'th');
        }
        // ถ้ามีระยะทางไม่เท่ากัน ให้ที่มีระยะทางอยู่ก่อน
        if (a.distanceKm != null) return -1;
        if (b.distanceKm != null) return 1;
        return 0;
      });
  }, [results, userLoc]);

  // Set distance ready after calculation
  useEffect(() => {
    if (withDistance.length > 0) {
      setIsDistanceReady(true);
    }
  }, [withDistance]);

  // Helper function to check if mall is currently open
  const isMallOpen = (mall: Mall) => {
    // รองรับทั้ง schema v2 (openTime/closeTime) และ legacy (hours.open/hours.close)
    const openTime = mall.openTime || mall.hours?.open;
    const closeTime = mall.closeTime || mall.hours?.close;

    if (!openTime || !closeTime) {
      return false; // ถ้าไม่มีข้อมูลเวลา ให้ถือว่าปิด
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // แปลงเป็นนาที

    // แปลงเวลาเปิด-ปิดเป็นนาที
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);

    const openTimeMinutes = openHour * 60 + openMin;
    const closeTimeMinutes = closeHour * 60 + closeMin;

    // ตรวจสอบว่าตอนนี้อยู่ในช่วงเวลาเปิดหรือไม่
    return currentTime >= openTimeMinutes && currentTime <= closeTimeMinutes;
  };

  // Sort and filter malls
  const gridFilteredMalls = useMemo(() => {
    let filtered = withDistance;

    // Apply category filter
    if (filterBy !== 'all') {
      if (filterBy === 'open-now') {
        filtered = filtered.filter(mall => isMallOpen(mall));
      } else {
        filtered = filtered.filter(mall => mall.category === filterBy);
      }
    }

    // Apply sorting
    switch (sortBy) {
      case 'distance':
        return filtered.sort(
          (a, b) => (a.distanceKm || 0) - (b.distanceKm || 0),
        );
      case 'name':
        return filtered.sort((a, b) =>
          a.displayName.localeCompare(b.displayName, 'th'),
        );
      case 'open-now':
        return filtered.sort((a, b) => {
          const aOpen = isMallOpen(a);
          const bOpen = isMallOpen(b);
          if (aOpen && !bOpen) return -1;
          if (!aOpen && bOpen) return 1;
          return (a.distanceKm || 0) - (b.distanceKm || 0);
        });
      case 'store-count':
        return filtered.sort(
          (a, b) => (b.storeCount || 0) - (a.storeCount || 0),
        );
      case 'newest':
        return filtered.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
          const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
          return bTime - aTime;
        });
      default:
        return filtered;
    }
  }, [withDistance, filterBy, sortBy]);

  // Search navigation handlers
  const handleMallSelect = (mall: Mall) => {
    navigate(`/malls/${mall.name}`);
  };

  // Map control handlers
  const handleCenterUserLocation = () => {
    if (userLoc) {
      // This will be handled by MapView component
      console.log('Centering on user location:', userLoc);
    }
  };

  const handleShowAllMalls = () => {
    setMapFilteredMalls(malls);
    setShowMapFilters(false);
  };

  const handleToggleMapFilters = () => {
    setShowMapFilters(!showMapFilters);
  };

  const handleToggleLayers = () => {
    // Future: Toggle different map layers
    console.log('Toggle layers');
  };

  const handleToggleFullscreen = () => {
    setIsMapFullscreen(!isMapFullscreen);
  };

  const handleMapFiltersChange = (newFilteredMalls: Mall[]) => {
    setMapFilteredMalls(newFilteredMalls);
  };

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      showToast('เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง', 'error');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLoc(newLoc);
        setIsLoading(false);

        // Show smart alert if Central Rama 3 is nearby
        const centralRama3 = malls.find(m => m.id === 'central-rama-3');
        if (centralRama3 && centralRama3.coords) {
          const distance = distanceKm(newLoc, centralRama3.coords);
          if (distance < 1) {
            // Within 1km
            setShowSmartAlert(true);
          }
        }
        showToast('พบห้างใกล้คุณแล้ว!');
        trackEvent('use_location', 'user_actions', 'location_button');
      },
      () => {
        setIsLoading(false);
        showToast(
          'ไม่สามารถดึงตำแหน่งได้ กรุณาอนุญาตการเข้าถึงตำแหน่ง',
          'error',
        );
      },
    );
  }

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    // Simple toast implementation
    const toast = document.createElement('div');
    const bgColor =
      type === 'success'
        ? 'bg-green-50 border-green-200'
        : 'bg-red-50 border-red-200';
    const textColor = type === 'success' ? 'text-green-700' : 'text-red-700';

    toast.className = `${bgColor} border p-4 rounded-xl flex items-center space-x-3 shadow-lg fixed top-4 right-4 z-50 transform translate-x-full transition-transform duration-300`;
    toast.innerHTML = `
      <p class="${textColor} font-medium">${message}</p>
    `;

    document.body.appendChild(toast);

    setTimeout(() => toast.classList.remove('translate-x-full'), 100);
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }

  function getMallColor(_mallId: string | undefined) {
    if (!_mallId) return 'bg-gray-500';

    const colors = {
      'central-rama-3': 'bg-red-500',
      'siam-paragon': 'bg-blue-500',
      'terminal-21-asok': 'bg-purple-500',
      'the-mall-bangkapi': 'bg-green-500',
    };
    return colors[_mallId as keyof typeof colors] || 'bg-gray-500';
  }

  function getMallInitial(mall: Mall) {
    return mall.displayName.charAt(0).toUpperCase();
  }

  function getMallBadges(mall: MallWithDistance) {
    const badges = [];
    if (mall.distanceKm != null && mall.distanceKm < 1) {
      badges.push({ text: 'ใกล้ฉัน', color: 'bg-green-100 text-green-700' });
    }
    return badges;
  }

  if (loadingMalls) {
    return (
      <div className="bg-gray-50 font-sans min-h-screen">
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-xl font-semibold">
                  <span className="text-gray-900">HaaNai</span>
                  <span className="text-green-600">Hang</span>
                </div>
              </div>
              <Link
                to="/admin"
                className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Admin Panel"
              >
                <Settings className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">
              กำลังโหลดข้อมูลห้างสรรพสินค้า...
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 font-sans min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo - Centered */}
            <div className="flex items-center space-x-3 mx-auto">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-xl font-semibold">
                <span className="text-gray-900">HaaNai</span>
                <span className="text-green-600">Hang</span>
              </div>
            </div>

            {/* Right side - Profile/Settings */}
            <div className="flex items-center space-x-3">
              <Link
                to="/admin"
                className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Admin Panel"
                data-testid="admin-button"
              >
                <Settings className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1
            data-testid="hero-title"
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-kanit leading-tight"
          >
            หาห้างใกล้คุณ
          </h1>
          <p className="text-gray-700 text-xl mb-3 font-prompt leading-relaxed">
            เราจะช่วยหาห้างสรรพสินค้าที่ใกล้คุณที่สุด พร้อมเวลาเปิด–ปิด
            และการเดินทาง
          </p>
          <p className="text-gray-600 text-base mb-8 font-prompt">
            {userLoc
              ? 'เรียงจากระยะทางใกล้คุณที่สุด'
              : 'ค้นหาห้างสรรพสินค้าใกล้ตำแหน่งของคุณ'}
          </p>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto mb-6">
            <EnhancedSearchBox
              onResultClick={handleSearchResultClick}
              placeholder="ค้นหาห้างหรือแบรนด์ เช่น Central Embassy, MBK Center, Terminal 21, Zara, Starbucks…"
              userLocation={userLoc || undefined}
            />
          </div>

          {/* Primary CTA - Use My Location */}
          <div className="flex flex-col items-center space-y-2">
            <button
              onClick={handleUseMyLocation}
              disabled={isLoading}
              data-testid="use-my-location"
              className="inline-flex items-center space-x-2 bg-primary hover:bg-primary-hover focus:bg-primary-hover text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 font-prompt"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  <span>กำลังค้นหา...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  <span>🔍 หาศูนย์การค้าใกล้คุณ</span>
                </>
              )}
            </button>
            <p className="text-sm text-gray-600 font-prompt">
              กดเพื่ออนุญาตใช้ตำแหน่งปัจจุบันของคุณ
            </p>
          </div>
        </div>

        {/* Smart Location Alert */}
        {showSmartAlert && (
          <div className="mb-8 max-w-2xl mx-auto">
            <div className="bg-gradient-to-r from-green-100 to-green-50 border border-green-300 p-6 rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-green-900 text-lg">
                      คุณอยู่ใกล้ Central Rama 3!
                    </h3>
                    <p className="text-green-700 text-base">
                      ห่างเพียง{' '}
                      {Math.round(
                        distanceKm(userLoc!, { lat: 13.6891, lng: 100.5441 }) *
                          1000,
                      )}{' '}
                      เมตร
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSmartAlert(false)}
                  className="text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="space-y-12">
          {/* Mall Results */}
          {loadingMalls ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-900">
                  ห้างสรรพสินค้า
                </h2>
                <div className="h-px bg-gray-200 flex-1 ml-4"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-pulse"
                  >
                    <div className="h-1 bg-gray-200"></div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-2xl"></div>
                        <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-3 w-1/2"></div>
                      <div className="flex items-center justify-between">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : error || realtimeError ? (
            <ErrorState
              message={error || realtimeError || 'เกิดข้อผิดพลาด'}
              onRetry={() => {
                setError(null);
                // Reload malls
                const loadMalls = async () => {
                  try {
                    const firestoreMalls = await listMalls();
                    setResults(firestoreMalls);
                  } catch (err) {
                    setError('ไม่สามารถโหลดข้อมูลห้างสรรพสินค้าได้');
                  }
                };
                loadMalls();
              }}
            />
          ) : results.length > 0 ? (
            <div data-testid="search-results">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-3xl font-bold text-gray-900 font-kanit">
                    {userLoc ? '📍 ห้างใกล้คุณ' : '🏢 ห้างสรรพสินค้า'}
                  </h2>
                  <div className="h-px bg-gradient-to-r from-gray-200 to-transparent flex-1 ml-6"></div>
                </div>
                <div className="h-px bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20"></div>
              </div>

              {/* View Toggle */}
              <div className="flex justify-end items-center gap-4 mb-6">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'grid'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title="แสดงแบบ Grid"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'map'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title="🗺️ ดูบนแผนที่"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Sort and Filter */}
              <MallSortFilter
                sortBy={sortBy}
                onSortChange={setSortBy}
                filterBy={filterBy}
                onFilterChange={setFilterBy}
                className="mb-6"
              />

              {/* Results Count */}
              <div className="mb-4">
                <p className="text-base text-gray-700 font-prompt">
                  แสดง {gridFilteredMalls.length} จาก {withDistance.length} ห้าง
                </p>
              </div>

              {/* Conditional Rendering based on View Mode */}
              {viewMode === 'grid' ? (
                gridFilteredMalls.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {gridFilteredMalls.map(mall => (
                      <Link
                        key={mall.id}
                        to={`/malls/${mall.name}`}
                        data-testid="mall-card"
                        className="group bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:shadow-green-100/50 transition-all duration-300 hover:-translate-y-1 hover:border-green-300 hover:scale-[1.02]"
                      >
                        {/* Accent Color Bar */}
                        <div className={`h-1 ${getMallColor(mall.id)}`}></div>

                        <div className="p-6">
                          {/* Top Section - Logo and Badges */}
                          <div className="flex items-start justify-between mb-4">
                            {/* Mall Logo/Icon - Larger */}
                            {mall.logoUrl ? (
                              <img
                                src={mall.logoUrl}
                                alt={`${mall.displayName} logo`}
                                className="w-20 h-20 rounded-2xl object-cover shadow-lg border-2 border-white"
                                onError={e => {
                                  // Fallback to text if image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback =
                                    target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div
                              className={`w-20 h-20 ${getMallColor(mall.id)} rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg ${mall.logoUrl ? 'hidden' : ''}`}
                              style={{
                                display: mall.logoUrl ? 'none' : 'flex',
                              }}
                            >
                              {getMallInitial(mall)}
                            </div>

                            {/* Status Badges */}
                            <div className="flex flex-col gap-1">
                              {getMallBadges(mall).map((badge, index) => (
                                <span
                                  key={index}
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}
                                >
                                  {badge.text}
                                </span>
                              ))}
                              {isMallOpen(mall) && (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                  เปิดอยู่ตอนนี้
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Mall Name - Larger and Bolder */}
                          <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors font-kanit">
                            {mall.displayName}
                          </h3>

                          {/* Address - Lighter Color */}
                          <p className="text-gray-600 text-base mb-4 line-clamp-2 font-prompt leading-relaxed">
                            {mall.address || mall.district}
                          </p>

                          {/* Bottom Section - Details */}
                          <div className="space-y-3">
                            {/* Status and Hours */}
                            <MallStatusBadge mall={mall} size="sm" />

                            {/* Category */}
                            <MallCategoryBadge
                              category={mall.category}
                              categoryLabel={mall.categoryLabel}
                              size="sm"
                            />

                            {/* Distance with Icon */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">🚗</span>
                                <span
                                  data-testid="distance"
                                  className="text-primary font-semibold text-sm font-prompt"
                                >
                                  {isDistanceReady && mall.distanceKm != null
                                    ? mall.distanceKm < 1
                                      ? `${Math.round(mall.distanceKm * 1000)} ม.`
                                      : `${mall.distanceKm.toFixed(1)} กม.`
                                    : isDistanceReady
                                      ? 'ไม่ทราบระยะทาง'
                                      : '...'}
                                </span>
                              </div>

                              {/* District */}
                              <span className="text-gray-400 text-xs">
                                {mall.district}
                              </span>
                            </div>

                            {/* Action Button - Green Accent */}
                            <div className="pt-3 border-t border-gray-100">
                              <div className="flex items-center justify-center text-sm text-primary font-medium group-hover:text-primary-hover transition-all duration-200 font-prompt group-hover:scale-105">
                                <span>ดูรายละเอียด</span>
                                <svg
                                  className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    type="malls"
                    title="ไม่มีห้างที่เปิดอยู่ตอนนี้"
                    description="ลองดูห้างทั้งหมดหรือตรวจสอบเวลาอีกครั้ง"
                  />
                )
              ) : (
                /* Map View */
                <div
                  className={`relative ${isMapFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-96'}`}
                >
                  <MapView
                    malls={mapFilteredMalls}
                    userLocation={userLoc}
                    onMallClick={handleMallSelect}
                    className="w-full h-full rounded-2xl"
                  />

                  {/* Map Controls */}
                  <MapControls
                    onCenterUserLocation={handleCenterUserLocation}
                    onShowAllMalls={handleShowAllMalls}
                    onToggleFilters={handleToggleMapFilters}
                    onToggleLayers={handleToggleLayers}
                    onToggleFullscreen={handleToggleFullscreen}
                    isFullscreen={isMapFullscreen}
                    userLocation={userLoc}
                    mallsCount={mapFilteredMalls.length}
                  />

                  {/* Map Filters */}
                  <MapFilters
                    malls={malls}
                    onFiltersChange={handleMapFiltersChange}
                    isVisible={showMapFilters}
                    onClose={() => setShowMapFilters(false)}
                  />
                </div>
              )}

              {/* Additional Sections */}
              {userLoc && withDistance.length > 0 && (
                <>
                  {/* Popular in Bangkok Section */}
                  <div className="mt-12">
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-semibold text-gray-900 font-kanit">
                          ⭐ ยอดนิยมในกรุงเทพฯ
                        </h2>
                        <div className="h-px bg-gradient-to-r from-orange-200 to-transparent flex-1 ml-6"></div>
                      </div>
                      <div className="h-px bg-gradient-to-r from-orange-200/20 via-orange-400/40 to-orange-200/20"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                      {withDistance.slice(0, 4).map(mall => (
                        <Link
                          key={`popular-${mall.id}`}
                          to={`/malls/${mall.name}`}
                          className="group bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:shadow-orange-100/50 transition-all duration-300 hover:-translate-y-1 hover:border-orange-300 hover:scale-[1.02]"
                        >
                          <div className="h-1 bg-orange-500"></div>
                          <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              {mall.logoUrl ? (
                                <img
                                  src={mall.logoUrl}
                                  alt={`${mall.displayName} logo`}
                                  className="w-20 h-20 rounded-2xl object-cover shadow-lg border-2 border-white"
                                  onError={e => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const fallback =
                                      target.nextElementSibling as HTMLElement;
                                    if (fallback)
                                      fallback.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div
                                className="w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                                style={{
                                  display: mall.logoUrl ? 'none' : 'flex',
                                }}
                              >
                                {getMallInitial(mall)}
                              </div>
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
                                Top Rated
                              </span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors font-kanit">
                              {mall.displayName}
                            </h3>
                            <p className="text-gray-500 text-sm mb-4 font-prompt">
                              {mall.district}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">🚗</span>
                                <span className="text-orange-600 font-semibold text-sm font-prompt">
                                  {mall.distanceKm != null
                                    ? mall.distanceKm < 1
                                      ? `${Math.round(mall.distanceKm * 1000)} ม.`
                                      : `${mall.distanceKm.toFixed(1)} กม.`
                                    : 'ไม่ทราบระยะทาง'}
                                </span>
                              </div>
                              <span className="text-gray-400 text-xs">
                                {mall.district}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <EmptyState
              type="malls"
              title="ยังไม่มีห้างในพื้นที่นี้"
              description="ลองใช้ตำแหน่งอื่น หรือค้นหาด้วยชื่อห้าง"
              actionLabel="🔍 ค้นหาห้าง"
              onAction={() => setQuery('Central')}
            />
          )}

          {/* Store Results */}
          {storeResults.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  🛍️ ร้านค้า
                </h2>
                <div className="h-px bg-gray-200 flex-1 ml-4"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {storeResults.map(store => (
                  <div
                    key={store.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
                  >
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {store.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">
                      {store.category}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {store.mallName} • {store.floorId}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {results.length === 0 &&
            storeResults.length === 0 &&
            query &&
            !loadingMalls &&
            !error && (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ไม่พบผลลัพธ์
                </h3>
                <p className="text-gray-600">
                  ลองค้นหาด้วยคำอื่น หรือเลือกห้างสรรพสินค้าจากรายการด้านล่าง
                </p>
              </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default Home;
