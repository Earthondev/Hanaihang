/**
 * Store Service - Unified Store Operations
 * Uses subcollection structure: malls/{mallId}/stores/{storeId}
 * Supports both single-mall and cross-mall operations
 */

import {
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';

import { StoreFormData } from '../../types/mall-system';

import { db } from './firebase';
import { 
  mallStoresCol, 
  storeDoc, 
  allStoresGroup,
  legacyStoresCol 
} from './paths';

// Helper to convert Firestore document to typed object
function convertTimestamps<T extends { createdAt?: any; updatedAt?: any }>(data: T): T {
  const converted = { ...data };
  if (converted.createdAt?.toDate) {
    converted.createdAt = converted.createdAt.toDate();
  }
  if (converted.updatedAt?.toDate) {
    converted.updatedAt = converted.updatedAt.toDate();
  }
  return converted;
}

// ======================
// SINGLE MALL STORE OPERATIONS
// ======================

/**
 * ดึงรายการร้านของห้างเดียว
 * Path: malls/{mallId}/stores
 */
export async function listStores(
  mallId: string, 
  filters?: {
    floorId?: string;
    category?: string;
    status?: string;
    query?: string;
  }
): Promise<Store[]> {
  let q = query(mallStoresCol(mallId));

  // Apply filters
  if (filters?.floorId) {
    q = query(q, where('floorId', '==', filters.floorId));
  }
  
  if (filters?.category) {
    q = query(q, where('category', '==', filters.category));
  }
  
  if (filters?.status) {
    q = query(q, where('status', '==', filters.status));
  }

  const snapshot = await getDocs(q);
  let stores = snapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data() as Omit<Store, 'id'>)
  }));

  // Sort by name (client-side)
  stores.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  // Apply text search filter (client-side)
  if (filters?.query) {
    const searchTerm = filters.query.toLowerCase();
    stores = stores.filter(store =>
      (store.name || '').toLowerCase().includes(searchTerm)
    );
  }

  return stores;
}

/**
 * ดึงข้อมูลร้านตาม ID ในห้างเดียว
 * รองรับทั้ง root collection และ nested collection
 */
export async function getStore(mallId: string, storeId: string): Promise<Store | null> {
  // 1) ลอง root collection ก่อน: stores/{storeId}
  const rootRef = doc(db, 'stores', storeId);
  const rootSnap = await getDoc(rootRef);
  
  if (rootSnap.exists()) {
    const storeData = rootSnap.data() as Store;
    const storeWithId = { 
      ...storeData, 
      id: rootSnap.id, 
      mallId: storeData.mallId || mallId // ใส่ mallId ให้ด้วย
    };
    
    console.log('✅ Store found in root collection:', { storeId, mallId, name: storeData.name });
    return convertTimestamps(storeWithId);
  }
  
  // 2) ลอง nested collection: malls/{mallId}/stores/{storeId}
  const nestedRef = storeDoc(mallId, storeId);
  const nestedSnap = await getDoc(nestedRef);
  
  if (nestedSnap.exists()) {
    const storeData = nestedSnap.data() as Store;
    const storeWithId = { ...storeData, id: nestedSnap.id, mallId };
    
    console.log('✅ Store found in nested collection:', { storeId, mallId, name: storeData.name });
    return convertTimestamps(storeWithId);
  }
  
  console.warn('❌ Store not found in both paths:', { 
    mallId, 
    storeId, 
    rootPath: `stores/${storeId}`,
    nestedPath: `malls/${mallId}/stores/${storeId}`
  });
  
  return null;
}

/**
 * สร้างร้านใหม่ในห้าง
 * Path: malls/{mallId}/stores/{storeId}
 */
export async function createStore(mallId: string, data: StoreFormData): Promise<string> {
  const now = serverTimestamp();
  
  const storeData = {
    name: data.name,
    category: data.category,
    floorId: data.floorId,
    unit: data.unit,
    phone: data.phone,
    hours: data.hours,
    status: data.status,
    // Denormalized fields for search
    _mallId: mallId,
    mallName: '', // Will be populated from mall data
    mallCoords: null, // Will be populated from mall data
    createdAt: now,
    updatedAt: now
  };

  const docRef = await addDoc(mallStoresCol(mallId), storeData);
  
  // Update mall store count
  await updateMallStoreCount(mallId);
  
  return docRef.id;
}

/**
 * อัปเดตข้อมูลร้าน
 * Path: malls/{mallId}/stores/{storeId}
 */
export async function updateStore(
  mallId: string, 
  storeId: string, 
  data: Partial<Store>
): Promise<void> {
  try {
    const storeRef = storeDoc(mallId, storeId);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(storeRef, updateData);
    
    // Clear search cache after update
    try {
      const { clearSearchCache } = await import('../../lib/optimized-search');
      clearSearchCache();
    } catch (error) {
      console.log('Could not clear search cache:', error);
    }
  } catch (error) {
    console.error('Error updating store:', error);
    throw error;
  }
}

