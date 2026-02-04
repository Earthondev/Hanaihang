import {
  collection,
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
  Timestamp,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';

import { db } from '../config/firebase';
import { Mall } from '../types/mall-system';

// Helper to create slug from display name
function createSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^\u0E00-\u0E7Fa-z0-9\s-]/g, '') // Keep Thai, English, numbers, spaces, hyphens
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Helper to convert Firestore document to typed object
function convertTimestamps<T extends DocumentData>(data: T): T {
  const converted = { ...data } as unknown;
  if (converted.createdAt?.toDate) {
    converted.createdAt = converted.createdAt.toDate();
  }
  if (converted.updatedAt?.toDate) {
    converted.updatedAt = converted.updatedAt.toDate();
  }
  return converted;
}

// ======================
// MALL OPERATIONS
// ======================

/**
 * สร้างห้างใหม่
 */
export async function createMall(data: MallFormData): Promise<string> {
  const now = Timestamp.now();
  const slug = data.name || createSlug(data.displayName);
  
  const mallData: Omit<Mall, 'id'> = {
    name: slug,
    displayName: data.displayName,
    address: data.address,
    district: data.district,
    contact: {
      phone: data.phone,
      website: data.website,
      social: data.social
    },
    coords: data.lat && data.lng ? {
      lat: data.lat,
      lng: data.lng
    } : undefined,
    hours: data.openTime && data.closeTime ? {
      open: data.openTime,
      close: data.closeTime
    } : undefined,
    createdAt: now,
    updatedAt: now
  };

  const docRef = await addDoc(collection(db, 'malls'), mallData);
  
  // สร้าง floors เริ่มต้น
  await createDefaultFloors(docRef.id);
  
  return docRef.id;
}

/**
 * ดึงรายการห้างทั้งหมด
 */
export async function listMalls(limitCount?: number): Promise<Mall[]> {
  const constraints: QueryConstraint[] = [orderBy('displayName')];
  if (limitCount) {
    constraints.push(limit(limitCount));
  }

  const q = query(collection(db, 'malls'), ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data() as Omit<Mall, 'id'>)
  }));
}

/**
 * ดึงข้อมูลห้างตาม ID
 */
export async function getMall(_mallId: string): Promise<Mall | null> {
  const docRef = doc(db, 'malls', _mallId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  return {
    id: docSnap.id,
    ...convertTimestamps(docSnap.data() as Omit<Mall, 'id'>)
  };
}

/**
 * ดึงข้อมูลห้างตาม slug name
 */
export async function getMallByName(name: string): Promise<Mall | null> {
  const q = query(collection(db, 'malls'), where('name', '==', name));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...convertTimestamps(doc.data() as Omit<Mall, 'id'>)
  };
}

/**
 * อัปเดตข้อมูลห้าง
 */
export async function updateMall(_mallId: string, data: Partial<MallFormData>): Promise<void> {
  const updateData: Partial<Mall> = {
    updatedAt: Timestamp.now()
  };

  if (data.displayName) updateData.displayName = data.displayName;
  if (data.address) updateData.address = data.address;
  if (data.district) updateData.district = data.district;
  
  if (data.phone || data.website || data.social) {
    updateData.contact = {
      phone: data.phone,
      website: data.website,
      social: data.social
    };
  }
  
  if (data.lat && data.lng) {
    updateData.coords = {
      lat: data.lat,
      lng: data.lng
    };
  }
  
  if (data.openTime && data.closeTime) {
    updateData.hours = {
      open: data.openTime,
      close: data.closeTime
    };
  }

  const docRef = doc(db, 'malls', _mallId);
  await updateDoc(docRef, updateData);
}

/**
 * ลบห้าง
 */
export async function deleteMall(_mallId: string): Promise<void> {
  // ลบ stores ทั้งหมดในห้างก่อน
  await deleteAllStores(_mallId);
  
  // ลบ floors ทั้งหมด
  await deleteAllFloors(_mallId);
  
  // ลบห้าง
  const docRef = doc(db, 'malls', _mallId);
  await deleteDoc(docRef);
}

// ======================
// FLOOR OPERATIONS
// ======================

/**
 * สร้าง floors เริ่มต้นสำหรับห้างใหม่
 */
async function createDefaultFloors(_mallId: string): Promise<void> {
  const defaultFloors = [
    { label: 'G', order: 0 },
    { label: '1', order: 1 },
    { label: '2', order: 2 },
    { label: '3', order: 3 }
  ];

  const promises = defaultFloors.map(floor => createFloor(_mallId, floor));
  await Promise.all(promises);
}

/**
 * สร้าง floor ใหม่
 */
