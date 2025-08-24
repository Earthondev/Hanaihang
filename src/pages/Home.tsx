import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Clock, Building, Search, Store, Settings } from "lucide-react";
import { listMalls } from "../lib/firestore";
import { haversineKm } from "../lib/geo";
import { searchMallsAndBrands } from "../lib/search";
import { Mall } from "../types/mall-system";
import SkeletonList from "../components/feedback/SkeletonList";
import { ErrorState } from "../components/feedback/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";

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

  useEffect(() => {
    if (!query) {
      setResults(malls);
      setStoreResults([]);
    } else {
      searchMallsAndBrands(query).then(({ malls: mallMatches, stores: storeMatches }) => {
        setResults(mallMatches);
        setStoreResults(storeMatches);
      });
    }
  }, [query, malls]);

  const withDistance = useMemo(() => {
    return results.map(m => {
      let distanceKm = null;
      if (userLoc && m.coords) {
        distanceKm = haversineKm(userLoc, m.coords);
      }
      
      return {
        ...m,
        distanceKm,
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
          const distance = haversineKm(newLoc, centralRama3.coords);
          if (distance < 1) { // Within 1km
            setShowSmartAlert(true);
          }
        }
        showToast('พบห้างใกล้คุณแล้ว!');
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
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <Settings className="w-4 h-4" />
                <span>Admin Panel</span>
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
            
            {/* Right side - Admin Actions */}
            <div className="flex items-center space-x-3">
              <Link 
                to="/admin"
                className="bg-green-600 hover:bg-green-700 focus:bg-green-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 active:scale-[0.98] min-h-[44px]"
                aria-label="สร้างห้างสรรพสินค้าใหม่ (ไปหน้าแอดมิน)"
                data-testid="create-mall-btn"
                onClick={() => {
                  trackEvent('click_create_mall', 'admin_actions', 'header_button');
                }}
              >
                <Building className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">สร้างห้าง</span>
              </Link>
              
              <Link 
                to="/admin?tab=stores"
                className="bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 active:scale-[0.98] min-h-[44px]"
                aria-label="เพิ่มร้านค้าใหม่ (ไปแท็บ Stores)"
                data-testid="add-store-btn"
                onClick={() => {
                  trackEvent('click_add_store', 'admin_actions', 'header_button');
                }}
              >
                <Store className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">เพิ่มร้าน</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Title Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-2">
            เลือกห้างสรรพสินค้า
          </h1>
          <p className="text-gray-600 text-lg">
            {userLoc ? 'เรียงจากระยะทางใกล้คุณที่สุด' : 'กดปุ่ม "ใช้ตำแหน่งของฉัน" เพื่อดูระยะทาง'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-2xl mx-auto">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="ค้นหาหรือแบรนด์ เช่น Central Rama 3, Zara, Starbucks…"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-8">
          <button 
            onClick={handleUseMyLocation}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-white hover:bg-green-50 border border-gray-200 hover:border-green-500 text-gray-900 hover:text-green-600 px-6 py-3 rounded-2xl font-medium transition-all duration-200 shadow-sm disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                <span>กำลังค้นหา...</span>
              </>
            ) : (
              <>
                <MapPin className="w-5 h-5" />
                <span>ใช้ตำแหน่งของฉัน</span>
              </>
            )}
          </button>
          
          {/* Admin Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/admin"
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 focus:bg-green-700 text-white px-4 py-3 rounded-2xl font-medium transition-all duration-200 shadow-sm hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 active:scale-[0.98]"
              aria-label="สร้างห้างสรรพสินค้าใหม่ (ไปหน้าแอดมิน)"
              data-testid="create-mall-action-btn"
              onClick={() => {
                trackEvent('click_create_mall', 'admin_actions', 'action_section');
              }}
            >
              <Building className="w-5 h-5" aria-hidden="true" />
              <span>สร้างห้าง</span>
            </Link>
            
            <Link 
              to="/admin?tab=stores"
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white px-4 py-3 rounded-2xl font-medium transition-all duration-200 shadow-sm hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 active:scale-[0.98]"
              aria-label="เพิ่มร้านค้าใหม่ (ไปแท็บ Stores)"
              data-testid="add-store-action-btn"
              onClick={() => {
                trackEvent('click_add_store', 'admin_actions', 'action_section');
              }}
            >
              <Store className="w-5 h-5" aria-hidden="true" />
              <span>เพิ่มร้าน</span>
            </Link>
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
                    <h3 className="font-semibold text-green-900">คุณอยู่ใกล้ Central Rama 3!</h3>
                    <p className="text-green-700 text-sm">ห่างเพียง {Math.round(haversineKm(userLoc!, { lat: 13.6891, lng: 100.5441 }) * 1000)} เมตร</p>
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
        <div className="space-y-6">
          {/* Mall Results */}
          {loadingMalls ? (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">ห้างสรรพสินค้า</h2>
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
              <h2 className="text-xl font-semibold text-gray-900 mb-4">ห้างสรรพสินค้า</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {withDistance.map((mall) => (
                  <Link 
                    key={mall.id}
                    to={`/malls/${mall.name}`}
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
              title="ไม่พบห้างสรรพสินค้า"
              description="ยังไม่มีข้อมูลห้างสรรพสินค้าในระบบ"
              actionLabel="สร้างห้างแรก"
              onAction={() => window.location.href = '/admin'}
            />
          )}

          {/* Store Results */}
          {storeResults.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">ร้านค้า</h2>
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
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">ไม่พบผลลัพธ์</h3>
              <p className="text-gray-600">ลองค้นหาด้วยคำอื่น หรือเลือกห้างสรรพสินค้าจากรายการด้านล่าง</p>
            </div>
          )}

          {/* No Malls Available */}
          {results.length === 0 && !query && !loadingMalls && !error && (
            <EmptyState
              type="malls"
              title="ไม่พบห้างสรรพสินค้า"
              description="ยังไม่มีข้อมูลห้างสรรพสินค้าในระบบ"
              actionLabel="สร้างห้างแรก"
              onAction={() => window.location.href = '/admin'}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;
