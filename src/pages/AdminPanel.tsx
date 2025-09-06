import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import { useAuth } from '@/config/contexts/AuthContext';
import { 
  listMalls
} from '@/services/firebase/firestore';
import { firebaseFirestore } from '@/services/firebaseFirestore';
import MallCreateDrawer from '@/legacy/admin/MallCreateDrawer';
import { StoreCreateDrawer } from '@/legacy/admin/StoreCreateDrawer';
import MallsTableView from '@/legacy/admin/MallsTableView';
import StoresTable from '@/legacy/admin/StoresTable';
import MallLogoManager from '@/components/admin/MallLogoManager';

const AdminPanel: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'malls' | 'stores' | 'logos'>('malls');
  const [showMallForm, setShowMallForm] = useState(false);
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [malls, setMalls] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const { user, logout } = useAuth();

  // Valid tabs for parameter validation
  const validTabs = new Set(['stores', 'malls', 'logos']);

  // Check URL parameter for initial tab with validation
  useEffect(() => {
    const tabParam = searchParams.get('tab')?.toLowerCase();
    const currentPath = window.location.pathname;
    
    // Check if we're on /admin/malls route
    if (currentPath === '/admin/malls') {
      setActiveTab('malls');
      setSearchParams({ tab: 'malls' });
    } else if (validTabs.has(tabParam || '')) {
      setActiveTab(tabParam as 'malls' | 'stores' | 'logos');
    } else if (tabParam) {
      // Invalid tab parameter - fallback to malls
      setActiveTab('malls');
      setSearchParams({ tab: 'malls' });
    }
  }, [searchParams, validTabs, setSearchParams]);

  // Handle deep-link for drawers
  useEffect(() => {
    const drawerParam = searchParams.get('drawer');
    if (drawerParam === 'create-mall') {
      setShowMallForm(true);
      // Remove drawer param from URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('drawer');
      setSearchParams(newParams);
    } else if (drawerParam === 'create-store') {
      setShowStoreForm(true);
      // Remove drawer param from URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('drawer');
      setSearchParams(newParams);
    }
  }, [searchParams, setSearchParams]);

  // Sync state with URL when tab changes
  const handleTabChange = (tab: 'malls' | 'stores') => {
    setActiveTab(tab);
    setSearchParams({ tab });
    
    // Analytics tracking for tab changes
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'admin_open_tab', {
        event_category: 'admin_navigation',
        event_label: tab,
        value: tab
      });
    }
  };

  // Admin guard
  useEffect(() => {
    if (!user) {
      navigate('/login', { 
        state: { 
          message: 'กรุณาเข้าสู่ระบบเพื่อเข้าถึง Admin Panel',
          redirectTo: '/admin'
        } 
      });
    }
  }, [user, navigate]);

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading data...');
      
      const mallsData = await listMalls();
      
      // ดึงร้านค้าจาก stores collection
      const storesData = await firebaseFirestore.getStores();
      
      console.log('📊 Malls loaded:', mallsData.length);
      console.log('📊 Stores loaded:', storesData.length);
      
      setMalls(mallsData);
      setStores(storesData);
      setLastUpdated(new Date().toLocaleString('th-TH'));
    } catch (error) {
      console.error('❌ Error loading data:', error);
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);




  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                อัปเดตล่าสุด: {lastUpdated}
              </div>
              <button
                onClick={loadData}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                title="รีเฟรชข้อมูล"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-700">{user?.email}</span>
              </div>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                title="ออกจากระบบ"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-8 mb-8">
          <button
            onClick={() => handleTabChange('malls')}
            className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 active:scale-[0.98] ${
              activeTab === 'malls'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            aria-label="แท็บจัดการห้างสรรพสินค้า"
            data-testid="malls-tab"
          >
            ห้างสรรพสินค้า ({malls.length})
          </button>
          <button
            onClick={() => handleTabChange('stores')}
            className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 active:scale-[0.98] ${
              activeTab === 'stores'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            aria-label="แท็บจัดการร้านค้า"
            data-testid="stores-tab"
          >
            ร้านค้า ({stores.length})
          </button>
          <button
            onClick={() => handleTabChange('logos')}
            className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 active:scale-[0.98] ${
              activeTab === 'logos'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            aria-label="แท็บจัดการโลโก้"
            data-testid="logos-tab"
          >
            🖼️ โลโก้ห้าง
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {activeTab === 'malls' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">จัดการห้างสรรพสินค้า</h2>
                  <p className="text-gray-600">เพิ่ม แก้ไข และลบข้อมูลห้างสรรพสินค้า</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowMallForm(true);
                      // Analytics tracking
                      if (typeof window !== 'undefined' && (window as any).gtag) {
                        (window as any).gtag('event', 'click_add_mall_form', {
                          event_category: 'admin_actions',
                          event_label: 'open_form'
                        });
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 focus:bg-green-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 active:scale-[0.98]"
                    aria-label="เปิดฟอร์มเพิ่มห้างใหม่"
                    data-testid="open-create-mall"
                  >
                    สร้างห้าง
                  </button>
                </div>
              </div>
              
              <MallsTableView onRefresh={loadData} />
            </div>
          )}

          {activeTab === 'stores' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">จัดการร้านค้า</h2>
                  <p className="text-gray-600">เพิ่ม แก้ไข และลบข้อมูลร้านค้า</p>
                </div>
                <button
                  onClick={() => setShowStoreForm(true)}
                  className="bg-green-600 hover:bg-green-700 focus:bg-green-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 active:scale-[0.98]"
                  aria-label="เปิดฟอร์มเพิ่มร้านค้าใหม่"
                  data-testid="open-create-store"
                >
                  เพิ่มร้าน
                </button>
              </div>
              
              <StoresTable stores={stores} malls={malls} onRefresh={loadData} />
            </div>
          )}

          {activeTab === 'logos' && (
            <div className="p-6">
              <MallLogoManager />
            </div>
          )}
        </div>
      </div>

      {/* Drawers */}
      <MallCreateDrawer
        open={showMallForm}
        onOpenChange={setShowMallForm}
      />

      <StoreCreateDrawer
        open={showStoreForm}
        onOpenChange={setShowStoreForm}
        onCreated={loadData}
      />
    </div>
  );
};

export default AdminPanel;
