import { useQuery, useQueryClient } from '@tanstack/react-query';

import { listMallsWithStats, listAllStoresBatchOptimized } from '@/lib/optimized-firestore';
import { Mall } from '@/types/mall-system';

// Query keys
export const queryKeys = {
  malls: ['malls'] as const,
  mallsWithStats: ['malls', 'stats'] as const,
  stores: ['stores'] as const,
  storesByMall: (mallId: string) => ['stores', 'mall', mallId] as const,
  mall: (mallId: string) => ['mall', mallId] as const,
} as const;

// Hooks for malls
export function useMallsWithStats() {
  return useQuery({
    queryKey: queryKeys.mallsWithStats,
    queryFn: listMallsWithStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useAllStores() {
  return useQuery({
    queryKey: queryKeys.stores,
    queryFn: listAllStoresBatchOptimized,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Mutation hooks for invalidating cache
export function useInvalidateMalls() {
  const queryClient = useQueryClient();
  
  return {
    invalidateMalls: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.malls });
      queryClient.invalidateQueries({ queryKey: queryKeys.mallsWithStats });
    },
    invalidateStores: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stores });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.malls });
      queryClient.invalidateQueries({ queryKey: queryKeys.mallsWithStats });
      queryClient.invalidateQueries({ queryKey: queryKeys.stores });
    }
  };
}

// Prefetch hooks
export function usePrefetchMalls() {
  const queryClient = useQueryClient();
  
  return {
    prefetchMalls: () => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.mallsWithStats,
        queryFn: listMallsWithStats,
        staleTime: 5 * 60 * 1000,
      });
    },
    prefetchStores: () => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.stores,
        queryFn: listAllStoresBatchOptimized,
        staleTime: 2 * 60 * 1000,
      });
    }
  };
}

// Optimistic updates
export function useOptimisticMallUpdate() {
  const queryClient = useQueryClient();
  
  return {
    updateMallOptimistically: (mallId: string, updates: Partial<Mall>) => {
      // Update malls list
      queryClient.setQueryData(queryKeys.mallsWithStats, (oldData: Mall[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(mall => 
          mall.id === mallId ? { ...mall, ...updates } : mall
        );
      });
      
      // Update individual mall
      queryClient.setQueryData(queryKeys.mall(mallId), (oldData: Mall | undefined) => {
        if (!oldData) return oldData;
        return { ...oldData, ...updates };
      });
    },
    
    updateStoreCountOptimistically: (mallId: string, delta: number) => {
      queryClient.setQueryData(queryKeys.mallsWithStats, (oldData: Mall[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(mall => 
          mall.id === mallId 
            ? { ...mall, storeCount: (mall.storeCount || 0) + delta }
            : mall
        );
      });
    }
  };
}
