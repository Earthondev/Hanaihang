import { useState, useRef, useEffect } from 'react';

import { listMalls } from '../services/firebase/firestore';
import { searchStoresGlobally } from '../services/firebase/stores';

import { normalizeThai } from './thai-normalize';

// Cache system with stale-while-revalidate
class SearchCache {
  private cache = new Map<
    string,
    { data: any; timestamp: number; stale: boolean }
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

  set(key: string, data: any, stale = false) {
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
}

// Search configuration
const SEARCH_CONFIG = {
  DEBOUNCE_MS: 120,
  MAX_RESULTS_PER_TYPE: 50,
  RANKING_WEIGHTS: {
    DISTANCE: 1.0,
    OPEN_STATUS: 1.0,
    TYPE_BONUS: 0.1,
  },
};

// Parallel search function
export async function searchMallsAndStores(
  query: string,
  userLocation?: { lat: number; lng: number },
  signal?: AbortSignal,
): Promise<UnifiedSearchResult[]> {
  const normalizedQuery = normalizeThai(query.trim());
  if (!normalizedQuery || normalizedQuery.length < 1) {
    return [];
  }

  // Check cache first
  const cacheKey = `${normalizedQuery}_${userLocation ? `${userLocation.lat},${userLocation.lng}` : 'no-location'}`;
  const cached = searchCache.get(cacheKey);
  if (cached) {
    // Emit cached results immediately (stale-while-revalidate)
    return cached;
  }

  try {
    // Parallel queries
    const [mallsRaw, storesRaw] = await Promise.all([
      searchMalls(normalizedQuery, signal),
      searchStores(normalizedQuery, signal),
    ]);

    // เติม meta ของห้างให้ร้าน
    const storesEnriched = await enrichStoresWithMallMeta(storesRaw);

    // รวมผล
    let unified = unifySearchResults(mallsRaw, storesEnriched);

    // คำนวณระยะทาง
    if (userLocation) {
      unified = unified.map(item => {
        const point =
          item.kind === 'mall'
            ? (item.coords ?? item.mallCoords)
            : (item.mallCoords ?? item.coords);
        return {
          ...item,
          distanceKm: point ? haversineKm(userLocation, point) : undefined,
        };
      });
    }

    // จัดเรียงด้วย score
    unified = sortSearchResults(unified, userLocation);

    // Cache results
    searchCache.set(cacheKey, unified);

    return unified;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return [];
    }
    console.error('Search error:', error);
    throw error;
  }
}

// Search malls function
async function searchMalls(
  query: string,
  signal?: AbortSignal,
): Promise<any[]> {
  try {
    const malls = await listMalls();

    // Filter by normalized name
    const filtered = malls.filter((mall: any) => {
      const normalizedName = normalizeThai(mall.displayName || mall.name || '');
      return normalizedName.includes(query);
    });

    return filtered.slice(0, SEARCH_CONFIG.MAX_RESULTS_PER_TYPE).map((mall: any) => {
      const coords = (mall.lat != null && mall.lng != null)
        ? { lat: mall.lat, lng: mall.lng }
        : (mall.coords || undefined);
      const hours = (mall as any).openTime && (mall as any).closeTime
        ? { open: (mall as any).openTime, close: (mall as any).closeTime }
        : mall.hours; // เผื่อ legacy

      return {
        ...mall,
        coords,
        hours,
        openNow: isCurrentlyOpenV2({ openTime: (mall as any).openTime, closeTime: (mall as any).closeTime, hours }),
      };
    });
  } catch (error: any) {
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
): Promise<any[]> {
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
      mallId: _mallId,                 // ✅ ใช้ mallId ที่ถูกต้อง
      mallSlug: store.mallSlug || _mallId,
      coords: store.location,          // ถ้าร้านไม่มีพิกัดจริง เดี๋ยว enrich จากห้าง
      mallCoords: undefined,           // จะเติมทีหลัง
      floorLabel: store.floorLabel || store.floorId,
      category: store.category,
      hours: store.hours
        ? { open: store.hours.split('-')[0], close: store.hours.split('-')[1] }
        : undefined,
      openNow: false,                  // จะคำนวณทีหลัง
      distanceKm: undefined,           // จะคำนวณทีหลัง
      score: undefined,                // จะคำนวณทีหลัง
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

// Calculate ranking score
export function calculateSearchScore(
  result: UnifiedSearchResult,
  userLocation?: { lat: number; lng: number },
): number {
  const weights = SEARCH_CONFIG.RANKING_WEIGHTS;
  let score = 0;

  // Distance score (lower is better)
  if (result.distanceKm !== undefined && userLocation) {
    score += weights.DISTANCE * result.distanceKm;
  } else {
    score += weights.DISTANCE * 10; // Default distance penalty
  }

  // Open status bonus
  if (result.openNow) {
    score -= weights.OPEN_STATUS * 5; // Bonus for being open
  }

  // Type bonus (malls get slight preference)
  if (result.kind === 'mall') {
    score -= weights.TYPE_BONUS;
  }

  return score;
}

// Sort results by score
export function sortSearchResults(
  results: UnifiedSearchResult[],
  userLocation?: { lat: number; lng: number },
): UnifiedSearchResult[] {
  return results
    .map(result => ({
      ...result,
      score: calculateSearchScore(result, userLocation),
    }))
    .sort((a, b) => a.score - b.score);
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
      } catch (err) {
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
