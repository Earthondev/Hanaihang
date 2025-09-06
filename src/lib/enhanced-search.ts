import React, { useState, useEffect, useRef } from 'react';
import { normalizeThai } from './thai-normalize';
import { listMalls } from '../services/firebase/firestore';
import { searchStoresGlobally } from '../services/firebase/stores';

// Cache system with stale-while-revalidate
class SearchCache {
  private cache = new Map<string, { data: any; timestamp: number; stale: boolean }>();
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
      stale
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
    TYPE_BONUS: 0.1
  }
};

// Parallel search function
export async function searchMallsAndStores(
  query: string,
  userLocation?: { lat: number; lng: number },
  signal?: AbortSignal
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
    const [malls, stores] = await Promise.all([
      searchMalls(normalizedQuery, signal),
      searchStores(normalizedQuery, signal)
    ]);

    // Unify results
    const unifiedResults = unifySearchResults(malls, stores);
    
    // Cache results
    searchCache.set(cacheKey, unifiedResults);
    
    return unifiedResults;
  } catch (error) {
    if (error.name === 'AbortError') {
      return [];
    }
    console.error('Search error:', error);
    throw error;
  }
}

// Search malls function
async function searchMalls(query: string, signal?: AbortSignal): Promise<any[]> {
  try {
    const malls = await listMalls();
    
    // Filter by normalized name
    const filtered = malls.filter(mall => {
      const normalizedName = normalizeThai(mall.displayName);
      return normalizedName.includes(query);
    });

    return filtered.slice(0, SEARCH_CONFIG.MAX_RESULTS_PER_TYPE);
  } catch (error) {
    if (signal?.aborted) throw new Error('AbortError');
    console.error('Mall search error:', error);
    return [];
  }
}

// Search stores function using collectionGroup
async function searchStores(query: string, signal?: AbortSignal): Promise<any[]> {
  try {
    const storeResults = await searchStoresGlobally(query, SEARCH_CONFIG.MAX_RESULTS_PER_TYPE);
    
    // Transform to unified format
    return storeResults.map(({ store, mallId }) => ({
      id: store.id,
      kind: 'store' as const,
      name: store.name,
      displayName: store.name,
      mallName: store.mallName || '',
      mallId: mallId,
      mallSlug: mallId, // Assuming mallId is the slug
      coords: store.coords,
      mallCoords: store.mallCoords,
      floorLabel: store.floorLabel,
      category: store.category,
      hours: store.hours,
      openNow: store.openNow,
      distanceKm: store.distanceKm,
      score: store.score
    }));
  } catch (error) {
    if (signal?.aborted) throw new Error('AbortError');
    console.error('Store search error:', error);
    return [];
  }
}

// Unify search results
function unifySearchResults(malls: any[], stores: any[]): UnifiedSearchResult[] {
  const unified: UnifiedSearchResult[] = [];

  // Add malls
  malls.forEach(mall => {
    unified.push({
      id: mall.id,
      kind: 'mall',
      name: mall.name,
      displayName: mall.displayName,
      coords: mall.coords,
      hours: mall.hours,
      openNow: mall.hours ? isCurrentlyOpen(mall.hours) : false
    });
  });

  // Add stores
  stores.forEach(store => {
    unified.push({
      id: store.id,
      kind: 'store',
      name: store.name,
      displayName: store.name,
      mallName: store.mallName,
      mallId: store.mallId,
      mallSlug: store.mallSlug,
      mallCoords: store.mallCoords,
      floorLabel: store.floorLabel,
      category: store.category,
      hours: store.hours,
      openNow: store.openNow
    });
  });

  return unified;
}

// Calculate ranking score
export function calculateSearchScore(
  result: UnifiedSearchResult,
  userLocation?: { lat: number; lng: number }
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
  userLocation?: { lat: number; lng: number }
): UnifiedSearchResult[] {
  return results
    .map(result => ({
      ...result,
      score: calculateSearchScore(result, userLocation)
    }))
    .sort((a, b) => a.score - b.score);
}

// Check if currently open
function isCurrentlyOpen(hours: { open: string; close: string }): boolean {
  if (!hours.open || !hours.close) return false;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [openHour, openMin] = hours.open.split(':').map(Number);
  const [closeHour, closeMin] = hours.close.split(':').map(Number);
  
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  return currentTime >= openTime && currentTime <= closeTime;
}

// Debounced search hook
export function useDebouncedSearch(
  query: string,
  userLocation?: { lat: number; lng: number },
  delay: number = SEARCH_CONFIG.DEBOUNCE_MS
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

        const searchResults = await searchMallsAndStores(query, userLocation, controller.signal);
        
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

