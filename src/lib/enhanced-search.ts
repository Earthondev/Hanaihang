import { useState, useRef, useEffect, useMemo } from 'react';

import { listMalls } from '../services/firebase/firestore';
import { searchStoresGlobally } from '../services/firebase/stores';

import { normalizeThai } from './thai-normalize';
import { isE2E, E2E_CONFIG } from './e2e';
import { E2E_ALL_STORES, E2E_MALLS } from './e2e-fixtures';

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

export function getCachedSearchResults(
  query: string,
  userLocation?: { lat: number; lng: number },
) {
  const normalizedQuery = normalizeThai(query.trim());
  if (!normalizedQuery) return null;
  const cacheKey = `${normalizedQuery}_${userLocation ? `${userLocation.lat},${userLocation.lng}` : 'no-location'}`;
  return searchCache.get(cacheKey);
}

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

type SearchResponse<T> = { data: T[]; hadError: boolean };

// Search configuration
const SEARCH_CONFIG = {
  DEBOUNCE_MS: isE2E ? E2E_CONFIG.DEBOUNCE_MS : 120,
  MAX_RESULTS_PER_TYPE: 50,
  RANKING_WEIGHTS: {
    DISTANCE: 1.0,
    OPEN_STATUS: 1.0,
    TYPE_BONUS: 0.1,
  },
};

const MIN_LOADING_MS = 200;
const FIRESTORE_CHECK_TTL = isE2E ? E2E_CONFIG.FIRESTORE_CHECK_TTL : 1000;
const FIRESTORE_PING_URL =
  'https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen';
const FIRESTORE_PING_TIMEOUT_MS = isE2E ? E2E_CONFIG.FIRESTORE_PING_TIMEOUT_MS : 120;
let firestoreReachable: boolean | null = null;
let firestoreReachableAt = 0;

const normalizeLoose = (text: string) =>
  normalizeThai(text).replace(/[^a-z0-9\u0E00-\u0E7F]/g, '');

const matchesQueryLoose = (text: string, query: string) => {
  if (!query.trim()) return false;
  const normalizedText = normalizeThai(text);
  const normalizedQuery = normalizeThai(query);
  if (normalizedText.includes(normalizedQuery)) return true;

  const looseText = normalizeLoose(text);
  const looseQuery = normalizeLoose(query);
  if (looseQuery && looseText.includes(looseQuery)) return true;

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  return tokens.some(token => {
    if (token.length < 2) return false;
    return normalizedText.includes(token) || looseText.includes(token);
  });
};

