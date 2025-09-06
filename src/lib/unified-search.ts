/**
 * Unified search for malls and stores
 * Returns combined results with distance calculation support
 */

import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Mall, Store } from '../types/mall-system';
import { createSearchQuery } from './thai-normalize';

export interface UnifiedSearchResult {
  id: string;
  kind: 'mall' | 'store';
  name: string;
  mallName?: string; // For stores
  floorLabel?: string; // For stores
  openHours?: string;
  coords?: { lat: number; lng: number };
  mallCoords?: { lat: number; lng: number };
  category?: string; // For stores
  status?: string; // For stores
  distanceKm?: number; // Will be calculated by worker
}

/**
 * Search malls and stores with unified results
 */
export async function searchMallsAndStores(query: string, limitCount = 50): Promise<UnifiedSearchResult[]> {
  if (!query || query.trim().length < 1) {
    return [];
  }

  const { start, end } = createSearchQuery(query.trim());
  
  try {
    // Search malls and stores in parallel
    const [mallsResults, storesResults] = await Promise.all([
      searchMalls(start, end, Math.ceil(limitCount / 2)),
      searchStores(start, end, Math.ceil(limitCount / 2))
    ]);

    // Combine and format results
    const results: UnifiedSearchResult[] = [
      ...mallsResults.map(mall => ({
        id: mall.id!,
        kind: 'mall' as const,
        name: mall.displayName || mall.name,
        openHours: mall.hours ? `${mall.hours.open}-${mall.hours.close}` : undefined,
        coords: mall.coords || mall.location,
        mallCoords: mall.coords || mall.location
      })),
      ...storesResults.map(store => ({
        id: store.id!,
        kind: 'store' as const,
        name: store.name,
        mallName: (store as any).mallName,
        floorLabel: (store as any).floorLabel || store.floorId,
        openHours: store.hours,
        coords: store.location,
        mallCoords: (store as any).mallCoords,
        category: store.category,
        status: store.status
      }))
    ];

    return results.slice(0, limitCount);
  } catch (error) {
    console.error('Error in unified search:', error);
    return [];
  }
}

/**
 * Search malls by normalized name
 */
async function searchMalls(start: string, end: string, limitCount: number): Promise<Mall[]> {
  try {
    const q = query(
      collection(db, 'malls'),
      where('name_normalized', '>=', start),
      where('name_normalized', '<=', end),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Mall));
  } catch (error) {
    console.error('Error searching malls:', error);
    return [];
  }
}

/**
 * Search stores by normalized name across all malls
 */
async function searchStores(start: string, end: string, limitCount: number): Promise<Store[]> {
  try {
    // First get all malls to search their stores
    const mallsSnapshot = await getDocs(collection(db, 'malls'));
    const stores: Store[] = [];
    
    for (const mallDoc of mallsSnapshot.docs) {
      if (stores.length >= limitCount) break;
      
      const q = query(
        collection(db, 'malls', mallDoc.id, 'stores'),
        where('name_normalized', '>=', start),
        where('name_normalized', '<=', end),
        limit(limitCount - stores.length)
      );
      
      const storesSnapshot = await getDocs(q);
      const mallStores = storesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        mallId: mallDoc.id
      } as Store));
      
      stores.push(...mallStores);
    }
    
    return stores;
  } catch (error) {
    console.error('Error searching stores:', error);
    return [];
  }
}

/**
 * Get search results with distance calculation
 * This function should be called after searchMallsAndStores
 */
export function prepareForDistanceCalculation(
  results: UnifiedSearchResult[],
  userLocation?: { lat: number; lng: number }
): { origin: { lat: number; lng: number }; rows: Array<{ id: string; coords?: { lat: number; lng: number } }> } | null {
  if (!userLocation) {
    return null;
  }

  const rows = results.map(result => ({
    id: result.id,
    coords: result.coords || result.mallCoords
  }));

  return {
    origin: userLocation,
    rows
  };
}

/**
 * Sort results by distance (closest first)
 */
export function sortByDistance(results: UnifiedSearchResult[], distanceMap: Map<string, number>): UnifiedSearchResult[] {
  return [...results].sort((a, b) => {
    const distanceA = distanceMap.get(a.id) ?? Infinity;
    const distanceB = distanceMap.get(b.id) ?? Infinity;
    return distanceA - distanceB;
  });
}
