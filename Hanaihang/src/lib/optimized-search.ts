import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

import { db } from '../config/firebase';
import { Mall, Store } from '../types/mall-system';

import { cache } from './cache';

// Helper to calculate distance between two coordinates
export function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Search malls with distance calculation
export async function searchMallsWithDistance(
  searchQuery: string,
  userCoords?: { lat: number; lng: number }
): Promise<(Mall & { distanceKm?: number })[]> {
  if (!searchQuery.trim()) return [];

  const searchTerm = searchQuery.toLowerCase().trim();
  
  // Check cache first
  const cacheKey = `search:malls:${searchTerm}:${userCoords ? `${userCoords.lat},${userCoords.lng}` : 'no-coords'}`;
  const cached = cache.get<(Mall & { distanceKm?: number })[]>(cacheKey);
  if (cached) {
    console.log('📦 Using cached mall search results');
    return cached;
  }

  console.log(`🔍 Searching malls for: "${searchTerm}"`);
  const start = Date.now();

  try {
    // Search by displayName (case-insensitive)
    const q = query(
      collection(db, 'malls'),
      where('displayNameLower', '>=', searchTerm),
      where('displayNameLower', '<=', searchTerm + '\uf8ff'),
      orderBy('displayNameLower'),
      limit(20)
    );

    const snapshot = await getDocs(q);
    let malls = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Mall[];

    // If no results with displayNameLower, try with regular displayName
    if (malls.length === 0) {
      const fallbackQ = query(
        collection(db, 'malls'),
        orderBy('displayName'),
        limit(50)
      );
      const fallbackSnapshot = await getDocs(fallbackQ);
      malls = fallbackSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(mall => 
          (mall as unknown).displayName?.toLowerCase().includes(searchTerm) ||
          (mall as unknown).name?.toLowerCase().includes(searchTerm)
        ) as (Mall & { displayName?: string; name?: string; location?: unknown; coords?: unknown })[];
    }

    // Calculate distances if user coordinates provided
    let results = malls;
    if (userCoords) {
      results = malls.map(mall => {
        const mallCoords = (mall as unknown).location || (mall as unknown).coords;
        const distanceKm = mallCoords ? 
          calculateDistance(
            userCoords.lat, 
            userCoords.lng, 
            mallCoords.lat, 
            mallCoords.lng
          ) : null;
        
        return {
          ...mall,
          distanceKm
        };
      });

      // Sort by distance (closest first)
      results.sort((a, b) => {
        const aDist = (a as unknown).distanceKm;
        const bDist = (b as unknown).distanceKm;
        if (aDist === null && bDist === null) return 0;
        if (aDist === null) return 1;
        if (bDist === null) return -1;
        return aDist - bDist;
      });
    }

    const time = Date.now() - start;
    console.log(`✅ Found ${results.length} malls in ${time}ms`);

    // Cache for 2 minutes
    cache.set(cacheKey, results, 2 * 60 * 1000);
    
    return results;
  } catch (error) {
    console.error('Error searching malls:', error);
    return [];
  }
}

// Search stores with distance calculation
export async function searchStoresWithDistance(
  searchQuery: string,
  userCoords?: { lat: number; lng: number }
): Promise<(Store & { distanceKm?: number; mallName?: string })[]> {
  if (!searchQuery.trim()) return [];

  const searchTerm = searchQuery.toLowerCase().trim();
  
  // Check cache first
  const cacheKey = `search:stores:${searchTerm}:${userCoords ? `${userCoords.lat},${userCoords.lng}` : 'no-coords'}`;
  const cached = cache.get<(Store & { distanceKm?: number; mallName?: string })[]>(cacheKey);
  if (cached) {
    console.log('📦 Using cached store search results');
    return cached;
  }

  console.log(`🔍 Searching stores for: "${searchTerm}"`);
  const start = Date.now();

  try {
    // Get all malls first
    const mallsSnapshot = await getDocs(collection(db, 'malls'));
    const malls = mallsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as (Mall & { displayName?: string; name?: string; location?: unknown; coords?: unknown })[];

    const results: (Store & { distanceKm?: number; mallName?: string })[] = [];

    // Search stores in each mall
    for (const mall of malls) {
      try {
        const storesQ = query(
          collection(db, 'malls', mall.id!, 'stores'),
          limit(10)
        );
        const storesSnapshot = await getDocs(storesQ);
        
        const stores = storesSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(store => 
            (store as unknown).nameLower?.includes(searchTerm) ||
            (store as unknown).name?.toLowerCase().includes(searchTerm) ||
            (store as unknown).brandSlug?.toLowerCase().includes(searchTerm) ||
            (store as unknown).category?.toLowerCase().includes(searchTerm)
          ) as Store[];

        // Add mall name and calculate distance
        const storesWithMall = stores.map(store => {
          const mallCoords = (mall as unknown).location || (mall as unknown).coords;
          const distanceKm = userCoords && mallCoords ? 
            calculateDistance(
              userCoords.lat, 
              userCoords.lng, 
              mallCoords.lat, 
              mallCoords.lng
            ) : null;
          
          return {
            ...store,
            distanceKm,
            mallName: (mall as unknown).displayName || (mall as unknown).name
          };
        });

        results.push(...storesWithMall);
      } catch (error) {
        console.error(`Error searching stores in mall ${mall.id}:`, error);
      }
    }

    // Sort by distance (closest first)
    if (userCoords) {
      results.sort((a, b) => {
        if (a.distanceKm === null && b.distanceKm === null) return 0;
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }

    const time = Date.now() - start;
    console.log(`✅ Found ${results.length} stores in ${time}ms`);

    // Cache for 2 minutes
    cache.set(cacheKey, results, 2 * 60 * 1000);
    
    return results;
  } catch (error) {
    console.error('Error searching stores:', error);
    return [];
  }
}

// Combined search function
export async function searchAllWithDistance(
  searchQuery: string,
  userCoords?: { lat: number; lng: number }
): Promise<{
  malls: (Mall & { distanceKm?: number })[];
  stores: (Store & { distanceKm?: number; mallName?: string })[];
}> {
  const [malls, stores] = await Promise.all([
    searchMallsWithDistance(searchQuery, userCoords),
    searchStoresWithDistance(searchQuery, userCoords)
  ]);

  return { malls, stores };
}

// Clear search cache
export function clearSearchCache(): void {
  cache.clearPattern('search:');
}

// Clear cache for specific search term
export function clearSearchCacheForTerm(searchTerm: string): void {
  const patterns = [
    `search:malls:${searchTerm.toLowerCase()}:*`,
    `search:stores:${searchTerm.toLowerCase()}:*`
  ];
  
  patterns.forEach(pattern => {
    cache.clearPattern(pattern);
  });
}
