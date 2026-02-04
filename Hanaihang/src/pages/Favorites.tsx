import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Store as StoreIcon, Trash2, ArrowRight } from 'lucide-react';

import { getMall, getStore } from '@/services/firebase/firestore';
import { Store, Mall } from '@/types/mall-system';
import FadeIn from '@/components/ui/FadeIn';

interface FavoriteStore {
  store: Store;
  mall: Mall;
}

const Favorites: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoriteStore[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);

      const favoriteIds = JSON.parse(localStorage.getItem('favorites') || '[]');

      if (favoriteIds.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      const favoriteStores: FavoriteStore[] = [];

      // Load stores in parallel
      await Promise.all(
        favoriteIds.map(async ({ mallId, storeId }: { mallId: string; storeId: string }) => {
          try {
            const [store, mall] = await Promise.all([
              getStore(mallId, storeId),
              getMall(mallId)
            ]);

            if (store && mall) {
              favoriteStores.push({ store, mall });
            }
          } catch (error) {
            console.error(`Error loading favorite ${mallId}/${storeId}:`, error);
          }
        })
      );

      setFavorites(favoriteStores);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = (mallId: string, storeId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    const favoriteIds = JSON.parse(localStorage.getItem('favorites') || '[]');
    const updatedFavorites = favoriteIds.filter(
      (fav: unknown) => !(fav.mallId === mallId && fav.storeId === storeId)
    );
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    setFavorites(prev => prev.filter(fav =>
      !(fav.mall.id === mallId && fav.store.id === storeId)
    ));
  };

  const handleStoreClick = (mall: Mall, store: Store) => {
    navigate(`/malls/${mall.id}/stores/${store.id}`); // Corrected: use mall.id instead of mall.name
  };

  const getStoreColor = (name: string) => {
    const colors = [
      'from-pink-500 to-rose-500',
      'from-purple-500 to-indigo-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-amber-500'
    ];
    return colors[name.length % colors.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-prompt">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดรายการโปรดของคุณ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-prompt pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-red-500 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-kanit">รายการโปรด</h1>
              <p className="text-gray-500 text-sm">ร้านที่คุณชื่นชอบและบันทึกไว้</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {favorites.length === 0 ? (
          <FadeIn>
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10 text-gray-300" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2 font-kanit">ยังไม่มีรายการโปรด</h2>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                คุณยังไม่ได้บันทึกร้านโปรด
                ลองสำรวจร้านค้าที่น่าสนใจและกดหัวใจเพื่อบันทึกไว้ที่นี่
              </p>
              <button
                onClick={() => navigate('/search')}
                className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary-200 hover:shadow-primary-300 flex items-center mx-auto space-x-2"
              >
                <span>ค้นหาร้านค้า</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </FadeIn>
        ) : (
          <FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {favorites.map(({ store, mall }) => (
                <div
                  key={`${mall.id}-${store.id}`}
                  onClick={() => handleStoreClick(mall, store)}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-100 transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="flex items-start space-x-4 relative z-10">
                    {/* Store Icon */}
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getStoreColor(store.name)} flex items-center justify-center shrink-0 shadow-inner`}>
                      <span className="text-2xl font-bold text-white drop-shadow-sm">
                        {store.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 pt-1">
                      <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-primary-700 transition-colors font-kanit">
                        {store.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <StoreIcon className="w-3.5 h-3.5 mr-1" />
                        <span className="truncate">{store.category || 'ทั่วไป'}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 mr-1" />
                        <span className="truncate">{mall.displayName} • ชั้น {store.floorId}</span>
                      </div>
                    </div>

                    {/* Delete Action */}
                    <button
                      onClick={(e) => removeFavorite(mall.id!, store.id!, e)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors absolute top-0 right-0"
                      title="ลบออกจากรายการโปรด"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Status Bar */}
                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-50">
                    <div className={`text-xs font-medium px-2.5 py-1 rounded-lg ${store.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                      {store.status === 'Active' ? 'เปิดบริการ' : 'ปิด'}
                    </div>
                    <div className="flex items-center text-xs text-primary-600 font-medium group-hover:underline">
                      ดูรายละเอียด <ArrowRight className="w-3 h-3 ml-1" />
                    </div>
                  </div>

                  {/* Hover Decoration */}
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary-50 rounded-full opacity-0 group-hover:opacity-50 transition-opacity blur-xl"></div>
                </div>
              ))}
            </div>

            <p className="text-center text-gray-400 text-sm mt-8">
              แสดงทั้งหมด {favorites.length} รายการ
            </p>
          </FadeIn>
        )}
      </main>
    </div>
  );
};

export default Favorites;
