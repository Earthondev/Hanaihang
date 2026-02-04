import { useCallback } from 'react';

import { cache, CACHE_KEYS } from '../lib/cache';

/**
 * Hook สำหรับจัดการ cache invalidation
 * ใช้เมื่อมีการอัปเดตข้อมูลเพื่อให้ระบบแสดงผลทันที
 */
export function useCacheInvalidation() {
  const invalidateMalls = useCallback(() => {
    console.log('🧹 ล้าง cache ห้างทั้งหมด');
    cache.delete(CACHE_KEYS.MALLS);
    cache.delete(CACHE_KEYS.MALLS_STATS);
  }, []);

  const invalidateStores = useCallback((mallId?: string) => {
    console.log('🧹 ล้าง cache ร้าน', mallId ? `ในห้าง ${mallId}` : 'ทั้งหมด');
    cache.delete(CACHE_KEYS.STORES_ALL);
    if (mallId) {
      cache.delete(`${CACHE_KEYS.STORES}_${mallId}`);
    }
  }, []);

  const invalidateAll = useCallback(() => {
    console.log('🧹 ล้าง cache ทั้งหมด');
    cache.clear();
  }, []);

  const invalidateMall = useCallback((mallId: string) => {
    console.log('🧹 ล้าง cache ห้าง:', mallId);
    cache.delete(CACHE_KEYS.MALLS);
    cache.delete(CACHE_KEYS.MALLS_STATS);
    cache.delete(`${CACHE_KEYS.STORES}_${mallId}`);
  }, []);

  const invalidateStore = useCallback((mallId: string, storeId: string) => {
    console.log('🧹 ล้าง cache ร้าน:', storeId, 'ในห้าง:', mallId);
    cache.delete(`${CACHE_KEYS.STORES}_${mallId}`);
    cache.delete(CACHE_KEYS.STORES_ALL);
  }, []);

  return {
    invalidateMalls,
    invalidateStores,
    invalidateAll,
    invalidateMall,
    invalidateStore
  };
}
