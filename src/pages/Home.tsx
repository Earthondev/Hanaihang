import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Clock, Building, Store, Settings, Navigation } from "lucide-react";

import { listMalls } from "../services/firebase/firestore";
import { distanceKm } from "@/services/geoutils/geo-utils";
import { Mall, Store as StoreType } from "@/types/mall-system";
import { SkeletonList, ErrorState } from "@/ui";
import { EmptyState } from "@/ui/EmptyState";
import { GlobalSearchBox } from "@/features/search";

// Analytics tracking function with device info
const trackEvent = (eventName: string, category: string, label: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    const device = window.innerWidth < 640 ? 'mobile' : 'desktop';
    (window as any).gtag('event', eventName, {
      event_category: category,
      event_label: label,
      custom_parameter: {
        device: device,
        viewport_width: window.innerWidth
      }
    });
  }
};

type Loc = { lat: number; lng: number } | null;

const Home: React.FC = () => {
  const [query, setQuery] = useState("");
  const [userLoc, setUserLoc] = useState<Loc>(null);
  const [malls, setMalls] = useState<Mall[]>([]);
  const [results, setResults] = useState<Mall[]>([]);
  const [storeResults, setStoreResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSmartAlert, setShowSmartAlert] = useState(false);
  const [loadingMalls, setLoadingMalls] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load malls from Firebase
  useEffect(() => {
    const loadMalls = async () => {
      try {
        setLoadingMalls(true);
        console.log('🔄 กำลังโหลดข้อมูลห้างสรรพสินค้า...');
        const firestoreMalls = await listMalls();
        console.log('📊 ข้อมูลห้างที่ได้จาก Firebase:', firestoreMalls);
        setMalls(firestoreMalls);
        setResults(firestoreMalls);
        console.log('✅ โหลดข้อมูลห้างสำเร็จ:', firestoreMalls.length, 'ห้าง');
        
        // ขอตำแหน่งผู้ใช้อัตโนมัติ
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            pos => {
              const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              setUserLoc(newLoc);
              console.log('📍 ได้ตำแหน่งผู้ใช้:', newLoc);
            },
            () => {
              console.log('⚠️ ไม่สามารถดึงตำแหน่งได้ แต่จะแสดงห้างทั้งหมด');
            }
          );
        }
      } catch (error) {
        console.error('❌ Error loading malls:', error);
        setError('ไม่สามารถโหลดข้อมูลห้างสรรพสินค้าได้');
        setMalls([]);
        setResults([]);
      } finally {
        setLoadingMalls(false);
      }
    };

    loadMalls();
  }, []);

  // Remove the old search effect since we're using GlobalSearchBox now

  const withDistance = useMemo(() => {
    return results.map(m => {
      let distance = null;
      if (userLoc && m.coords) {
        distance = distanceKm(userLoc, m.coords);
      }
      
      return {
        ...m,
        distanceKm: distance,
        hasActiveCampaign: false // TODO: Load promotions from Firebase
      };
    }).sort((a,b) => {
      // เรียงตามระยะทางใกล้ที่สุดก่อน
      if (a.distanceKm != null && b.distanceKm != null) {
        return a.distanceKm - b.distanceKm;
      }
      // ถ้าไม่มีตำแหน่ง ให้เรียงตามชื่อ
      if (a.distanceKm == null && b.distanceKm == null) {
        return a.displayName.localeCompare(b.displayName, "th");
      }
      // ถ้ามีระยะทางไม่เท่ากัน ให้ที่มีระยะทางอยู่ก่อน
      if (a.distanceKm != null) return -1;
      if (b.distanceKm != null) return 1;
      return 0;
    });
  }, [results, userLoc]);

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
        const centralRama3 = malls.find(m => m.id === "central-rama-3");
        if (centralRama3 && centralRama3.coords) {
          const distance = distanceKm(newLoc, centralRama3.coords);
          if (distance < 1) { // Within 1km
            setShowSmartAlert(true);
          }
        }
        showToast('พบห้างใกล้คุณแล้ว!');
        trackEvent('use_location', 'user_actions', 'location_button');
      },
      () => {
        setIsLoading(false);
        showToast('ไม่สามารถดึงตำแหน่งได้ กรุณาอนุญาตการเข้าถึงตำแหน่ง', 'error');
      }
    );
  }

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    // Simple toast implementation
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
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

  function getMallColor(mallId: string) {
    const colors = {
      'central-rama-3': 'bg-red-500',
      'siam-paragon': 'bg-blue-500',
      'terminal-21-asok': 'bg-purple-500',
      'the-mall-bangkapi': 'bg-green-500'
    };
    return colors[mallId as keyof typeof colors] || 'bg-gray-500';
  }

  function getMallInitial(mall: Mall) {
    return mall.displayName.charAt(0).toUpperCase();
  }

  function getMallBadges(mall: any) {
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
                  <span className="text-gray-900">HaaNai</span><span className="text-green-600">Hang</span>
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
            <p className="text-gray-600 mt-4">กำลังโหลดข้อมูลห้างสรรพสินค้า...</p>
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
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-xl font-semibold">
                <span className="text-gray-900">HaaNai</span><span className="text-green-600">Hang</span>
              </div>
            </div>
            
            {/* Right side - Admin */}
            <div className="flex items-center space-x-3">
              <Link 
                to="/admin"
                className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Admin Panel"
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
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">
            หาห้างใกล้คุณ
          </h1>
          <p className="text-gray-600 text-lg mb-6">
            {userLoc ? 'เรียงจากระยะทางใกล้คุณที่สุด' : 'ค้นหาห้างสรรพสินค้าใกล้ตำแหน่งของคุณ'}
          </p>
          
          {/* Primary CTA - Use My Location */}
          <button 
            onClick={handleUseMyLocation}
            disabled={isLoading}
            data-testid="use-my-location"
            className="inline-flex items-center space-x-3 bg-green-600 hover:bg-green-700 focus:bg-green-700 text-white px-8 py-4 rounded-2xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                <span>กำลังค้นหา...</span>
              </>
            ) : (
              <>
                <Navigation className="w-5 h-5" />
                <span>ใช้ตำแหน่งของฉัน</span>
              </>
            )}
          </button>
        </div>

        {/* Global Search Box */}
        <div className="mb-8">
          <GlobalSearchBox
            onMallSelect={(mall) => {
              // Navigate to mall page
              window.location.href = `/malls/${mall.name}`;
            }}
            onStoreSelect={(store) => {
              // Navigate to store page
              if (store.mallSlug) {
                window.location.href = `/malls/${store.mallSlug}/stores/${store.id}`;
              }
            }}
            className="max-w-2xl mx-auto"
            placeholder="ค้นหาห้างหรือแบรนด์ เช่น Central Rama 3, Zara, Starbucks…"
          />
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
                    <h3 className="font-semibold text-green-900">คุณอยู่ใกล้ Central Rama 3!</h3>
                    <p className="text-green-700 text-sm">ห่างเพียง {Math.round(distanceKm(userLoc!, { lat: 13.6891, lng: 100.5441 }) * 1000)} เมตร</p>
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
        <div className="space-y-8">
          {/* Mall Results */}
          {loadingMalls ? (
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">ห้างสรรพสินค้า</h2>
              <SkeletonList rows={6} />
            </div>
          ) : error ? (
            <ErrorState 
              message={error} 
              onRetry={() => {
                setError(null);
                setLoadingMalls(true);
                // Reload malls
                const loadMalls = async () => {
                  try {
                    const firestoreMalls = await listMalls();
                    setMalls(firestoreMalls);
                    setResults(firestoreMalls);
                  } catch (error) {
                    setError('ไม่สามารถโหลดข้อมูลห้างสรรพสินค้าได้');
                  } finally {
                    setLoadingMalls(false);
                  }
                };
                loadMalls();
              }}
            />
          ) : results.length > 0 ? (
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">ห้างสรรพสินค้า</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {withDistance.map((mall) => (
                  <Link 
                    key={mall.id}
                    to={`/malls/${mall.name}`}
                    data-testid="mall-card"
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 ${getMallColor(mall.id)} rounded-xl flex items-center justify-center text-white font-bold text-lg`}>
                        {getMallInitial(mall)}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {getMallBadges(mall).map((badge, index) => (
                          <span key={index} className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
                            {badge.text}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{mall.displayName}</h3>
                    <p className="text-gray-600 text-sm mb-3">{mall.address || mall.district}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{mall.hours?.open || '10:00'} - {mall.hours?.close || '22:00'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {mall.distanceKm != null ? (
                          <>
                            <MapPin className="w-4 h-4 text-green-600" />
                            <span className="text-green-600 font-medium">
                              {mall.distanceKm < 1 
                                ? `${Math.round(mall.distanceKm * 1000)} ม.` 
                                : `${mall.distanceKm.toFixed(1)} กม.`
                              }
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs">ไม่ทราบระยะทาง</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-gray-500">
                        <Store className="w-4 h-4" />
                        <span className="text-sm">ร้านค้า</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-500">
                        <Building className="w-4 h-4" />
                        <span className="text-sm">{mall.district}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">ร้านค้า</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {storeResults.map((store) => (
                  <div key={store.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{store.name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{store.category}</p>
                    <p className="text-gray-500 text-xs">{store.mallName} • {store.floor}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {results.length === 0 && storeResults.length === 0 && query && !loadingMalls && !error && (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">ไม่พบผลลัพธ์</h3>
              <p className="text-gray-600">ลองค้นหาด้วยคำอื่น หรือเลือกห้างสรรพสินค้าจากรายการด้านล่าง</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;