export async function createFloor(_mallId: string, data: { label: string; order: number }): Promise<string> {
  const now = Timestamp.now();
  
  const floorData: Omit<Floor, 'id'> = {
    label: data.label,
    order: data.order,
    createdAt: now,
    updatedAt: now
  };

  const docRef = await addDoc(collection(db, 'malls', _mallId, 'floors'), floorData);
  return docRef.id;
}

/**
 * ดึงรายการ floors ของห้าง
 */
export async function listFloors(_mallId: string): Promise<Floor[]> {
  const q = query(
    collection(db, 'malls', _mallId, 'floors'),
    orderBy('order')
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data() as Omit<Floor, 'id'>)
  }));
}

/**
 * ลบ floors ทั้งหมดของห้าง
 */
async function deleteAllFloors(_mallId: string): Promise<void> {
  const floors = await listFloors(_mallId);
  const promises = floors.map(floor => 
    deleteDoc(doc(db, 'malls', _mallId, 'floors', floor.id!))
  );
  await Promise.all(promises);
}

// ======================
// STORE OPERATIONS
// ======================

/**
 * สร้างร้านใหม่
 */
export async function createStore(_mallId: string, data: StoreFormData): Promise<string> {
  const now = Timestamp.now();
  
  const storeData: Omit<Store, 'id'> = {
    name: data.name,
    category: data.category,
    floorId: data.floorId,
    unit: data.unit,
    phone: data.phone,
    hours: data.hours,
    status: data.status,
    createdAt: now,
    updatedAt: now
  };

  const docRef = await addDoc(collection(db, 'malls', _mallId, 'stores'), storeData);
  return docRef.id;
}

/**
 * ดึงรายการร้านของห้าง
 */
export async function listStores(_mallId: string, filters?: SearchFilters): Promise<Store[]> {
  let q = query(collection(db, 'malls', _mallId, 'stores'));

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

  // Order by name
  q = query(q, orderBy('name'));

  const snapshot = await getDocs(q);
  let stores = snapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data() as Omit<Store, 'id'>)
  }));

  // Apply text search filter (client-side)
  if (filters?.query) {
    const searchTerm = filters.query.toLowerCase();
    stores = stores.filter(store =>
      store.name.toLowerCase().includes(searchTerm)
    );
  }

  return stores;
}

/**
 * ค้นหาร้านข้ามทุกห้าง
 */
export async function searchStoresGlobally(query: string, limitCount = 50): Promise<{ store: Store; _mallId: string }[]> {
  // ดึงรายการห้างทั้งหมด
  const malls = await listMalls();
  const results: { store: Store; _mallId: string }[] = [];

  // ค้นหาในแต่ละห้าง
  for (const mall of malls) {
    const stores = await listStores(mall.id!, { query });
    results.push(...stores.map(store => ({ store, _mallId: mall.id! })));
    
    // หยุดถ้าเกิน limit
    if (results.length >= limitCount) {
      break;
    }
  }

  return results.slice(0, limitCount);
}

/**
 * ดึงข้อมูลร้านตาม ID
 */
export async function getStore(_mallId: string, storeId: string): Promise<Store | null> {
  const docRef = doc(db, 'malls', _mallId, 'stores', storeId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  return {
    id: docSnap.id,
    ...convertTimestamps(docSnap.data() as Omit<Store, 'id'>)
  };
}

/**
 * อัปเดตข้อมูลร้าน
 */
export async function updateStore(_mallId: string, storeId: string, data: Partial<StoreFormData>): Promise<void> {
  const updateData: Partial<Store> = {
    ...data,
    updatedAt: Timestamp.now()
  };

  const docRef = doc(db, 'malls', _mallId, 'stores', storeId);
  await updateDoc(docRef, updateData);
}

/**
 * ลบร้าน
 */
export async function deleteStore(_mallId: string, storeId: string): Promise<void> {
  const docRef = doc(db, 'malls', _mallId, 'stores', storeId);
  await deleteDoc(docRef);
}

/**
 * ลบร้านทั้งหมดในห้าง
 */
async function deleteAllStores(_mallId: string): Promise<void> {
  const stores = await listStores(_mallId);
  const promises = stores.map(store => 
    deleteDoc(doc(db, 'malls', _mallId, 'stores', store.id!))
  );
  await Promise.all(promises);
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
    floorId: updates?.floorId || sourceStore.floorId,
    unit: updates?.unit || sourceStore.unit,
    phone: updates?.phone || sourceStore.phone,
    hours: updates?.hours || sourceStore.hours,
    status: sourceStore.status
  };

  return await createStore(targetMallId, newStoreData);
}
