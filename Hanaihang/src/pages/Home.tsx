import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Settings, Navigation, Search, Menu, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import MallStatusBadge from '../components/ui/MallStatusBadge';
import MallCategoryBadge from '../components/ui/MallCategoryBadge';
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
import SEO from '@/components/SEO';

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
    if (malls.length > 0) {
      setResults(malls);
      setMapFilteredMalls(malls);
    } else {
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
      .map((m: Mall) => {
        let distance = null;
        if (userLoc && m.coords) {
          distance = distanceKm(userLoc, m.coords);
        }

        return {
          ...m,
          distanceKm: distance,
          hasActiveCampaign: false,
        };
      })
      .sort((a: MallWithDistance, b: MallWithDistance) => {
        if (a.distanceKm != null && b.distanceKm != null) {
          return a.distanceKm - b.distanceKm;
        }
        if (a.distanceKm == null && b.distanceKm == null) {
          return a.displayName.localeCompare(b.displayName, 'th');
        }
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

  const isMallOpen = (mall: Mall) => {
    const openTime = mall.openTime || mall.hours?.open;
    const closeTime = mall.closeTime || mall.hours?.close;

    if (!openTime || !closeTime) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);
    const openTimeMinutes = openHour * 60 + openMin;
    const closeTimeMinutes = closeHour * 60 + closeMin;

    return currentTime >= openTimeMinutes && currentTime <= closeTimeMinutes;
  };

  const gridFilteredMalls = useMemo(() => {
    let filtered = [...withDistance];

    if (filterBy !== 'all') {
      if (filterBy === 'open-now') {
        filtered = filtered.filter((mall: MallWithDistance) => isMallOpen(mall));
      } else {
        filtered = filtered.filter((mall: MallWithDistance) => mall.category === filterBy);
      }
    }

    switch (sortBy) {
      case 'distance':
        return filtered.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
      case 'name':
        return filtered.sort((a, b) => a.displayName.localeCompare(b.displayName, 'th'));
      case 'open-now':
        return filtered.sort((a, b) => {
          const aOpen = isMallOpen(a);
          const bOpen = isMallOpen(b);
          if (aOpen && !bOpen) return -1;
          if (!aOpen && bOpen) return 1;
          return (a.distanceKm || 0) - (b.distanceKm || 0);
        });
      case 'store-count':
        return filtered.sort((a, b) => (b.storeCount || 0) - (a.storeCount || 0));
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

  const handleMallSelect = (mall: Mall) => {
    navigate(`/malls/${mall.name}`);
  };

  const handleCenterUserLocation = () => {
    if (userLoc) console.log('Centering on user location:', userLoc);
  };

  const handleShowAllMalls = () => {
    setMapFilteredMalls(malls);
    setShowMapFilters(false);
  };

  const handleToggleMapFilters = () => setShowMapFilters(!showMapFilters);

  const handleToggleLayers = () => console.log('Toggle layers');

  const handleToggleFullscreen = () => setIsMapFullscreen(!isMapFullscreen);

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

        const centralRama3 = malls.find(m => m.id === 'central-rama-3');
        if (centralRama3 && centralRama3.coords) {
          const distance = distanceKm(newLoc, centralRama3.coords);
          if (distance < 1) setShowSmartAlert(true);
        }
        showToast('พบห้างใกล้คุณแล้ว!');
        trackEvent('use_location', 'user_actions', 'location_button');
      },
      () => {
        setIsLoading(false);
        showToast('ไม่สามารถดึงตำแหน่งได้ กรุณาอนุญาตการเข้าถึงตำแหน่ง', 'error');
      },
    );
  }

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
    const textColor = type === 'success' ? 'text-green-700' : 'text-red-700';

    toast.className = `${bgColor} border p-4 rounded-xl flex items-center space-x-3 shadow-lg fixed top-4 right-4 z-50 transform translate-x-full transition-transform duration-300`;
    toast.innerHTML = `<p class="${textColor} font-medium font-prompt">${message}</p>`;

    document.body.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-x-full'), 100);
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }

  function getMallColor(_mallId: string | undefined) {
    if (!_mallId) return 'bg-gray-500';
    const colors: Record<string, string> = {
      'central-rama-3': 'bg-red-500',
      'siam-paragon': 'bg-blue-500',
      'terminal-21-asok': 'bg-purple-500',
      'the-mall-bangkapi': 'bg-green-500',
    };
    return colors[_mallId] || 'bg-gray-500';
  }

  function getMallInitial(mall: Mall) {
    return mall.displayName.charAt(0).toUpperCase();
  }

  if (loadingMalls) {
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
              <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </header>

        {/* Skeleton Hero */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-10 text-center">
          <div className="h-12 sm:h-20 w-3/4 mx-auto bg-gray-200 rounded-3xl mb-6 animate-pulse"></div>
          <div className="h-6 w-1/2 mx-auto bg-gray-200 rounded-xl mb-10 animate-pulse"></div>
          <div className="h-16 max-w-2xl mx-auto bg-gray-200 rounded-3xl animate-pulse mb-8"></div>
        </div>

        {/* Skeleton Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[32px] border border-gray-100 overflow-hidden h-96 flex flex-col">
                <div className="h-56 bg-gray-200 animate-pulse relative">
                  <div className="absolute top-4 right-4 w-16 h-8 bg-white/50 rounded-lg"></div>
                </div>
                <div className="p-8 flex-1 space-y-4">
                  <div className="h-4 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="h-8 w-3/4 bg-gray-200 rounded-xl animate-pulse"></div>
                  <div className="h-4 w-full bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fcfdfd] font-sans min-h-screen selection:bg-primary/10 selection:text-primary">
      <SEO
        title="หน้าแรก"
        description="ค้นหาห้างสรรพสินค้าและร้านค้าชั้นนำในกรุงเทพฯ เปรียบเทียบระยะทางและตรวจสอบเวลาเปิด-ปิดได้ทันที"
      />
      {/* Premium Header */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-gray-100/50 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                <MapPin className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="text-xl font-bold tracking-tight">
                <span className="text-gray-900">HaaNai</span>
                <span className="text-primary font-kanit">Hang</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center bg-gray-100/50 p-1 rounded-xl border border-gray-200/50">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                🏢 รายการ
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${viewMode === 'map' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                🗺️ แผนที่
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <Link to="/admin" className="hidden sm:flex text-gray-400 hover:text-primary p-2.5 rounded-xl transition-colors">
                <Settings className="w-5 h-5" />
              </Link>
              <button className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center hover:bg-gray-800 transition-shadow">
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-secondary/5 blur-[100px] rounded-full delay-700 animate-pulse-slow"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 tracking-tight font-kanit">
              ค้นหาความสะดวก <br className="hidden sm:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-700">ในทุกห้างสรรพสินค้า</span>
            </h1>
            <p className="max-w-2xl mx-auto text-gray-600 text-lg sm:text-xl mb-10 font-prompt leading-relaxed">
              เราช่วยให้คุณค้นพบห้างสรรพสินค้าใกล้ตัว พร้อมรายละเอียดเวลาเปิด-ปิด ร้านค้า และการเดินทางที่ครบถ้วนที่สุด
            </p>

            <div className="max-w-3xl mx-auto mb-8 relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-[28px] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
              <EnhancedSearchBox
                onResultClick={handleSearchResultClick}
                placeholder="ค้นหาห้างหรือแบรนด์ที่คุณสนใจ..."
                userLocation={userLoc || undefined}
                className="relative shadow-2xl shadow-primary/5"
              />
            </div>

            {/* Quick Category Chips - Google Maps Style */}
            <div className="max-w-3xl mx-auto mb-10 overflow-x-auto no-scrollbar pb-2">
              <div className="flex items-center justify-center space-x-3 min-w-max px-4">
                {[
                  { id: 'all', label: 'ทั้งหมด', icon: '🏢' },
                  { id: 'shopping-center', label: 'ช้อปปิ้ง', icon: '🛍️' },
                  { id: 'community-mall', label: 'คอมมูนิตี้', icon: '🏘️' },
                  { id: 'department-store', label: 'ห้างฯ', icon: '🏬' },
                  { id: 'open-now', label: 'เปิดอยู่', icon: 'CLOCK' },
                ].map((chip) => {
                  const isActive = chip.id === 'open-now' ? filterBy === 'open-now' : filterBy === chip.id;

                  return (
                    <motion.button
                      key={chip.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (chip.id === 'open-now') {
                          setFilterBy(filterBy === 'open-now' ? 'all' : 'open-now');
                        } else {
                          setFilterBy(isActive ? 'all' : chip.id as FilterOption);
                        }
                      }}
                      className={`
                        flex items-center space-x-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border
                        ${isActive
                          ? 'bg-gray-900 text-white border-gray-900 shadow-lg shadow-gray-200'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      {chip.icon === 'CLOCK' ? (
                        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-green-500'} animate-pulse`} />
                      ) : (
                        <span>{chip.icon}</span>
                      )}
                      <span>{chip.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUseMyLocation}
                disabled={isLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-xl shadow-gray-200/50 disabled:opacity-70 font-prompt group"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                ) : (
                  <>
                    <Navigation className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                    <span>ค้นหาห้างใกล้ฉัน</span>
                  </>
                )}
              </motion.button>

              <div className="flex items-center text-sm text-gray-500 font-prompt bg-white/50 border border-gray-100 px-5 py-4 rounded-2xl backdrop-blur-sm">
                <span className="w-2 h-2 bg-primary rounded-full mr-3 animate-pulse"></span>
                {userLoc ? 'กำลังใช้ตำแหน่งปัจจุบันของคุณ' : 'กดเพื่อเริ่มค้นหาจากตำแหน่งของคุณ'}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Results Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        {showSmartAlert && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 max-w-2xl mx-auto">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 p-6 rounded-3xl flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg font-kanit">คุณอยู่ใกล้ Central Rama 3!</h3>
                  <p className="text-primary font-medium font-prompt text-sm">ห่างเพียงไม่กี่ร้อยเมตรจากที่นี่</p>
                </div>
              </div>
              <button onClick={() => setShowSmartAlert(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
          </motion.div>
        )}

        {/* Filters Header */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 font-kanit tracking-tight">
                {userLoc ? '📍 ห้างที่อยู่ใกล้คุณ' : '🏢 สำรวจห้างสรรพสินค้า'}
              </h2>
              <p className="text-gray-500 mt-2 font-prompt">
                {gridFilteredMalls.length} จาก {withDistance.length} ศูนย์การค้าที่พบ
              </p>
            </div>

            {/* View Toggle (Desktop) */}
            <div className="hidden md:flex items-center space-x-3">
              <MallSortFilter
                sortBy={sortBy}
                onSortChange={setSortBy}
                filterBy={filterBy}
                onFilterChange={setFilterBy}
                showFilters={false} // Hide redundant filters
              />
            </div>
          </div>

          <div className="h-[1px] w-full bg-gradient-to-r from-gray-200 via-gray-100 to-transparent"></div>
        </div>

        {error || realtimeError ? (
          <ErrorState message={error || realtimeError || 'เกิดข้อผิดพลาด'} onRetry={() => setError(null)} />
        ) : results.length > 0 ? (
          viewMode === 'grid' ? (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              <AnimatePresence>
                {gridFilteredMalls.map((mall, idx) => (
                  <motion.div key={mall.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.05 }}>
                    <Link to={`/malls/${mall.name}`} className="group relative flex flex-col bg-white rounded-[32px] border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-500 h-full">
                      <div className="relative h-56 overflow-hidden">
                        <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${getMallColor(mall.id)}`}></div>
                        <div className="absolute inset-0 flex items-center justify-center p-8">
                          {mall.logoUrl ? (
                            <img src={mall.logoUrl} alt={mall.displayName} className="w-28 h-28 rounded-3xl object-cover shadow-2xl border-4 border-white group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <div className={`w-24 h-24 ${getMallColor(mall.id)} rounded-3xl flex items-center justify-center text-white font-bold text-3xl shadow-2xl group-hover:rotate-6 transition-transform`}>{getMallInitial(mall)}</div>
                          )}
                        </div>
                        {isDistanceReady && mall.distanceKm != null && (
                          <div className="absolute bottom-5 right-5 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-sm border border-gray-50 flex items-center space-x-1.5">
                            <Navigation className="w-3.5 h-3.5 text-primary" />
                            <span className="text-sm font-bold text-gray-900 font-prompt">{mall.distanceKm < 1 ? `${Math.round(mall.distanceKm * 1000)} ม.` : `${mall.distanceKm.toFixed(1)} กม.`}</span>
                          </div>
                        )}
                        <div className="absolute top-5 left-5">
                          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm ${isMallOpen(mall) ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                            {isMallOpen(mall) && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>}
                            <span>{isMallOpen(mall) ? 'Open Now' : 'Closed'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-8 pt-6 flex flex-col flex-1">
                        <MallCategoryBadge category={mall.category} categoryLabel={mall.categoryLabel} size="sm" className="!bg-primary/5 !text-primary border-none font-bold uppercase tracking-widest text-[10px] mb-2" />
                        <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors font-kanit">{mall.displayName}</h3>
                        <p className="text-gray-500 text-sm mt-3 line-clamp-2 font-prompt leading-relaxed">{mall.address || mall.district}</p>
                        <div className="mt-auto pt-6 flex items-center justify-between">
                          <MallStatusBadge mall={mall} size="sm" />
                          <div className="p-2.5 rounded-2xl bg-gray-50 text-gray-400 group-hover:bg-primary group-hover:text-white transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7-7 7" /></svg>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="h-[600px] relative rounded-[40px] overflow-hidden shadow-2xl border border-gray-100">
              <MapView malls={mapFilteredMalls} userLocation={userLoc} onMallClick={handleMallSelect} className="w-full h-full" />
              <MapControls onCenterUserLocation={handleCenterUserLocation} onShowAllMalls={handleShowAllMalls} onToggleFilters={handleToggleMapFilters} onToggleLayers={handleToggleLayers} onToggleFullscreen={handleToggleFullscreen} isFullscreen={isMapFullscreen} userLocation={userLoc} mallsCount={mapFilteredMalls.length} />
              <MapFilters malls={malls} onFiltersChange={handleMapFiltersChange} onClose={handleToggleMapFilters} isVisible={showMapFilters} />
            </div>
          )
        ) : (
          <EmptyState type="malls" title="ไม่พบห้างสรรพสินค้า" description="ลองค้นหาด้วยคำอื่นหรือตรวจสอบการเชื่อมต่ออินเทอร์เน็ต" />
        )}
      </main>

      {/* Modern Footer */}
      <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="text-2xl font-bold tracking-tight">
                  <span className="text-gray-900">HaaNai</span>
                  <span className="text-primary font-kanit">Hang</span>
                </div>
              </div>
              <p className="text-gray-500 max-w-sm font-prompt leading-relaxed">แพลตฟอร์มช่วยค้นหาข้อมูลห้างสรรพสินค้าและร้านค้าในไทยที่ครบถ้วนและใช้งานง่ายที่สุด</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-6 font-kanit">บริการ</h4>
              <ul className="space-y-4 text-gray-500 font-prompt">
                <li><Link to="/" className="hover:text-primary transition-colors">ค้นหาห้าง</Link></li>
                <li><Link to="/map" className="hover:text-primary transition-colors">แผนที่</Link></li>
                <li><Link to="/stores" className="hover:text-primary transition-colors">แคตตาล็อกร้านค้า</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-6 font-kanit">จัดการ</h4>
              <ul className="space-y-4 text-gray-500 font-prompt">
                <li><Link to="/admin" className="hover:text-primary transition-colors">Admin Panel</Link></li>
                <li><Link to="/login" className="hover:text-primary transition-colors">เข้าสู่ระบบ</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-gray-50 text-gray-400 text-sm font-prompt">
            <p>© 2026 HaaNaiHang. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <a href="#" className="hover:text-gray-600">นโยบายความเป็นส่วนตัว</a>
              <a href="#" className="hover:text-gray-600">เงื่อนไขการใช้งาน</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
