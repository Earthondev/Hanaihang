import { useState, useRef, useEffect } from 'react';

import { listMalls } from '../services/firebase/firestore';
import { Mall } from '../types/mall-system';
import { searchStoresGlobally } from '../services/firebase/stores';

import { normalizeThai, getSearchScore } from './thai-normalize';

// Cache system with stale-while-revalidate
class SearchCache {
  private cache = new Map<
    string,
    { data: unknown; timestamp: number; stale: boolean }
  >();
  private readonly TTL = 2 * 60 * 1000; // 2 minutes

  get(key: string) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.TTL;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: unknown, stale = false) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      stale,
    });
  }

  markStale(key: string) {
    const entry = this.cache.get(key);
    if (entry) {
      entry.stale = true;
    }
  }
}

const searchCache = new SearchCache();

// Unified search result type
export interface UnifiedSearchResult {
  id: string;
  kind: 'mall' | 'store';
  name: string;
  displayName: string;
  mallName?: string;
  mallId?: string;
  mallSlug?: string;
  coords?: { lat: number; lng: number };
  mallCoords?: { lat: number; lng: number };
  floorLabel?: string;
  category?: string;
  hours?: { open: string; close: string };
  openNow?: boolean;
  distanceKm?: number;
  score?: number;
  textScore?: number; // Score from text matching (0-100)
}

// Search configuration
const SEARCH_CONFIG = {
  DEBOUNCE_MS: 150,
  MAX_RESULTS_PER_TYPE: 50,
  RANKING_WEIGHTS: {
    TEXT_MATCH: 1.5,   // Higher weight for text relevance
    DISTANCE: 0.8,
    OPEN_STATUS: 0.5,
    TYPE_BONUS: 0.2,   // Small bonus for malls to show them first if text match is equal
  },
};

// Parallel search function
export async function searchMallsAndStores(
  query: string,
  userLocation?: { lat: number; lng: number },
  signal?: AbortSignal,
): Promise<UnifiedSearchResult[]> {
  const rawQuery = query.trim();
  const normalizedQuery = normalizeThai(rawQuery);

  if (!normalizedQuery || normalizedQuery.length < 1) {
    return [];
  }

  // Check cache first
  const cacheKey = `${normalizedQuery}_${userLocation ? `${userLocation.lat},${userLocation.lng}` : 'no-location'}`;
  const cached = searchCache.get(cacheKey);
  if (cached) {
    return cached as UnifiedSearchResult[];
  }

  try {
    // Determine search strategies
    const queryParts = normalizedQuery.split(' ').filter(p => p.length > 0);
    const storeSearchToken = queryParts[0]; // Use first word for store prefix search

    // Parallel queries
    const [mallsRaw, storesRaw] = await Promise.all([
      searchMalls(normalizedQuery, signal),
      searchStores(storeSearchToken, signal), // Use first token for better recall
    ]);

    // เติม meta ของห้างให้ร้าน
    const storesEnriched = await enrichStoresWithMallMeta(storesRaw);

    // รวมผล
    let unified = unifySearchResults(mallsRaw, storesEnriched);

    // คำนวณ Score และกรองความเร็ว
    unified = unified.map(item => {
      // คำนวณ Text Match Score
      // ตรวจสอบทั้งชื่อ และถ้าเป็นร้าน ให้ตรวจชื่อห้างด้วย
      const queryParts = normalizedQuery.split(' ').filter(p => p.length > 0);

      // Base score from full query match
      let nameScore = getSearchScore(item.displayName, normalizedQuery);
      let contextScore = 0;

      if (item.kind === 'store' && item.mallName) {
        contextScore = getSearchScore(item.mallName, normalizedQuery);
      } else if (item.kind === 'mall' && (item as any).address) {
        contextScore = getSearchScore((item as any).address, normalizedQuery) * 0.5;
      }

      // If full match is low, try partial matches for multi-word queries
      if (queryParts.length > 1 && Math.max(nameScore, contextScore) < 40) {
        let partialScore = 0;
        for (const part of queryParts) {
          if (part.length < 2) continue;

          const s1 = getSearchScore(item.displayName, part);
          let s2 = 0;
          if (item.kind === 'store' && item.mallName) {
            s2 = getSearchScore(item.mallName, part);
          }

          // If a word matches the store and another word matches the mall, that's a strong signal
          partialScore += Math.max(s1, s2);
        }
        // Normalize partial score
        nameScore = Math.max(nameScore, partialScore / queryParts.length);
      }

      const textScore = Math.max(nameScore, contextScore);

      // คำนวณระยะทาง
      let distanceKm: number | undefined;
      if (userLocation) {
        const point =
          item.kind === 'mall'
            ? (item.coords ?? item.mallCoords)
            : (item.mallCoords ?? item.coords);
        distanceKm = point ? haversineKm(userLocation, point) : undefined;
      }

      return {
        ...item,
        textScore,
        distanceKm,
      };
    });

    // กรองพวกที่ไม่เกี่ยวเลยออก (score = 0) ถ้าคำค้นหามีความหมาย
    if (normalizedQuery.length > 1) {
      unified = unified.filter(item => (item.textScore || 0) > 0);
    }

    // จัดเรียงด้วย score
    unified = sortSearchResults(unified, userLocation);

    // Cache results
    searchCache.set(cacheKey, unified);

    return unified;
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'AbortError') {
      return [];
    }
    console.error('Search error:', error);
    throw error;
  }
}

