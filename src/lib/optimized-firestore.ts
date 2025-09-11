import {
  collection,
  collectionGroup,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  QueryDocumentSnapshot
} from 'firebase/firestore';

import { db } from '../config/firebase';
import { Mall, Store } from '../types/mall-system';

import { cache, CACHE_KEYS } from './cache';

// Helper to convert Firestore document to typed object
function convertTimestamps<T extends { createdAt?: any; updatedAt?: any }>(data: T): T {
  const result = { ...data };
  
  if (result.createdAt && result.createdAt.toDate) {
    result.createdAt = result.createdAt.toDate();
  }
  if (result.updatedAt && result.updatedAt.toDate) {
    result.updatedAt = result.updatedAt.toDate();
  }
  
  return result;
}

/**
 * ดึงรายการห้างทั้งหมด (with caching)
 */
export async function listMallsOptimized(): Promise<Mall[]> {
  // Check cache first
  const cached = cache.get<Mall[]>(CACHE_KEYS.MALLS);
  if (cached) {
    console.log('📦 Using cached malls data');
    return cached;
  }

  console.log('🔄 Fetching malls from Firebase...');
  const start = Date.now();
  
  const q = query(collection(db, 'malls'), orderBy('displayName'));
  const snapshot = await getDocs(q);
  
  const malls = snapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data() as Omit<Mall, 'id'>)
  }));

  const time = Date.now() - start;
  console.log(`✅ Fetched ${malls.length} malls in ${time}ms`);

  // Cache for 10 minutes
  cache.set(CACHE_KEYS.MALLS, malls, 10 * 60 * 1000);
  
  return malls;
}

/**
 * ดึงรายการห้างพร้อมสถิติ (ใช้ storeCount/floorCount แทนการ fetch stores)
 */
export async function listMallsWithStats(): Promise<Mall[]> {
  // Check cache first
  const cached = cache.get<Mall[]>(CACHE_KEYS.MALLS_STATS);
  if (cached) {
    console.log('📦 Using cached malls with stats data');
    return cached;
  }

  console.log('🔄 Fetching malls with stats from Firebase...');
  const start = Date.now();
  
  const q = query(collection(db, 'malls'), orderBy('displayName'));
  const snapshot = await getDocs(q);
  
  const malls = snapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data() as Omit<Mall, 'id'>),
    // Ensure storeCount and floorCount are available
    storeCount: doc.data().storeCount || 0,
    floorCount: doc.data().floorCount || 0
  }));

  const time = Date.now() - start;
  console.log(`✅ Fetched ${malls.length} malls with stats in ${time}ms`);

  // Cache for 10 minutes
  cache.set(CACHE_KEYS.MALLS_STATS, malls, 10 * 60 * 1000);
  
  return malls;
}

/**
 * ดึงรายการร้านของห้าง (with caching)
 */
export async function listStoresOptimized(mallId: string): Promise<Store[]> {
  // Check cache first
  const cached = cache.get<Store[]>(CACHE_KEYS.STORES(mallId));
  if (cached) {
    console.log(`📦 Using cached stores data for mall ${mallId}`);
    return cached;
  }

  console.log(`🔄 Fetching stores for mall ${mallId}...`);
  const start = Date.now();
  
  const q = query(collection(db, 'malls', mallId, 'stores'));
  const snapshot = await getDocs(q);
  
  const stores = snapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data() as Omit<Store, 'id'>)
  }));

  const time = Date.now() - start;
  console.log(`✅ Fetched ${stores.length} stores for mall ${mallId} in ${time}ms`);

  // Cache for 5 minutes
  cache.set(CACHE_KEYS.STORES(mallId), stores, 5 * 60 * 1000);
  
  return stores;
}

/**
 * ดึงร้านทั้งหมดจากทุกห้าง (optimized with caching)
 */
