import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, Clock, Building, Store, MapPin, ArrowRight, Heart } from 'lucide-react';
import { getStores, getFloors, getActivePromotions } from '../services/api';
import { malls } from '../data/malls';
import { isStoreOpen } from '../utils';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import MallHeroCampaign from '../components/MallHeroCampaign';

const MallHome: React.FC = () => {
  const { mallId } = useParams<{ mallId: string }>();
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const mall = malls.find(m => m.id === mallId) || null;
  const floors = getFloors(mallId || '');
  const stores = getStores(mallId || '');
  const promotions = getActivePromotions(mallId || '');
  const activeCampaign = promotions[0];

  if (!mall) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">ไม่พบข้อมูลห้าง</p>
          <Button onClick={() => window.history.back()}>
            กลับไปหน้าแรก
          </Button>
        </div>
      </div>
    );
  }

  // Filter stores by floor and search
  const filteredStores = stores.filter(store => {
    const matchesFloor = selectedFloor === 'all' || store.floor === selectedFloor;
    const matchesSearch = !searchQuery || 
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFloor && matchesSearch;
  });

  const getStoreStatus = (store: any) => {
    const status = isStoreOpen(store);
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
                   const floorDisplay = floor.id === 'G' ? 'ชั้น G' : 
                     floor.id === '1' ? '1st Floor' :
                     floor.id === '2' ? '2nd Floor' :
                     floor.id === '3' ? '3rd Floor' :
                     floor.id === '4' ? '4th Floor' :
                     floor.id === '5' ? '5th Floor' :
                     floor.id === '6' ? '6th Floor' : `ชั้น ${floor.name}`;
                   
                   return (
                     <button
                       key={floor.id}
                       className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                         selectedFloor === floor.id 
                           ? 'bg-green-600 text-white' 
                           : 'text-gray-600 hover:bg-white hover:text-green-600'
                       }`}
                       onClick={() => setSelectedFloor(floor.id)}
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
               const floorDisplay = floor.id === 'G' ? 'G' : 
                 floor.id === '1' ? '1st' :
                 floor.id === '2' ? '2nd' :
                 floor.id === '3' ? '3rd' :
                 floor.id === '4' ? '4th' :
                 floor.id === '5' ? '5th' :
                 floor.id === '6' ? '6th' : floor.name;
               
               return (
                 <button
                   key={floor.id}
                   className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                     selectedFloor === floor.id 
                       ? 'bg-green-600 text-white' 
                       : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                   }`}
                   onClick={() => setSelectedFloor(floor.id)}
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
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">{mall.name}</h1>
          <p className="text-gray-600">เปิด {mall.hours.open}-{mall.hours.close} • {mall.floors} ชั้น • {stores.length} ร้าน</p>
        </div>

        {/* Campaign Banner */}
        <MallHeroCampaign campaign={activeCampaign} />

        {/* ABOUT + FACTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* About */}
          <div className="lg:col-span-2 bg-white border rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-2">เกี่ยวกับ {mall.name}</h2>
            <p className="text-sm text-gray-700 leading-6">
              {mall.about || '-'}
            </p>
          </div>

          {/* Facts */}
          <div className="bg-white border rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">สรุปตัวเลข</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex justify-between"><span>ชั้นอาคาร</span><span>{mall.floors} ชั้น (+ ใต้ดิน {mall.basements || 0})</span></li>
              {mall.grossAreaSqm && <li className="flex justify-between"><span>Gross Area</span><span>{mall.grossAreaSqm.toLocaleString()} ตร.ม.</span></li>}
              {mall.leasableAreaSqm && <li className="flex justify-between"><span>Leasable Area</span><span>{mall.leasableAreaSqm.toLocaleString()} ตร.ม.</span></li>}
              {mall.parkingSpaces && <li className="flex justify-between"><span>ที่จอดรถ</span><span>{mall.parkingSpaces.toLocaleString()} คัน</span></li>}
              {mall.totalShops && <li className="flex justify-between"><span>จำนวนร้าน</span><span>{mall.totalShops.toLocaleString()} ร้าน</span></li>}
              {mall.investmentTHB && <li className="flex justify-between"><span>เงินลงทุน</span><span>{mall.investmentTHB.toLocaleString()} ล้านบาท</span></li>}
              <li className="flex justify-between"><span>ช่วงราคา</span><span>{mall.priceRange || '-'}</span></li>
              <li className="flex justify-between"><span>โทร</span><span>{mall.phone || '-'}</span></li>
              <li className="flex justify-between"><span>เวลาเปิด</span><span>{mall.hours.open} - {mall.hours.close}</span></li>
            </ul>

            {/* Links */}
            <div className="mt-3 flex flex-wrap gap-2">
              {mall.website && (
                <a href={mall.website} target="_blank" className="text-xs px-2 py-1 border rounded-lg hover:bg-gray-50">เว็บไซต์</a>
              )}
              {mall.socials?.tiktok && (
                <a href={mall.socials.tiktok} target="_blank" className="text-xs px-2 py-1 border rounded-lg hover:bg-gray-50">TikTok</a>
              )}
              {mall.socials?.x && (
                <a href={mall.socials.x} target="_blank" className="text-xs px-2 py-1 border rounded-lg hover:bg-gray-50">X (Twitter)</a>
              )}
            </div>
          </div>
        </div>

        {/* Anchors */}
        {mall.anchors?.length ? (
          <div className="bg-white border rounded-xl p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3">Anchor Tenants</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {mall.anchors.map((a, idx) => (
                <div key={idx} className="border rounded-lg p-3">
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {a.areaSqm ? `${a.areaSqm.toLocaleString()} ตร.ม.` : '-'}
                    {a.notes ? ` • ${a.notes}` : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

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
            const status = getStoreStatus(store);
            return (
              <div key={store.id} className="store-card bg-white p-4 rounded-xl shadow-sm border hover:shadow-md transition-shadow" data-floor={store.floor} data-category={store.category}>
                <div className="flex items-start justify-between mb-3">
                                     <div>
                     <h3 className="font-medium text-gray-900">{store.name}</h3>
                     <p className="text-gray-600 text-sm">
                       {store.floor === 'G' ? 'ชั้น G' : 
                         store.floor === '1' ? '1st Floor' :
                         store.floor === '2' ? '2nd Floor' :
                         store.floor === '3' ? '3rd Floor' :
                         store.floor === '4' ? '4th Floor' :
                         store.floor === '5' ? '5th Floor' :
                         store.floor === '6' ? '6th Floor' : `ชั้น ${store.floor}`} • {store.category}
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