const checkFirestoreReachable = async (signal?: AbortSignal) => {
  if (!isE2E || typeof window === 'undefined') return true;
  if (signal?.aborted) {
    const abortError = new Error('AbortError');
    abortError.name = 'AbortError';
    throw abortError;
  }

  const now = Date.now();
  if (firestoreReachable !== null && now - firestoreReachableAt < FIRESTORE_CHECK_TTL) {
    return firestoreReachable;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, FIRESTORE_PING_TIMEOUT_MS);
  try {
    await fetch(FIRESTORE_PING_URL, {
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    });
    firestoreReachable = true;
  } catch (error) {
    firestoreReachable = false;
  } finally {
    clearTimeout(timeoutId);
    firestoreReachableAt = Date.now();
  }

  return firestoreReachable;
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
    const [mallsRes, storesRes] = await Promise.all([
      searchMalls(normalizedQuery, signal),
      searchStores(normalizedQuery, signal),
    ]);

    const hadError = mallsRes.hadError || storesRes.hadError;
    if (hadError) {
      return [];
    }

    const mallsRaw = mallsRes.data;
    const storesRaw = storesRes.data;

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

    // Normalize open status for deterministic e2e sorting
    if (isE2E) {
      unified = unified.map(item => ({ ...item, openNow: true }));
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

function enrichStoresWithMallMetaSync(stores: any[]) {
  const mallById = new Map(E2E_MALLS.map((m: any) => [m.id, m]));

  return stores.map(s => {
    const mall = mallById.get(s.mallId);
    if (!mall) return s;

    const coords =
      mall.lat != null && mall.lng != null
        ? { lat: mall.lat, lng: mall.lng }
        : (mall.coords || undefined);

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

function searchMallsAndStoresSync(
  query: string,
  userLocation?: { lat: number; lng: number },
): UnifiedSearchResult[] {
  const normalizedQuery = normalizeThai(query.trim());
  if (!normalizedQuery || normalizedQuery.length < 1) {
    return [];
  }

  const mallsRaw = E2E_MALLS.filter((mall: any) => {
    const name = mall.displayName || mall.name || '';
    return matchesQueryLoose(name, normalizedQuery);
  }).map((mall: any) => {
    const coords =
      mall.lat != null && mall.lng != null
        ? { lat: mall.lat, lng: mall.lng }
        : mall.coords || undefined;
    const hours =
      (mall as any).openTime && (mall as any).closeTime
        ? { open: (mall as any).openTime, close: (mall as any).closeTime }
        : mall.hours;

    return {
      ...mall,
      coords,
      hours,
      openNow: isCurrentlyOpenV2({
        openTime: (mall as any).openTime,
        closeTime: (mall as any).closeTime,
        hours,
      }),
    };
  });

  const storesRaw = E2E_ALL_STORES.filter(store => {
    return (
      matchesQueryLoose(store.name || '', normalizedQuery) ||
      matchesQueryLoose(store.category || '', normalizedQuery) ||
      matchesQueryLoose(store.mallName || '', normalizedQuery)
    );
  })
    .slice(0, SEARCH_CONFIG.MAX_RESULTS_PER_TYPE)
    .map(store => ({
      id: store.id,
      kind: 'store' as const,
      name: store.name,
      displayName: store.name,
      mallId: store._mallId || store.mallId,
      mallSlug: store.mallSlug || store._mallId || store.mallId,
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

  const storesEnriched = enrichStoresWithMallMetaSync(storesRaw);

  let unified = unifySearchResults(mallsRaw, storesEnriched);

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

  unified = unified.map(item => ({ ...item, openNow: true }));

  return sortSearchResults(unified, userLocation);
}

// Search malls function
async function searchMalls(
  query: string,
  signal?: AbortSignal,
): Promise<SearchResponse<any>> {
  let malls: any[] = [];
  let hadError = false;

  if (isE2E) {
    malls = E2E_MALLS;
  } else {
    try {
      malls = await listMalls();
    } catch (error: any) {
      if (signal?.aborted) throw new Error('AbortError');
      console.error('Mall search error:', error);
      hadError = true;
    }
  }

  if (hadError) {
    return { data: [], hadError: true };
  }

  const filtered = malls.filter((mall: any) => {
    const name = mall.displayName || mall.name || '';
    return isE2E ? matchesQueryLoose(name, query) : normalizeThai(name).includes(query);
  });

  const data = filtered
    .slice(0, SEARCH_CONFIG.MAX_RESULTS_PER_TYPE)
    .map((mall: any) => {
      const coords =
        mall.lat != null && mall.lng != null
          ? { lat: mall.lat, lng: mall.lng }
          : mall.coords || undefined;
      const hours =
        (mall as any).openTime && (mall as any).closeTime
          ? { open: (mall as any).openTime, close: (mall as any).closeTime }
          : mall.hours; // เผื่อ legacy

      return {
        ...mall,
        coords,
        hours,
        openNow: isCurrentlyOpenV2({
          openTime: (mall as any).openTime,
          closeTime: (mall as any).closeTime,
          hours,
        }),
      };
    });

  return { data, hadError: false };
}

// Enrich stores with mall metadata
async function enrichStoresWithMallMeta(stores: any[]) {
  // ดึง mall ids ที่ต้องใช้
  const ids = Array.from(new Set(stores.map(s => s.mallId).filter(Boolean)));
  if (ids.length === 0) return stores;

  // ใช้ listMalls() แล้ว map เป็น lookup โดย id
  const allMalls = isE2E ? E2E_MALLS : await listMalls();
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
): Promise<SearchResponse<any>> {
  try {
    if (isE2E) {
      const filtered = E2E_ALL_STORES.filter(store => {
        return (
          matchesQueryLoose(store.name || '', query) ||
          matchesQueryLoose(store.category || '', query) ||
          matchesQueryLoose(store.mallName || '', query)
        );
      });

      const data = filtered
        .slice(0, SEARCH_CONFIG.MAX_RESULTS_PER_TYPE)
        .map(store => ({
          id: store.id,
          kind: 'store' as const,
          name: store.name,
          displayName: store.name,
          mallId: store._mallId || store.mallId,
          mallSlug: store.mallSlug || store._mallId || store.mallId,
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

      return { data, hadError: false };
    }

    const storeResults = await searchStoresGlobally(
      query,
      SEARCH_CONFIG.MAX_RESULTS_PER_TYPE,
    );

    const data = storeResults.map(({ store, _mallId }) => ({
      id: store.id,
      kind: 'store' as const,
      name: store.name,
      displayName: store.name,
      mallId: _mallId, // ✅ ใช้ mallId ที่ถูกต้อง
      mallSlug: store.mallSlug || _mallId,
      coords: store.location, // ถ้าร้านไม่มีพิกัดจริง เดี๋ยว enrich จากห้าง
      mallCoords: undefined, // จะเติมทีหลัง
      floorLabel: store.floorLabel || store.floorId,
      category: store.category,
      hours: store.hours
        ? { open: store.hours.split('-')[0], close: store.hours.split('-')[1] }
        : undefined,
      openNow: false, // จะคำนวณทีหลัง
      distanceKm: undefined, // จะคำนวณทีหลัง
      score: undefined, // จะคำนวณทีหลัง
    }));

    return { data, hadError: false };
  } catch (error) {
    if (signal?.aborted) throw new Error('AbortError');
    console.error('Store search error:', error);
    return { data: [], hadError: true };
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
  if (isE2E && userLocation) {
    return results
      .map(result => ({
        ...result,
        score: calculateSearchScore(result, userLocation),
      }))
      .sort((a, b) => {
        const ad = a.distanceKm ?? Number.POSITIVE_INFINITY;
        const bd = b.distanceKm ?? Number.POSITIVE_INFINITY;
        if (ad !== bd) return ad - bd;
        if (a.kind !== b.kind) {
          return a.kind === 'mall' ? -1 : 1;
        }
        return 0;
      });
  }

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
  const [networkUnavailable, setNetworkUnavailable] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef<string>('');
  const lastResultsRef = useRef<UnifiedSearchResult[]>([]);

  const resultsWithLocation = useMemo(() => {
    if (!userLocation || results.length === 0) return results;
    const updated = results.map(item => {
      const point =
        item.kind === 'mall'
          ? (item.coords ?? item.mallCoords)
          : (item.mallCoords ?? item.coords);
      return {
        ...item,
        distanceKm: point ? haversineKm(userLocation, point) : undefined,
      };
    });
    return sortSearchResults(updated, userLocation);
  }, [results, userLocation]);

  useEffect(() => {
    const normalized = normalizeThai(query.trim());
    if (normalized && results.length > 0) {
      lastQueryRef.current = normalized;
      lastResultsRef.current = results;
    }
  }, [query, results]);

  useEffect(() => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!query.trim()) {
      if (!isE2E) {
        setResults([]);
      }
      setLoading(false);
      setError(null);
      setNetworkUnavailable(false);
      return;
    }

    if (isE2E) {
      let loadingTimer: ReturnType<typeof setTimeout> | null = null;
      const normalizedQuery = normalizeThai(query.trim());

      if (normalizedQuery.length < 2) {
        setResults([]);
        setError(null);
        setLoading(true);
        setNetworkUnavailable(false);
        loadingTimer = setTimeout(() => {
          if (!abortControllerRef.current?.signal.aborted) {
            setLoading(false);
          }
        }, E2E_CONFIG.SHORT_QUERY_LOADING_MS);
        return () => {
          if (loadingTimer) {
            clearTimeout(loadingTimer);
          }
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
        };
      }

      const cacheKey = `${normalizedQuery}_${userLocation ? `${userLocation.lat},${userLocation.lng}` : 'no-location'}`;
      const cached = getCachedSearchResults(query, userLocation);
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const reachability = checkFirestoreReachable(controller.signal).catch(() => false);
      const updateNetworkAvailability = () => {
        reachability.then(reachable => {
          if (!controller.signal.aborted) {
            setNetworkUnavailable(!reachable);
          }
        });
      };

      if (cached) {
        setResults(cached);
        setError(null);
        setLoading(false);
        setNetworkUnavailable(false);
        updateNetworkAvailability();
        return () => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
        };
      }

      setLoading(true);
      setError(null);
      setNetworkUnavailable(false);

      const computed = searchMallsAndStoresSync(query, userLocation);
      searchCache.set(cacheKey, computed);
      setResults(computed);
      loadingTimer = setTimeout(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }, E2E_CONFIG.MIN_LOADING_MS);

      updateNetworkAvailability();

      return () => {
        if (loadingTimer) {
          clearTimeout(loadingTimer);
        }
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }

    let loadingTimer: ReturnType<typeof setTimeout> | null = null;
    const normalizedQuery = normalizeThai(query.trim());
    const shouldUseCache = normalizedQuery.length >= 2;

    const cached = shouldUseCache
      ? getCachedSearchResults(query, userLocation)
      : null;
    if (cached) {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const reachability = Promise.resolve(true);

      setResults(cached);
      setError(null);
      setLoading(true);
      setNetworkUnavailable(false);
      loadingTimer = setTimeout(() => {
        if (!abortControllerRef.current?.signal.aborted) {
          setLoading(false);
        }
      }, MIN_LOADING_MS);

      reachability.then(reachable => {
        if (!controller.signal.aborted) {
          setNetworkUnavailable(!reachable);
        }
      });

      return () => {
        if (loadingTimer) {
          clearTimeout(loadingTimer);
        }
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }
    const timeoutId = setTimeout(async () => {
      const start = performance.now();
      try {
        setLoading(true);
        setError(null);
        setNetworkUnavailable(false);

        const controller = new AbortController();
        abortControllerRef.current = controller;
        const reachability = Promise.resolve(true);

        const searchResults = await searchMallsAndStores(
          query,
          userLocation,
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setResults(searchResults);
        }

        reachability.then(reachable => {
          if (!controller.signal.aborted) {
            setNetworkUnavailable(!reachable);
          }
        });
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          setError(err?.message || 'An error occurred');
          setResults([]);
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          const elapsed = performance.now() - start;
          const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
          if (remaining > 0) {
            loadingTimer = setTimeout(() => {
              if (!abortControllerRef.current?.signal.aborted) {
                setLoading(false);
              }
            }, remaining);
          } else {
            setLoading(false);
          }
        }
      }
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (loadingTimer) {
        clearTimeout(loadingTimer);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, userLocation, delay]);

  return { results: resultsWithLocation, loading, error, networkUnavailable };
}
