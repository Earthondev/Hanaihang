/**
 * Unified search for malls and stores
 * Returns combined results with distance calculation support
 */

import { collection, collectionGroup, query, where, getDocs, limit } from 'firebase/firestore';

import { db } from '../config/firebase';
import { Mall, Store } from '../types/mall-system';

import { createSearchQuery, normalizeThai } from './thai-normalize';

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
export async function searchMallsAndStores(
  query: string,
  limitCount = 50,
): Promise<UnifiedSearchResult[]> {
  if (!query || query.trim().length < 1) {
    return [];
  }

  const normalizedQuery = normalizeThai(query.trim());
  const rawLower = query.trim().toLowerCase();
  const { start, end } = createSearchQuery(query.trim());

  try {
    // Search malls and stores in parallel
    const [mallsResults, storesResults] = await Promise.all([
      searchMalls(start, end, normalizedQuery, rawLower, Math.ceil(limitCount / 2)),
      searchStores(start, end, normalizedQuery, rawLower, Math.ceil(limitCount / 2)),
    ]);

    const results = mergeResults(mallsResults, storesResults);
    return results.slice(0, limitCount);
  } catch (error) {
    console.error('Error in unified search:', error);
    return [];
  }
}

function mergeResults(malls: Mall[], stores: Store[]): UnifiedSearchResult[] {
  const results: UnifiedSearchResult[] = [
    ...malls.map(mall => ({
      id: mall.id!,
      kind: 'mall' as const,
      name: mall.displayName || mall.name,
      openHours: mall.hours
        ? `${mall.hours.open}-${mall.hours.close}`
        : undefined,
      coords: mall.coords || (mall as unknown).location,
      mallCoords: mall.coords || (mall as unknown).location,
    })),
    ...stores.map(store => ({
      id: store.id!,
      kind: 'store' as const,
      name: store.name,
      mallName: (store as unknown).mallName,
      floorLabel: (store as unknown).floorLabel || store.floorId,
      openHours: store.hours,
      coords: { lat: 0, lng: 0 },
      mallCoords: (store as unknown).mallCoords,
      category: store.category,
      status: store.status,
    })),
  ];

  const seen = new Set<string>();
  const deduped: UnifiedSearchResult[] = [];
  for (const item of results) {
    const mallKey = item.mallName ? normalizeThai(item.mallName) : '';
    const floorKey = item.floorLabel ? item.floorLabel.toLowerCase() : '';
    const key = `${item.kind}:${item.id}:${normalizeThai(item.name)}:${mallKey}:${floorKey}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  return deduped;
}

/**
 * Search malls by normalized name
 */
async function searchMalls(
  start: string,
  end: string,
  normalizedQuery: string,
  rawLower: string,
  limitCount: number,
): Promise<Mall[]> {
  try {
    const byName = query(
      collection(db, 'malls'),
      where('nameLower', '>=', start),
      where('nameLower', '<=', end),
      limit(limitCount),
    );

    const keywordToken = normalizedQuery || rawLower;
    const byKeyword = keywordToken
      ? query(
          collection(db, 'malls'),
          where('searchKeywords', 'array-contains', keywordToken),
          limit(limitCount),
        )
      : null;

    const [nameSnap, keywordSnap] = await Promise.all([
      getDocs(byName),
      byKeyword ? getDocs(byKeyword) : Promise.resolve(null),
    ]);

    const results = new Map<string, Mall>();
    nameSnap.docs.forEach(doc => {
      results.set(doc.id, { id: doc.id, ...doc.data() } as Mall);
    });
    if (keywordSnap) {
      keywordSnap.docs.forEach(doc => {
        results.set(doc.id, { id: doc.id, ...doc.data() } as Mall);
      });
    }

    return Array.from(results.values());
  } catch (error) {
    console.error('Error searching malls:', error);
    return [];
  }
}

/**
 * Search stores by normalized name across all malls
 */
async function searchStores(
  start: string,
  end: string,
  normalizedQuery: string,
  rawLower: string,
  limitCount: number,
): Promise<Store[]> {
  try {
    const byName = query(
      collectionGroup(db, 'stores'),
      where('nameLower', '>=', start),
      where('nameLower', '<=', end),
      limit(limitCount),
    );

    const keywordToken = normalizedQuery || rawLower;
    const byKeyword = keywordToken
      ? query(
          collectionGroup(db, 'stores'),
          where('searchKeywords', 'array-contains', keywordToken),
          limit(limitCount),
        )
      : null;

    const [nameSnap, keywordSnap] = await Promise.all([
      getDocs(byName),
      byKeyword ? getDocs(byKeyword) : Promise.resolve(null),
    ]);

    const results = new Map<string, Store>();
    nameSnap.docs.forEach(doc => {
      results.set(doc.id, { id: doc.id, ...doc.data() } as Store);
    });
    if (keywordSnap) {
      keywordSnap.docs.forEach(doc => {
        results.set(doc.id, { id: doc.id, ...doc.data() } as Store);
      });
    }

    return Array.from(results.values());
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
  userLocation?: { lat: number; lng: number },
): {
  origin: { lat: number; lng: number };
  rows: Array<{ id: string; coords?: { lat: number; lng: number } }>;
} | null {
  if (!userLocation) {
    return null;
  }

  const rows = results.map(result => ({
    id: result.id,
    coords: result.coords || result.mallCoords,
  }));

  return {
    origin: userLocation,
    rows,
  };
}

/**
 * Sort results by distance (closest first)
 */
export function sortByDistance(
  results: UnifiedSearchResult[],
  distanceMap: Map<string, number>,
): UnifiedSearchResult[] {
  return [...results].sort((a, b) => {
    const distanceA = distanceMap.get(a.id) ?? Infinity;
    const distanceB = distanceMap.get(b.id) ?? Infinity;
    return distanceA - distanceB;
  });
}
