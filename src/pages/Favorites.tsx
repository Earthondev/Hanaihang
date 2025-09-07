import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { getMall, getStore } from '@/services/firebase/firestore';
import { Store } from '@/types/mall-system';

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
      
      // Get favorites from localStorage
      const favoriteIds = JSON.parse(localStorage.getItem('favorites') || '[]');
      
      if (favoriteIds.length === 0) {
        setFavorites([]);
        return;
      }

      // Load store and mall data for each favorite
      const favoriteStores: FavoriteStore[] = [];
      
      for (const { mallId, storeId } of favoriteIds) {
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
      }
      
      setFavorites(favoriteStores);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = (_mallId: string, storeId: string) => {
    const favoriteIds = JSON.parse(localStorage.getItem('favorites') || '[]');
    const updatedFavorites = favoriteIds.filter(
      (fav: any) => !(fav.mallId === mallId && fav.storeId === storeId)
    );
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    setFavorites(favorites.filter(fav => 
      !(fav.mall.id === mallId && fav.store.id === storeId)
    ));
  };

  const handleStoreClick = (mall: Mall, store: Store) => {
    navigate(`/malls/${mall.name}/stores/${store.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดรายการโปรด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">รายการโปรด</h1>
          <p className="text-gray-600">ร้านที่คุณชื่นชอบ</p>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <p className="text-gray-500 mb-4">คุณยังไม่มีรายการโปรด</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              ไปค้นหาร้าน
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map(({ store, mall }) => (
              <div
                key={`${mall.id}-${store.id}`}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 
                    className="text-lg font-semibold text-gray-900 flex-1 cursor-pointer hover:text-green-600"
                    onClick={() => handleStoreClick(mall, store)}
                  >
                    {store.name}
                  </h3>
                  <button
                    onClick={() => removeFavorite(mall.id!, store.id!)}
                    className="text-red-500 hover:text-red-700 ml-2"
                    title="ลบออกจากรายการโปรด"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{store.category}</p>
                <p className="text-sm text-gray-500 mb-2">{mall.displayName}</p>
                
                {store.unit && (
                  <p className="text-sm text-gray-500 mb-2">📍 {store.unit}</p>
                )}
                
                {store.hours && (
                  <p className="text-sm text-green-600 mb-2">🕒 {store.hours}</p>
                )}
                
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  store.status === 'Active' ? 'bg-green-100 text-green-800' :
                  store.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {store.status === 'Active' ? 'เปิด' : 
                   store.status === 'Maintenance' ? 'ปิดปรับปรุง' : 'ปิด'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