// Search malls function
type MallSearchItem = Mall & { openNow?: boolean };

async function searchMalls(
  query: string,
  signal?: AbortSignal,
): Promise<MallSearchItem[]> {
  try {
    const malls = await listMalls();

    // Filter by normalized name, district, or address
    const filtered = malls.filter((mall) => {
      const name = normalizeThai(mall.displayName || mall.name || '');
      const district = normalizeThai(mall.district || '');
      const address = normalizeThai(mall.address || '');

      return name.includes(query) || district.includes(query) || address.includes(query);
    });

    return filtered.slice(0, SEARCH_CONFIG.MAX_RESULTS_PER_TYPE).map((mall) => {
      const coords = (mall.lat != null && mall.lng != null)
        ? { lat: mall.lat, lng: mall.lng }
        : (mall.coords || undefined);
      const hours = mall.openTime && mall.closeTime
        ? { open: mall.openTime, close: mall.closeTime }
        : mall.hours;

      return {
        ...mall,
        coords,
        hours,
        openNow: isCurrentlyOpenV2({ openTime: mall.openTime, closeTime: mall.closeTime, hours }),
      };
    });
  } catch (error: unknown) {
    if (signal?.aborted) throw new Error('AbortError');
    console.error('Mall search error:', error);
    return [];
  }
}

// Enrich stores with mall metadata
async function enrichStoresWithMallMeta(stores: any[]) {
  // ดึง mall ids ที่ต้องใช้
  const ids = Array.from(new Set(stores.map(s => s.mallId).filter(Boolean)));
  if (ids.length === 0) return stores;

  // ใช้ listMalls() แล้ว map เป็น lookup โดย id
  const allMalls = await listMalls();
  const mallById = new Map(allMalls.map((m: any) => [m.id, m]));

  return stores.map(s => {
    const mall = mallById.get(s.mallId);
    if (!mall) return s;

    const coords = mall.lat != null && mall.lng != null
      ? { lat: mall.lat, lng: mall.lng }
      : (mall.coords || undefined);

    // ใช้เวลาเปิด/ปิดจากร้านก่อน ถ้าไม่มีค่อย fallback เป็นของห้าง
    const openTime = s.hours?.open || (mall as any).openTime || mall?.hours?.open;
    const closeTime = s.hours?.close || (mall as any).closeTime || mall?.hours?.close;

    return {
      ...s,
      mallName: mall.displayName || mall.name,
      mallSlug: mall.name || s.mallSlug,
      mallCoords: coords,
      openNow: isCurrentlyOpenV2({ openTime, closeTime }),
      hours: openTime && closeTime ? { open: openTime, close: closeTime } : s.hours,
    };
  });
}

// Search stores function using collectionGroup
async function searchStores(
  query: string,
  signal?: AbortSignal,
): Promise<UnifiedSearchResult[]> {
  try {
    const storeResults = await searchStoresGlobally(
      query,
      SEARCH_CONFIG.MAX_RESULTS_PER_TYPE,
    );

    // Transform to unified format
    return storeResults.map(({ store, _mallId }) => ({
      id: store.id,
      kind: 'store' as const,
      name: store.name,
      displayName: store.name,
      mallId: _mallId,
      mallSlug: store.mallSlug || _mallId,
      coords: store.location,
      mallCoords: undefined,
      floorLabel: store.floorLabel || store.floorId,
      category: store.category,
      hours: store.hours
        ? { open: store.hours.split('-')[0], close: store.hours.split('-')[1] }
        : undefined,
      openNow: false,
      distanceKm: undefined,
      score: undefined,
    }));
  } catch (error) {
    if (signal?.aborted) throw new Error('AbortError');
    console.error('Store search error:', error);
    return [];
  }
}

