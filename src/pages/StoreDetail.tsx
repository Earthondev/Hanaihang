
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Phone, 
  Clock, 
  Globe, 
  Share2, 
  Heart, 
  ChevronLeft, 
  ChevronRight,
  Building,
  ShoppingBag,
  Tag,
  Truck
} from 'lucide-react';
import { getStores } from '../services/api';
import { malls } from '../data/malls';
import { isStoreOpen } from '../utils';

const StoreDetail: React.FC = () => {
  const { mallId, storeId } = useParams<{ mallId: string; storeId: string }>();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const mall = malls.find(m => m.id === mallId) || null;
  const stores = getStores(mallId || '');
  const store = stores.find(s => s.id === storeId) || null;

  // Carousel images (placeholder data)
  const carouselImages = [
    { id: 1, title: 'หน้าร้าน', subtitle: `${store?.name} ชั้น ${store?.floor}`, color: 'from-gray-100 to-gray-200', iconColor: 'bg-gray-300', icon: Building },
    { id: 2, title: 'บรรยากาศภายในร้าน', subtitle: 'คอลเลกชั่นใหม่', color: 'from-blue-100 to-blue-200', iconColor: 'bg-blue-300', icon: ShoppingBag },
    { id: 3, title: 'โปรโมชั่นพิเศษ', subtitle: 'ลดสูงสุด 50%', color: 'from-purple-100 to-purple-200', iconColor: 'bg-purple-300', icon: Tag }
  ];

  // Nearby stores (placeholder data)
  const nearbyStores = [
    { id: 'hm', name: 'H&M', unit: 'ยูนิต 2-15', distance: '50 ม.', status: 'open', color: 'bg-red-100', textColor: 'text-red-600' },
    { id: 'uniqlo', name: 'Uniqlo', unit: 'ยูนิต 2-30', distance: '75 ม.', status: 'open', color: 'bg-red-100', textColor: 'text-red-600' },
    { id: 'mango', name: 'Mango', unit: 'ยูนิต 2-18', distance: '90 ม.', status: 'open', color: 'bg-yellow-100', textColor: 'text-yellow-600' }
  ];

  // Promotions (placeholder data)
  const promotions = [
    {
      id: 1,
      title: 'Zara End of Season Sale',
      description: 'ลดสูงสุด 50% สินค้าเลือกสรร',
      endDate: 'ถึง 31 ธ.ค.',
      tag: 'Limited Time',
      tagColor: 'bg-red-100 text-red-700',
      bgColor: 'from-purple-50 to-pink-50',
      borderColor: 'border-purple-200',
      iconColor: 'bg-purple-100',
      icon: Tag
    },
    {
      id: 2,
      title: 'Central Credit Card Exclusive',
      description: 'ลด 10% เพิ่มเติมสำหรับสมาชิกบัตรเครดิต Central',
      endDate: 'ทุกวัน',
      tag: 'สมาชิก',
      tagColor: 'bg-green-100 text-green-700',
      bgColor: 'from-blue-50 to-cyan-50',
      borderColor: 'border-blue-200',
      iconColor: 'bg-blue-100',
      icon: Tag
    },
    {
      id: 3,
      title: 'ฟรีค่าจัดส่ง',
      description: 'เมื่อซื้อครบ 1,500 บาท สำหรับการสั่งซื้อออนไลน์',
      endDate: 'Online',
      tag: 'Min 1,500฿',
      tagColor: 'bg-orange-100 text-orange-700',
      bgColor: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-200',
      iconColor: 'bg-green-100',
      icon: Truck
    }
  ];

  useEffect(() => {
    // Auto-play carousel
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [carouselImages.length]);

  if (!store || !mall) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">ไม่พบข้อมูลร้าน</p>
          <button 
            onClick={() => navigate(-1)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
          >
            กลับไปหน้าเดิม
          </button>
        </div>
      </div>
    );
  }

  // Parse store hours
  const storeHours = typeof store.hours === 'string' ? 
    { open: '10:00', close: '22:00' } : 
    store.hours;

  // Create a compatible store object for isStoreOpen function
  const compatibleStore = {
    ...store,
    mall_id: mallId || '',
    zone: '',
    open_time: storeHours.open,
    close_time: storeHours.close,
    images: [],
    tags: store.tags || [],
    features: store.features || [],
    x: 0,
    y: 0
  };

  const storeStatus = isStoreOpen(compatibleStore);
  const isOpen = storeStatus === 'open';

  const getFloorDisplay = (floor: string) => {
    return floor === 'G' ? 'ชั้น G' : 
      floor === '1' ? '1st Floor' :
      floor === '2' ? '2nd Floor' :
      floor === '3' ? '3rd Floor' :
      floor === '4' ? '4th Floor' :
      floor === '5' ? '5th Floor' :
      floor === '6' ? '6th Floor' : `ชั้น ${floor}`;
  };

  const showToast = (message: string) => {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.className = 'fixed top-20 right-4 bg-green-100 border border-green-300 p-4 rounded-xl flex items-center space-x-3 z-50 transform translate-x-full transition-transform duration-300';
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Back Button & Title */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="กลับไปหน้าก่อนหน้า"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Building className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-lg font-semibold">
                  <span className="text-gray-900">HaaNai</span><span className="text-green-600">Hang</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => showToast('คัดลอกลิงก์แล้ว!')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Share2 className="w-5 h-5 text-gray-600" />
              </button>
              <button 
                onClick={() => {
                  setIsFavorite(!isFavorite);
                  showToast(isFavorite ? 'ลบออกจากรายการโปรดแล้ว' : 'เพิ่มในรายการโปรดแล้ว');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Heart 
                  className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-600'}`} 
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Hero Section */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-6">
              {/* Store Logo */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-3xl font-bold">{store.name.slice(0, 4).toUpperCase()}</span>
                </div>
              </div>

              {/* Store Info */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                  <div>
                    <h1 className="text-3xl font-semibold text-gray-900 mb-2">{store.name}</h1>
                    <p className="text-lg text-gray-600 mb-3">{store.category} • {store.shortDesc || store.description}</p>
                    
                    {/* Status Badge */}
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 ${isOpen ? 'bg-green-500' : 'bg-red-500'} rounded-full animate-pulse`}></div>
                        <span className={`px-3 py-1 text-sm rounded-lg font-medium ${
                          isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {isOpen ? 'เปิดอยู่' : 'ปิดแล้ว'}
                        </span>
                      </div>
                                             <span className="text-sm text-gray-600">
                         {isOpen ? `ปิด ${storeHours.close} น.` : `เปิด ${storeHours.open} น.`}
                       </span>
                     </div>

                     {/* Tags */}
                     <div className="flex flex-wrap gap-2">
                       {store.tags?.map((tag, index) => (
                         <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-lg font-medium">
                           {tag}
                         </span>
                       ))}
                       {store.features?.map((feature, index) => (
                         <span key={index} className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-lg font-medium">
                           {feature}
                         </span>
                       ))}
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Store Metadata */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">ข้อมูลร้าน</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Location Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">ตำแหน่ง</p>
                  <p className="font-medium text-gray-900">{getFloorDisplay(store.floor)} • {store.unit}</p>
                </div>
              </div>

              {store.phone && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">โทรศัพท์</p>
                    <p className="font-medium text-gray-900">{store.phone}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Hours & Links */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">เวลาทำการ</p>
                  <p className="font-medium text-gray-900">{storeHours.open} - {storeHours.close} น.</p>
                  <p className="text-sm text-gray-600">ทุกวัน</p>
                </div>
              </div>

              {store.website && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">เว็บไซต์</p>
                    <a 
                      href={store.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-green-600 hover:text-green-700"
                    >
                      {store.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Social Links */}
          {(store.facebook || store.instagram) && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600 mb-3">ติดตามเรา</p>
              <div className="flex space-x-3">
                {store.facebook && (
                  <a 
                    href={store.facebook} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}
                {store.instagram && (
                  <a 
                    href={store.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-pink-100 hover:bg-pink-200 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Main Action Button */}
        <div className="mb-6">
          <button 
            onClick={() => showToast(`กำลังเปิดแผนที่${getFloorDisplay(store.floor)}...`)}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-2xl font-medium text-lg flex items-center justify-center space-x-3 transition-colors shadow-lg"
          >
            <MapPin className="w-6 h-6" />
            <span>ดูตำแหน่งบนแผนที่{getFloorDisplay(store.floor)}</span>
          </button>
        </div>

        {/* Image Carousel */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden mb-6">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">ภาพร้าน</h2>
          </div>
          
          <div className="relative">
            <div 
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {carouselImages.map((image, index) => {
                const IconComponent = image.icon;
                return (
                  <div key={image.id} className="w-full flex-shrink-0">
                    <div className={`aspect-video bg-gradient-to-br ${image.color} flex items-center justify-center`}>
                      <div className="text-center">
                        <div className={`w-16 h-16 ${image.iconColor} rounded-full mx-auto mb-3 flex items-center justify-center`}>
                          <IconComponent className="w-8 h-8 text-gray-600" />
                        </div>
                        <p className="text-gray-600 font-medium">{image.title}</p>
                        <p className="text-sm text-gray-500">{image.subtitle}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Carousel Controls */}
            <button 
              onClick={() => setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <button 
              onClick={() => setCurrentSlide((prev) => (prev + 1) % carouselImages.length)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
            
            {/* Carousel Indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {carouselImages.map((_, index) => (
                <button 
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSlide ? 'bg-white' : 'bg-white/50'
                  }`}
                  aria-label={`ไปที่รูปภาพที่ ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Nearby Stores */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">ร้านใกล้เคียง</h2>
            <button className="text-green-600 hover:text-green-700 font-medium text-sm" aria-label="ดูร้านใกล้เคียงทั้งหมด">ดูทั้งหมด</button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nearbyStores.map((nearbyStore) => (
              <div 
                key={nearbyStore.id}
                onClick={() => showToast(`กำลังเปิดหน้า ${nearbyStore.name}...`)}
                className="border border-gray-200 rounded-xl p-4 hover:border-green-200 hover:bg-green-50/10 transition-all cursor-pointer"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-12 h-12 ${nearbyStore.color} rounded-lg flex items-center justify-center`}>
                    <span className={`${nearbyStore.textColor} font-bold`}>
                      {nearbyStore.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{nearbyStore.name}</h3>
                    <p className="text-sm text-gray-600">{nearbyStore.unit}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-medium">
                    {nearbyStore.status === 'open' ? 'เปิดอยู่' : 'ปิดแล้ว'}
                  </span>
                  <span className="text-xs text-gray-600">{nearbyStore.distance}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Promotions */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">โปรโมชั่นที่เกี่ยวข้อง</h2>
            <button className="text-green-600 hover:text-green-700 font-medium text-sm" aria-label="ดูโปรโมชั่นทั้งหมด">ดูทั้งหมด</button>
          </div>
          
          <div className="space-y-4">
            {promotions.map((promotion) => {
              const IconComponent = promotion.icon;
              return (
                <div 
                  key={promotion.id}
                  className={`border ${promotion.borderColor} bg-gradient-to-r ${promotion.bgColor} rounded-xl p-4`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`w-16 h-16 ${promotion.iconColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <IconComponent className="w-8 h-8 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{promotion.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{promotion.description}</p>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-medium">
                          {promotion.endDate}
                        </span>
                        <span className={`px-2 py-1 ${promotion.tagColor} text-xs rounded font-medium`}>
                          {promotion.tag}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => showToast('กำลังเปิดรายละเอียดโปรโมชั่น...')}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium transition-colors"
                      aria-label={`ดูรายละเอียดโปรโมชั่น ${promotion.title}`}
                    >
                      ดูเพิ่มเติม
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StoreDetail;
