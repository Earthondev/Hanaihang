import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  listMalls,
  getMall,
  listFloors,
  listStores,
  getStore,
  createMall,
  createStore,
  updateMall,
  updateStore,
  deleteMall,
  deleteStore,
} from '../lib/firestore';
// import { MallFormDataFormData } from '../types/mall-system';

// Query Keys
export const queryKeys = {
  malls: ['malls'] as const,
  mall: (id: string) => ['mall', id] as const,
  floors: (mallId: string) => ['floors', mallId] as const,
  stores: (mallId: string, filters?: any) =>
    ['stores', mallId, filters] as const,
  store: (mallId: string, storeId: string) =>
    ['store', mallId, storeId] as const,
};

// Mall Hooks
export function useMalls(limit?: number) {
  return useQuery({
    queryKey: queryKeys.malls,
    queryFn: () => listMalls(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useMall(mallId: string) {
  return useQuery({
    queryKey: queryKeys.mall(mallId),
    queryFn: () => getMall(mallId),
    enabled: !!mallId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateMall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => createMall(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.malls });
    },
  });
}

export function useUpdateMall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mallId, data }: { mallId: string; data: Partial<any> }) =>
      updateMall(mallId, data),
    onSuccess: (_, { mallId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.malls });
      queryClient.invalidateQueries({ queryKey: queryKeys.mall(mallId) });
    },
  });
}

export function useDeleteMall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mallId: string) => deleteMall(mallId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.malls });
    },
  });
}

// Floor Hooks
export function useFloors(mallId: string) {
  return useQuery({
    queryKey: queryKeys.floors(mallId),
    queryFn: () => listFloors(mallId),
    enabled: !!mallId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Store Hooks
export function useStores(
  mallId: string,
  filters?: {
    floorId?: string;
    category?: string;
    status?: string;
    query?: string;
  },
) {
  return useQuery({
    queryKey: queryKeys.stores(mallId, filters),
    queryFn: () => listStores(mallId, filters),
    enabled: !!mallId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useStore(mallId: string, storeId: string) {
  return useQuery({
    queryKey: queryKeys.store(mallId, storeId),
    queryFn: () => getStore(mallId, storeId),
    enabled: !!mallId && !!storeId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mallId, data }: { mallId: string; data: any }) =>
      createStore(mallId, data),
    onSuccess: (_, { mallId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stores(mallId) });
    },
  });
}

export function useUpdateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      mallId,
      storeId,
      data,
    }: {
      mallId: string;
      storeId: string;
      data: Partial<any>;
    }) => updateStore(mallId, storeId, data),
    onSuccess: (_, { mallId, storeId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stores(mallId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.store(mallId, storeId),
      });
    },
  });
}

export function useDeleteStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mallId, storeId }: { mallId: string; storeId: string }) =>
      deleteStore(mallId, storeId),
    onSuccess: (_, { mallId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stores(mallId) });
    },
  });
}