// Unify search results
function unifySearchResults(
  malls: any[],
  stores: any[],
): UnifiedSearchResult[] {
  const unified: UnifiedSearchResult[] = [];

  // Add malls
  malls.forEach((mall: any) => {
    const hours = mall.hours || ((mall.openTime && mall.closeTime) ? { open: mall.openTime, close: mall.closeTime } : undefined);
    const coords = mall.coords || ((mall.lat != null && mall.lng != null) ? { lat: mall.lat, lng: mall.lng } : undefined);
    unified.push({
      id: mall.id,
      kind: 'mall',
      name: mall.name,
      displayName: mall.displayName || mall.name,
      coords,
      hours,
      openNow: isCurrentlyOpenV2({ openTime: mall.openTime, closeTime: mall.closeTime, hours }),
    });
  });

  // Add stores
  stores.forEach((s: any) => {
    unified.push({
      id: s.id,
      kind: 'store',
      name: s.name,
      displayName: s.displayName || s.name,
      mallName: s.mallName,
      mallId: s.mallId,
      mallSlug: s.mallSlug,
      coords: s.coords,
      mallCoords: s.mallCoords,
      floorLabel: s.floorLabel,
      category: s.category,
      hours: s.hours,
      openNow: s.openNow,
    });
  });

  return unified;
}

// Calculate ranking score (Higher is BETTER match)
export function calculateSearchScore(
  result: UnifiedSearchResult,
  userLocation?: { lat: number; lng: number },
): number {
  const weights = SEARCH_CONFIG.RANKING_WEIGHTS;
  let score = 0;

  // 1. Text match score (0-100) -> Major factor
  score += (result.textScore || 0) * weights.TEXT_MATCH;

  // 2. Distance score (Nearby gets bonus)
  if (result.distanceKm !== undefined && userLocation) {
    // Distance penalty: -1 point for every 2km, up to -10 points
    const distancePenalty = Math.min(10, result.distanceKm / 2);
    score -= distancePenalty * weights.DISTANCE;

    // Proximity bonus for very close locations (< 1km)
    if (result.distanceKm < 1) {
      score += 5 * weights.DISTANCE;
    }
  }

  // 3. Open status bonus
  if (result.openNow) {
    score += 5 * weights.OPEN_STATUS;
  }

  // 4. Type bonus (malls get slight preference if text matches equally)
  if (result.kind === 'mall') {
    score += weights.TYPE_BONUS;
  }

  return score;
}

// Sort results by score (Descending - Highest score first)
export function sortSearchResults(
  results: UnifiedSearchResult[],
  userLocation?: { lat: number; lng: number },
): UnifiedSearchResult[] {
  return results
    .map(result => ({
      ...result,
      score: calculateSearchScore(result, userLocation),
    }))
    .sort((a, b) => (b.score || 0) - (a.score || 0));
}

// Haversine distance calculation
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Check if currently open (V2 with cross-midnight support)
function isCurrentlyOpenV2(mallOrStore: {
  openTime?: string;
  closeTime?: string;
  hours?: { open?: string; close?: string }
}): boolean {
  const openTime = mallOrStore.openTime || mallOrStore.hours?.open;
  const closeTime = mallOrStore.closeTime || mallOrStore.hours?.close;
  if (!openTime || !closeTime) return false;

  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = openTime.split(':').map(Number);
  const [ch, cm] = closeTime.split(':').map(Number);
  const openM = oh * 60 + (om || 0);
  const closeM = ch * 60 + (cm || 0);

  // รองรับกรณีปิดหลังเที่ยงคืน (เช่น 10:00 - 01:00)
  if (closeM < openM) {
    return current >= openM || current <= closeM;
  }
  return current >= openM && current <= closeM;
}

// Debounced search hook
export function useDebouncedSearch(
  query: string,
  userLocation?: { lat: number; lng: number },
  delay: number = SEARCH_CONFIG.DEBOUNCE_MS,
) {
  const [results, setResults] = useState<UnifiedSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        const searchResults = await searchMallsAndStores(
          query,
          userLocation,
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setResults(searchResults);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setResults([]);
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setLoading(false);
        }
      }
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, userLocation, delay]);

  return { results, loading, error };
}
