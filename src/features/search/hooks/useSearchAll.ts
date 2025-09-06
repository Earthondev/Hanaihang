import { useState, useCallback, useRef } from 'react';
import { collection, getDocs, query, where, orderBy, limit, startAt, endAt } from 'firebase/firestore';

import { db } from '@/services/firebase/firebase';
import { SearchResult, SearchOptions, Mall, Store } from '@/types/mall-system';

// Helper function to convert search keyword to lowercase
const toKey = (s: string): string => (s || "").trim().toLowerCase();

// Helper function to calculate distance between two points using Haversine formula
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const toRad = (x: number) => x * Math.PI / 180;
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + 
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.asin(Math.sqrt(a));
  return R * c;
};

// Helper function to normalize text for search (unused but kept for future use)
// const normalizeText = (text: string): string => {
//   return text
//     .toLowerCase()
//     .trim()
//     .replace(/[^\u0E00-\u0E7Fa-z0-9\s]/g, '') // Keep Thai, English, numbers, spaces
//     .replace(/\s+/g, ' ');
// };

export function useSearchAll() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const searchAll = useCallback(async (options: SearchOptions): Promise<SearchResult> => {
    const { keyword, userLocation, limit: limitCount = 50, includeMalls = true, includeStores = true } = options;
    
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const key = toKey(keyword);
      const results: SearchResult = { malls: [], stores: [] };

      // 1) Search malls by name (prefix search)
      if (includeMalls) {
        try {
          const mallsQ = query(
            collection(db, 'malls'),
            orderBy('nameLower'),
            startAt(key),
            endAt(key + '\uf8ff'),
            limit(20)
          );
          const mallsSnap = await getDocs(mallsQ);
          results.malls = mallsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Mall));
        } catch (err) {
          console.warn('Mall search failed, using fallback:', err);
          // Fallback to client-side filtering if index doesn't exist
          const allMallsQ = query(collection(db, 'malls'), limit(100));
          const allMallsSnap = await getDocs(allMallsQ);
          const allMalls = allMallsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Mall));
          
          // Client-side filtering
          results.malls = allMalls.filter(mall => {
            const searchTerm = keyword.toLowerCase();
            return (
              mall.displayName?.toLowerCase().includes(searchTerm) ||
              mall.name?.toLowerCase().includes(searchTerm) ||
              mall.district?.toLowerCase().includes(searchTerm) ||
              mall.address?.toLowerCase().includes(searchTerm)
            );
          }).slice(0, 20);
        }
      }

      // 2) Search stores by name/brand (prefix search)
      if (includeStores) {
        try {
          const storesQ = query(
            collection(db, 'stores'),
            orderBy('nameLower'),
            startAt(key),
            endAt(key + '\uf8ff'),
            limit(limitCount)
          );
          const storesSnap = await getDocs(storesQ);
          let stores = storesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Store));

          // 3) Enrich store data with mall information
          const mallIds = [...new Set(stores.map(s => s.mallId).filter(Boolean))];
          const mallMap = new Map<string, Mall>();
          
          if (mallIds.length > 0) {
            const mallPromises = mallIds.map(async (mallId) => {
              try {
                const mallQ = query(collection(db, 'malls'), where('__name__', '==', mallId));
                const mallSnap = await getDocs(mallQ);
                if (!mallSnap.empty) {
                  const mall = { id: mallSnap.docs[0].id, ...mallSnap.docs[0].data() } as Mall;
                  mallMap.set(mallId, mall);
                }
              } catch (err) {
                console.warn(`Failed to fetch mall ${mallId}:`, err);
              }
            });
            await Promise.all(mallPromises);
          }

          // 4) Add mall info and coordinates to stores
          stores = stores.map(store => {
            const mall = store.mallId ? mallMap.get(store.mallId) : null;
            if (mall) {
              return {
                ...store,
                mallName: mall.displayName,
                mallSlug: mall.name,
                // Use mall coordinates if store doesn't have its own
                location: store.location?.lat ? store.location : mall.coords ? {
                  lat: mall.coords.lat,
                  lng: mall.coords.lng
                } : undefined
              };
            }
            return store;
          });

          // 5) Calculate distances if user location is provided
          if (userLocation?.lat && userLocation?.lng) {
            stores = stores
              .filter(store => {
                const coords = store.location || (store.mallId && mallMap.get(store.mallId)?.coords);
                return coords?.lat && coords?.lng;
              })
              .map(store => {
                const coords = store.location || (store.mallId && mallMap.get(store.mallId)?.coords);
                if (coords?.lat && coords?.lng) {
                  const distance = calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    coords.lat,
                    coords.lng
                  );
                  return { ...store, distanceKm: distance } as Store & { distanceKm: number };
                }
                return store;
              })
              .sort((a, b) => ((a as Store & { distanceKm?: number }).distanceKm ?? 999) - ((b as Store & { distanceKm?: number }).distanceKm ?? 999));
          }

          results.stores = stores;
        } catch (err) {
          console.warn('Store search failed, using fallback:', err);
          // Fallback to client-side filtering if index doesn't exist
          const allStoresQ = query(collection(db, 'stores'), limit(200));
          const allStoresSnap = await getDocs(allStoresQ);
          const allStores = allStoresSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Store));
          
          // Client-side filtering
          const filteredStores = allStores.filter(store => {
            const searchTerm = keyword.toLowerCase();
            return (
              store.name?.toLowerCase().includes(searchTerm) ||
              store.category?.toLowerCase().includes(searchTerm) ||
              store.brandSlug?.toLowerCase().includes(searchTerm)
            );
          }).slice(0, limitCount);
          
          results.stores = filteredStores;
        }
      }

      return results;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, don't set error
        return { malls: [], stores: [] };
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      return { malls: [], stores: [] };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchWithDebounce = useCallback(async (
    options: SearchOptions,
    delay: number = 300
  ): Promise<SearchResult> => {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(async () => {
        const result = await searchAll(options);
        resolve(result);
      }, delay);

      // Cleanup function
      return () => {
        clearTimeout(timeoutId);
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    });
  }, [searchAll]);

  const cancelSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    searchAll,
    searchWithDebounce,
    cancelSearch,
    isLoading,
    error
  };
}