export async function listAllStoresOptimized(): Promise<{ store: Store; _mallId: string }[]> {
  // Check cache first
  const cached = cache.get<{ store: Store; _mallId: string }[]>(CACHE_KEYS.STORES_ALL);
  if (cached) {
    console.log('📦 Using cached all stores data');
    return cached;
  }

  console.log('🔄 Fetching all stores from Firebase...');
  const start = Date.now();
  
  const malls = await listMallsOptimized();
  const results: { store: Store; _mallId: string }[] = [];

  // Use Promise.all to fetch stores from all malls in parallel
  const storePromises = malls.map(async (mall) => {
    try {
      const stores = await listStoresOptimized(mall.id!);
      return stores.map(store => ({ store, _mallId: mall.id! }));
    } catch (error) {
      console.error(`Error loading stores for mall ${mall.id}:`, error);
      return [];
    }
  });

  const storeResults = await Promise.all(storePromises);
  storeResults.forEach(mallStores => {
    results.push(...mallStores);
  });

  const time = Date.now() - start;
  console.log(`✅ Fetched ${results.length} stores from ${malls.length} malls in ${time}ms`);

  // Cache for 5 minutes
  cache.set(CACHE_KEYS.STORES_ALL, results, 5 * 60 * 1000);
  
  return results;
}

/**
 * ดึงร้านทั้งหมดจากทุกห้าง (batch optimized - แนะนำ)
 */
export async function listAllStoresBatchOptimized(): Promise<{ store: Store; _mallId: string }[]> {
  // Check cache first
  const cached = cache.get<{ store: Store; _mallId: string }[]>(CACHE_KEYS.STORES_ALL);
  if (cached) {
    console.log('📦 Using cached all stores data');
    return cached;
  }

  console.log('🔄 Fetching all stores from nested collections...');
  const start = Date.now();
  
  // Use collection group query to fetch from all malls/{mallId}/stores
  // Fallback: Use collectionGroup without orderBy if index is not ready
  let snapshot;
  try {
    const q = query(collectionGroup(db, 'stores'), orderBy('name'));
    snapshot = await getDocs(q);
  } catch (error) {
    console.warn('Index not ready, using fallback query:', error);
    // Fallback: Get all stores without orderBy
    const fallbackQ = collectionGroup(db, 'stores');
    snapshot = await getDocs(fallbackQ);
  }
  
  const results: { store: Store; _mallId: string }[] = [];
  
  snapshot.forEach((doc) => {
    const storeData = doc.data() as Store;
    const storeWithId = { ...storeData, id: doc.id };
    
    // Extract mallId from the document path: malls/{mallId}/stores/{storeId}
    const pathParts = doc.ref.path.split('/');
    const mallId = pathParts[1]; // malls/{mallId}/stores/{storeId}
    
    if (mallId) {
      results.push({ store: storeWithId, _mallId: mallId });
    }
  });
  
  // Remove duplicates based on store.id and _mallId combination
  const uniqueResults = results.filter((item, index, self) => 
    index === self.findIndex(t => t.store.id === item.store.id && t._mallId === item._mallId)
  );

  // Sort by name in JavaScript (backup solution)
  uniqueResults.sort((a, b) => a.store.name.localeCompare(b.store.name));

  const time = Date.now() - start;
  console.log(`✅ Fetched ${uniqueResults.length} unique stores from nested collections in ${time}ms`);
  if (results.length !== uniqueResults.length) {
    console.warn(`⚠️  Removed ${results.length - uniqueResults.length} duplicate stores`);
  }

  // Cache for 5 minutes
  cache.set(CACHE_KEYS.STORES_ALL, uniqueResults, 5 * 60 * 1000);
  
  return uniqueResults;
}

/**
 * Clear cache when data is updated
 */
export function clearStoresCache(mallId?: string): void {
  if (mallId) {
    cache.delete(CACHE_KEYS.STORES(mallId));
  } else {
    cache.clearPattern('stores:');
  }
  cache.delete(CACHE_KEYS.STORES_ALL);
}

export function clearMallsCache(): void {
  cache.delete(CACHE_KEYS.MALLS);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return cache.getStats();
}