/**
 * ลบร้าน
 * Path: malls/{mallId}/stores/{storeId}
 */
export async function deleteStore(mallId: string, storeId: string): Promise<void> {
  const docRef = storeDoc(mallId, storeId);
  await deleteDoc(docRef);
  
  // Update mall store count
  await updateMallStoreCount(mallId);
}

// ======================
// CROSS-MALL STORE OPERATIONS
// ======================

/**
 * ดึงร้านทั้งหมดจากทุกห้าง (ใช้ collectionGroup)
 * Path: collectionGroup('stores')
 */
export async function listAllStores(): Promise<{ store: Store; _mallId: string }[]> {
  const snapshot = await getDocs(allStoresGroup());
  const results: { store: Store; _mallId: string }[] = [];

  snapshot.docs.forEach(doc => {
    const mallId = extractMallIdFromPath(doc.ref.path);
    if (mallId) {
      results.push({
        store: {
          id: doc.id,
          ...convertTimestamps(doc.data() as Omit<Store, 'id'>)
        },
        mallId
      });
    }
  });

  return results;
}

/**
 * ค้นหาร้านข้ามทุกห้าง
 * Path: collectionGroup('stores')
 */
export async function searchStoresGlobally(
  searchQuery: string, 
  limitCount = 50
): Promise<{ store: Store; _mallId: string }[]> {
  if (!searchQuery || searchQuery.trim().length < 1) {
    return [];
  }

  const searchTerm = searchQuery.toLowerCase().trim();
  
  try {
    // Search by normalized name field
    const q = query(
      allStoresGroup(),
      where('name_normalized', '>=', searchTerm),
      where('name_normalized', '<=', searchTerm + '\uf8ff'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    const results: { store: Store; _mallId: string }[] = [];

    snapshot.docs.forEach(doc => {
      const mallId = extractMallIdFromPath(doc.ref.path);
      if (mallId) {
        results.push({
          store: {
            id: doc.id,
            ...convertTimestamps(doc.data() as Omit<Store, 'id'>)
          },
          mallId
        });
      }
    });

    return results;
  } catch (error) {
    console.error('Error searching stores globally:', error);
    return [];
  }
}

/**
 * ค้นหาร้านด้วย ID ข้ามทุกห้าง
 */
export async function findStoreById(storeId: string): Promise<{ store: Store; _mallId: string } | null> {
  try {
    const snapshot = await getDocs(allStoresGroup());
    
    for (const doc of snapshot.docs) {
      if (doc.id === storeId) {
        const mallId = extractMallIdFromPath(doc.ref.path);
        if (mallId) {
          return {
            store: {
              id: doc.id,
              ...convertTimestamps(doc.data() as Omit<Store, 'id'>)
            },
            mallId
          };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding store by ID:', error);
    return null;
  }
}

// ======================
// UTILITY FUNCTIONS
// ======================

/**
 * Extract mall ID from store document path
 */
function extractMallIdFromPath(path: string): string | null {
  const match = path.match(/\/malls\/([^/]+)\/stores\//);
  return match ? match[1] : null;
}

/**
 * Update mall store count
 */
async function updateMallStoreCount(mallId: string): Promise<void> {
  try {
    const stores = await listStores(mallId);
    const mallRef = storeDoc(mallId, 'dummy').parent.parent; // Get mall ref
    
    if (mallRef) {
      await updateDoc(mallRef, {
        storeCount: stores.length,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error updating mall store count:', error);
  }
}

/**
 * ทำซ้ำร้าน (สำหรับ admin)
 */
export async function duplicateStore(
  sourceMallId: string, 
  sourceStoreId: string, 
  targetMallId: string, 
  updates?: Partial<StoreFormData>
): Promise<string> {
  const sourceStore = await getStore(sourceMallId, sourceStoreId);
  if (!sourceStore) {
    throw new Error('Source store not found');
  }

  const newStoreData: StoreFormData = {
    name: updates?.name || `${sourceStore.name} (Copy)`,
    category: sourceStore.category,
    floorId: updates?.floorId || sourceStore.floorId || '',
    unit: updates?.unit || sourceStore.unit || '',
    phone: updates?.phone || sourceStore.phone || '',
    hours: updates?.hours || sourceStore.hours || '',
    status: sourceStore.status
  };

  return await createStore(targetMallId, newStoreData);
}

// ======================
// MIGRATION SUPPORT
// ======================

/**
 * Get stores from legacy top-level collection
 * Used only during migration
 */
export async function getLegacyStores(): Promise<{ store: Store; _mallId: string }[]> {
  const snapshot = await getDocs(legacyStoresCol());
  const results: { store: Store; _mallId: string }[] = [];

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const mallId = data.mallId || data.mallSlug;
    
    if (mallId) {
      results.push({
        store: {
          id: doc.id,
          ...convertTimestamps(data as Omit<Store, 'id'>)
        },
        mallId
      });
    }
  });

  return results;
}
