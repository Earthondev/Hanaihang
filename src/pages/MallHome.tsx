import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, Clock, Building, MapPin, ArrowRight, Heart, Store } from 'lucide-react';

import { getStores, getFloors, getActivePromotions } from '@/legacy/services/api';
import { getMallByName, listFloors, listStores } from '@/services/firebase/firestore';
import { useRealtimeMall } from '@/hooks/useRealtimeMalls';
import { useRealtimeStores } from '@/hooks/useRealtimeStores';
import { Mall, Floor, Store as StoreType } from '@/types/mall-system';
import { isStoreOpen } from '@/legacy/utils';
import Card from '@/ui/Card';
import Input from '@/ui/Input';
import Button from '@/ui/Button';
import MallHeroCampaign from '@/legacy/components/MallHeroCampaign';

const MallHome: React.FC = () => {
  const { mallId } = useParams<{ mallId: string }>();
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ใช้ real-time data สำหรับห้าง
  const { mall, loading: mallLoading, error: mallError } = useRealtimeMall(mallId || '');
  
  // ใช้ real-time data สำหรับร้าน
  const { stores, loading: storesLoading, error: storesError } = useRealtimeStores(mall?.id || '');

  // Load floors data (ยังใช้ one-time fetch เพราะไม่มี real-time listener สำหรับ floors)
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
  useEffect(() => {
    setLoading(mallLoading || storesLoading);
    setError(mallError || storesError);
  }, [mallLoading, storesLoading, mallError, storesError]);

  const promotions = getActivePromotions(mallId || '');
  const activeCampaign = promotions[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูลห้าง...</p>
        </div>
      </div>
    );
  }

  if (error || !mall) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'ไม่พบข้อมูลห้าง'}</p>
          <Button onClick={() => window.history.back()}>
            กลับไปหน้าแรก
          </Button>
        </div>
      </div>
    );
  }

  // Filter stores by floor and search
  const filteredStores = stores.filter(store => {
    const matchesFloor = selectedFloor === 'all' || store.floorId === selectedFloor;
    const matchesSearch = !searchQuery || 
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (store.category && store.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFloor && matchesSearch;
  });

  const getStoreStatus = (store: any) => {
    const _status = isStoreOpen(store);
    return {
      status,
      text: status === 'open' ? 'เปิด' : status === 'closed' ? 'ปิด' : 'ไม่ทราบ',
      color: status === 'open' ? 'text-green-600' : status === 'closed' ? 'text-red-600' : 'text-gray-600'
    };
  };

  const floorData = {
    'all': { title: 'แสดงร้านค้าทั้งหมด', desc: 'ร้านค้าและบริการทุกชั้น' },
    'G': { title: 'ชั้น G (ชั้นล่าง)', desc: 'ร้านอาหาร, ซูเปอร์มาร์เก็ต' },
    '1': { title: '1st Floor', desc: 'แฟชั่น, เสื้อผ้า' },
    '2': { title: '2nd Floor', desc: 'เครื่องสำอาง, ของใช้ส่วนตัว' },
    '3': { title: '3rd Floor', desc: 'บริการ, ธนาคาร' },
    '4': { title: '4th Floor', desc: 'บันเทิง, โรงภาพยนตร์' },
    '5': { title: '5th Floor', desc: 'ฟิตเนส, กีฬา' },
    '6': { title: '6th Floor', desc: 'ร้านอาหาร, Food Court' }
  };

  const currentFloorInfo = floorData[selectedFloor as keyof typeof floorData] || floorData.all;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between space-x-6">
            {/* Logo (Left) */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-lg font-semibold">
                  <span className="text-gray-900">HaaNai</span><span className="text-green-600">Hang</span>
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
                                 {floors.map((floor) => {
                   const floorDisplay = floor.label === 'G' ? 'ชั้น G' : 
                     floor.label === '1' ? '1st Floor' :
                     floor.label === '2' ? '2nd Floor' :
                     floor.label === '3' ? '3rd Floor' :
                     floor.label === '4' ? '4th Floor' :
                     floor.label === '5' ? '5th Floor' :
                     floor.label === '6' ? '6th Floor' : `ชั้น ${floor.label}`;
                   
                   return (
                     <button
                       key={floor.id}
                       className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                         selectedFloor === floor.label 
                           ? 'bg-green-600 text-white' 
                           : 'text-gray-600 hover:bg-white hover:text-green-600'
                       }`}
                       onClick={() => setSelectedFloor(floor.label)}
                     >
                       {floorDisplay}
                     </button>
                   );
                 })}
              </div>
            </div>

            {/* Search Box and Explore Button (Right) */}
            <div className="flex-shrink-0 flex items-center space-x-3">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="ค้นหาร้านได้ตลอดเวลา..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 lg:w-96 pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none text-gray-900 placeholder-gray-500 transition-all"
                  autoComplete="off"
                />
                <Search className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 transform -translate-y-1/2" />
                
                {/* Clear button */}
                {searchQuery && (
                  <button 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                    onClick={() => setSearchQuery('')}
                    aria-label="ล้างข้อความค้นหา"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Explore Button */}
              <Link 
                to={`/mall/${mallId}/explore`}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-medium transition-colors whitespace-nowrap"
                aria-label="สำรวจร้านค้าในห้างสรรพสินค้า"
              >
                สำรวจร้าน
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Floor Picker (Floating Bottom) */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
        <div className="bg-white rounded-2xl shadow-lg border p-3">
          <div className="flex items-center justify-between space-x-2">
            <button 
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                selectedFloor === 'all' 
                  ? 'bg-green-600 text-white' 
                  : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
              }`}
              onClick={() => setSelectedFloor('all')}
            >
              ทั้งหมด
            </button>
                         {floors.slice(0, 4).map((floor) => {
               const floorDisplay = floor.label === 'G' ? 'G' : 
                 floor.label === '1' ? '1st' :
                 floor.label === '2' ? '2nd' :
                 floor.label === '3' ? '3rd' :
                 floor.label === '4' ? '4th' :
                 floor.label === '5' ? '5th' :
                 floor.label === '6' ? '6th' : floor.label;
               
               return (
                 <button
                   key={floor.id}
                   className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                     selectedFloor === floor.label 
                       ? 'bg-green-600 text-white' 
                       : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                   }`}
                   onClick={() => setSelectedFloor(floor.label)}
                 >
                   {floorDisplay}
                 </button>
               );
             })}
            {floors.length > 4 && (
              <button className="flex-1 py-2 px-3 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-xl text-sm font-medium transition-all">
                ···
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
        {/* Mall Info */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">{mall.displayName}</h1>
          <p className="text-gray-600">เปิด {mall.openTime || mall.hours?.open || '10:00'}-{mall.closeTime || mall.hours?.close || '22:00'} • {floors.length} ชั้น • {stores.length} ร้าน</p>
        </div>

        {/* Campaign Banner */}
        <MallHeroCampaign campaign={activeCampaign} />

        {/* ABOUT + FACTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* About */}
          <div className="lg:col-span-2 bg-white border rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-2">เกี่ยวกับ {mall.displayName}</h2>
            <p className="text-sm text-gray-700 leading-6">
              {mall.address || '-'}
            </p>
          </div>

          {/* Facts */}
          <div className="bg-white border rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">สรุปตัวเลข</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex justify-between"><span>ชั้นอาคาร</span><span>{floors.length} ชั้น</span></li>
              <li className="flex justify-between"><span>จำนวนร้าน</span><span>{stores.length} ร้าน</span></li>
              <li className="flex justify-between"><span>เขต</span><span>{mall.district || '-'}</span></li>
              <li className="flex justify-between"><span>เวลาเปิด</span><span>{mall.hours?.open || '10:00'} - {mall.hours?.close || '22:00'}</span></li>
            </ul>

            {/* Links */}
            <div className="mt-3 flex flex-wrap gap-2">
              {mall.contact?.website && (
                <a href={mall.contact.website} target="_blank" className="text-xs px-2 py-1 border rounded-lg hover:bg-gray-50">เว็บไซต์</a>
              )}
              {mall.contact?.social && (
                <a href={mall.contact.social} target="_blank" className="text-xs px-2 py-1 border rounded-lg hover:bg-gray-50">Social Media</a>
              )}
            </div>
          </div>
        </div>

        {/* Store Categories */}
        {stores.length > 0 && (
          <div className="bg-white border rounded-xl p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3">หมวดหมู่ร้านค้า</h3>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(stores.map(s => s.category).filter(Boolean))).map((category, idx) => (
                <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Current Floor Display */}
        <div className="mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Building className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{currentFloorInfo.title}</h2>
                <p className="text-gray-600 text-sm">{currentFloorInfo.desc}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Store Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStores.map((store) => {
            const _status = getStoreStatus(store);
            return (
              <div key={store.id} className="store-card bg-white p-4 rounded-xl shadow-sm border hover:shadow-md transition-shadow" data-floor={store.floorId} data-category={store.category}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{store.name}</h3>
                    <p className="text-gray-600 text-sm">
                      {store.floorId === 'G' ? 'ชั้น G' : 
                        store.floorId === '1' ? '1st Floor' :
                        store.floorId === '2' ? '2nd Floor' :
                        store.floorId === '3' ? '3rd Floor' :
                        store.floorId === '4' ? '4th Floor' :
                        store.floorId === '5' ? '5th Floor' :
                        store.floorId === '6' ? '6th Floor' : `ชั้น ${store.floorId}`} • {store.category || 'ทั่วไป'}
                    </p>
                  </div>
                  <button className="p-2 hover:bg-green-50 rounded-lg transition-colors" aria-label={`เพิ่ม ${store.name} ลงในรายการโปรด`}>
                    <Heart className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <Link 
                  to={`/mall/${mallId}/stores/${store.id}`}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors block text-center"
                >
                  ดูตำแหน่ง
                </Link>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredStores.length === 0 && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Store className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                ไม่พบร้านค้า
              </h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                ไม่พบร้านค้าที่ตรงกับเงื่อนไขการค้นหา<br />
                ลองเปลี่ยนคำค้นหาหรือเลือกชั้นอื่น
              </p>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedFloor('all');
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-medium transition-colors shadow-sm"
                aria-label="ล้างการค้นหาและตัวกรองทั้งหมด"
              >
                ล้างการค้นหา
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MallHome;

