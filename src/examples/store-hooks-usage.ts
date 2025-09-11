/**
 * ตัวอย่างการใช้งาน Store Utils ใน React Hooks
 * แสดงวิธีการจัดการ state และ pagination
 */

import { useState, useCallback, useMemo } from 'react';
import { 
  deduplicateStores, 
  mergeUniqueStores, 
  withStorePaths,
  StoreRow 
} from '../lib/store-utils';

// ตัวอย่าง 1: Basic Hook (ไม่ใช่ pagination)
export function useStores(stores: StoreRow[]) {
  const data = useMemo(() => deduplicateStores(stores), [stores]);
  
  return {
    stores: data,
    count: data.length
  };
}

// ตัวอย่าง 2: Pagination Hook
export function usePaginatedStores(initialStores: StoreRow[] = []) {
  const [stores, setStores] = useState<StoreRow[]>(initialStores);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const data = useMemo(() => withStorePaths(stores), [stores]);

  const loadMore = useCallback(async (loadMoreFn: (page: number) => Promise<StoreRow[]>) => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const newStores = await loadMoreFn(page + 1);
      if (newStores.length === 0) {
        setHasMore(false);
      } else {
        setStores(prev => mergeUniqueStores(prev, newStores));
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error loading more stores:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page]);

  const reset = useCallback(() => {
    setStores(initialStores);
    setPage(1);
    setHasMore(true);
  }, [initialStores]);

  return {
    stores: data,
    count: data.length,
    loading,
    hasMore,
    loadMore,
    reset
  };
}

// ตัวอย่าง 3: Infinite Scroll Hook
export function useInfiniteStores(initialStores: StoreRow[] = []) {
  const [stores, setStores] = useState<StoreRow[]>(initialStores);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const data = useMemo(() => withStorePaths(stores), [stores]);

  const loadMore = useCallback(async (loadMoreFn: (offset: number) => Promise<StoreRow[]>) => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const newStores = await loadMoreFn(stores.length);
      if (newStores.length === 0) {
        setHasMore(false);
      } else {
        setStores(prev => mergeUniqueStores(prev, newStores));
      }
    } catch (error) {
      console.error('Error loading more stores:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, stores.length]);

  const reset = useCallback(() => {
    setStores(initialStores);
    setHasMore(true);
  }, [initialStores]);

  return {
    stores: data,
    count: data.length,
    loading,
    hasMore,
    loadMore,
    reset
  };
}

// ตัวอย่าง 4: Search Hook
export function useStoreSearch(stores: StoreRow[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [mallFilter, setMallFilter] = useState('');

  const data = useMemo(() => deduplicateStores(stores), [stores]);

  const filteredStores = useMemo(() => {
    return data.filter(store => {
      const matchesSearch = !searchQuery || 
        store.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMall = !mallFilter || store.mallId === mallFilter;
      return matchesSearch && matchesMall;
    });
  }, [data, searchQuery, mallFilter]);

  return {
    stores: filteredStores,
    count: filteredStores.length,
    searchQuery,
    setSearchQuery,
    mallFilter,
    setMallFilter
  };
}

// ตัวอย่าง 5: Real-time Hook
export function useRealtimeStores(initialStores: StoreRow[] = []) {
  const [stores, setStores] = useState<StoreRow[]>(initialStores);

  const data = useMemo(() => withStorePaths(stores), [stores]);

  const addStore = useCallback((newStore: StoreRow) => {
    setStores(prev => mergeUniqueStores(prev, [newStore]));
  }, []);

  const updateStore = useCallback((updatedStore: StoreRow) => {
    setStores(prev => mergeUniqueStores(prev, [updatedStore]));
  }, []);

  const removeStore = useCallback((storeId: string, mallId: string) => {
    setStores(prev => prev.filter(store => 
      !(store.id === storeId && store.mallId === mallId)
    ));
  }, []);

  const replaceStores = useCallback((newStores: StoreRow[]) => {
    setStores(deduplicateStores(newStores));
  }, []);

  return {
    stores: data,
    count: data.length,
    addStore,
    updateStore,
    removeStore,
    replaceStores
  };
}

// ตัวอย่าง 6: Guard Hook (กรองข้อมูลที่ไม่ถูกต้อง)
export function useStoreGuard<T extends { id?: string; mallId?: string }>(
  rawData: T[]
): StoreRow[] {
  return useMemo(() => {
    // กรองเฉพาะข้อมูลที่มี id และ mallId
    const validStores = rawData.filter((x): x is T & { id: string; mallId: string } => 
      !!x.id && !!x.mallId
    );
    
    return deduplicateStores(validStores as StoreRow[]);
  }, [rawData]);
}
