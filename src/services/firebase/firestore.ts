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
  writeBatch,
  serverTimestamp,
  FieldValue
} from 'firebase/firestore';

import { db } from './firebase';
import { Mall, Floor, Store, MallFormData, StoreFormData } from '../../types/mall-system';
import { MallInput } from '../../legacy/validation/mall.schema';

// Helper to create slug from display name
export function toSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^\u0E00-\u0E7Fa-z0-9\s-]/g, '') // Keep Thai, English, numbers, spaces, hyphens
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

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
// MALL OPERATIONS
// ======================

/**
 * สร้างห้างใหม่
 */
export async function createMall(data: MallFormData): Promise<string> {
  const now = serverTimestamp();
  const slug = data.name || toSlug(data.displayName);
  
  const mallData = {
    name: slug,
    displayName: data.displayName,
    address: data.address,
    district: data.district,
    contact: {
      phone: data.phone,
      website: data.website
    },
    coords: data.lat && data.lng ? {
      lat: typeof data.lat === 'string' ? parseFloat(data.lat) : data.lat,
      lng: typeof data.lng === 'string' ? parseFloat(data.lng) : data.lng
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
  const constraints: any[] = [orderBy('displayName')];
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
export async function getMall(mallId: string): Promise<Mall | null> {
  const docRef = doc(db, 'malls', mallId);
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
export async function updateMall(id: string, data: Partial<MallInput>): Promise<void> {
  const updateData: any = {
    updatedAt: serverTimestamp(),
  };

  if (data.displayName !== undefined) updateData.displayName = data.displayName;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.district !== undefined) updateData.district = data.district;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.website !== undefined) updateData.website = data.website;
  if (data.social !== undefined) updateData.social = data.social;
  if (data.openTime !== undefined) updateData.openTime = data.openTime;
  if (data.closeTime !== undefined) updateData.closeTime = data.closeTime;

  // Handle coordinates
  if (data.location !== undefined) {
    updateData.coords = {
      lat: data.location.lat || 0,
      lng: data.location.lng || 0,
    };
  }

  // Handle hours
  if (data.openTime || data.closeTime) {
    updateData.hours = {
      open: data.openTime || '10:00',
      close: data.closeTime || '22:00',
    };
  }

  await updateDoc(doc(db, 'malls', id), updateData);
}

/**
 * ลบห้าง
 */
export async function deleteMall(mallId: string): Promise<void> {
  const batch = writeBatch(db);
  
  // ลบ stores ทั้งหมดในห้าง
  const storesSnapshot = await getDocs(collection(db, 'malls', mallId, 'stores'));
  storesSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  // ลบ floors ทั้งหมด
  const floorsSnapshot = await getDocs(collection(db, 'malls', mallId, 'floors'));
  floorsSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  // ลบห้าง
  batch.delete(doc(db, 'malls', mallId));
  
  await batch.commit();
}

// ======================
// FLOOR OPERATIONS
// ======================

/**
 * สร้าง floors เริ่มต้นสำหรับห้างใหม่
 */
async function createDefaultFloors(mallId: string): Promise<void> {
  const defaultFloors = [
    { label: 'G', order: 0 },
    { label: '1', order: 1 },
    { label: '2', order: 2 },
    { label: '3', order: 3 }
  ];

  const promises = defaultFloors.map(floor => createFloor(mallId, floor));
  await Promise.all(promises);
  
  // อัปเดต floorCount ในห้าง
  await updateMallFloorCount(mallId, defaultFloors.length);
}

/**
 * สร้าง floor ใหม่
 */
export async function createFloor(mallId: string, data: { label: string; order: number }): Promise<string> {
  const now = serverTimestamp();
  
  const floorData = {
    label: data.label,
    order: data.order,
    createdAt: now,
    updatedAt: now
  };

  const docRef = await addDoc(collection(db, 'malls', mallId, 'floors'), floorData);
  
  // อัปเดต floorCount ในห้าง
  await updateMallFloorCount(mallId);
  
  return docRef.id;
}

/**
 * อัปเดต floorCount ในห้าง
 */
async function updateMallFloorCount(mallId: string, count?: number): Promise<void> {
  const mallRef = doc(db, 'malls', mallId);
  
  if (count !== undefined) {
    // ใช้จำนวนที่ส่งมา
    await updateDoc(mallRef, { 
      floorCount: count,
      updatedAt: serverTimestamp()
    });
  } else {
    // นับจำนวน floors จริง
    const floors = await listFloors(mallId);
    await updateDoc(mallRef, { 
      floorCount: floors.length,
      updatedAt: serverTimestamp()
    });
  }
}

/**
 * ดึงรายการ floors ของห้าง
 */
export async function listFloors(mallId: string): Promise<Floor[]> {
  const q = query(
    collection(db, 'malls', mallId, 'floors'),
    orderBy('order')
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data() as Omit<Floor, 'id'>)
  }));
}

// ======================
// STORE OPERATIONS
// ======================

/**
 * สร้างร้านใหม่
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
    createdAt: now,
    updatedAt: now
  };

  const docRef = await addDoc(collection(db, 'malls', mallId, 'stores'), storeData);
  return docRef.id;
}

/**
 * ดึงรายการร้านของห้าง
 */
export async function listStores(mallId: string, filters?: {
  floorId?: string;
  category?: string;
  status?: string;
  query?: string;
}): Promise<Store[]> {
  let q = query(collection(db, 'malls', mallId, 'stores'));

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
export async function searchStoresGlobally(query: string, limitCount = 50): Promise<{ store: Store; mallId: string }[]> {
  // ดึงรายการห้างทั้งหมด
  const malls = await listMalls();
  const results: { store: Store; mallId: string }[] = [];

  // ค้นหาในแต่ละห้าง
  for (const mall of malls) {
    const stores = await listStores(mall.id!, { query });
    results.push(...stores.map(store => ({ store, mallId: mall.id! })));
    
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
export async function getStore(mallId: string, storeId: string): Promise<Store | null> {
  const docRef = doc(db, 'malls', mallId, 'stores', storeId);
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
export async function updateStore(mallId: string, storeId: string, data: Partial<StoreFormData>): Promise<void> {
  const updateData: any = {
    ...data,
    updatedAt: serverTimestamp()
  };

  const docRef = doc(db, 'malls', mallId, 'stores', storeId);
  await updateDoc(docRef, updateData);
}

/**
 * ลบร้าน
 */
export async function deleteStore(mallId: string, storeId: string): Promise<void> {
  const docRef = doc(db, 'malls', mallId, 'stores', storeId);
  await deleteDoc(docRef);
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
// SEED DATA
// ======================

/**
 * Seed ข้อมูลห้าง 10 แห่ง
 */
export async function seedMalls(): Promise<void> {
  const seedData = [
    {
      name: "central-rama-3",
      displayName: "Central Rama 3",
      district: "Bangkok",
      address: "79 Sathupradit Rd, Chong Nonsi, Yan Nawa, Bangkok",
      coords: { lat: 13.6959, lng: 100.5407 },
      hours: { open: "10:00", close: "22:00" },
      contact: { phone: "02-103-5333", website: "https://www.central.co.th/" }
    },
    {
      name: "centralworld",
      displayName: "CentralWorld",
      district: "Bangkok",
      address: "999/9 Rama I Rd, Pathum Wan, Bangkok",
      coords: { lat: 13.7466, lng: 100.5396 },
      hours: { open: "10:00", close: "22:00" },
      contact: { phone: "02-640-7000", website: "https://www.centralworld.co.th/" }
    },
    {
      name: "central-ladprao",
      displayName: "Central Ladprao",
      district: "Bangkok",
      address: "1691 Phahonyothin Rd, Chatuchak, Bangkok",
      coords: { lat: 13.8160, lng: 100.5610 },
      hours: { open: "10:00", close: "22:00" },
      contact: { phone: "02-541-1111", website: "https://www.central.co.th/" }
    },
    {
      name: "central-pinklao",
      displayName: "Central Pinklao",
      district: "Bangkok",
      address: "7/222 Borommaratchachonnani Rd, Arun Amarin, Bangkok",
      coords: { lat: 13.7767, lng: 100.4762 },
      hours: { open: "10:00", close: "22:00" }
    },
    {
      name: "central-westgate",
      displayName: "Central WestGate",
      district: "Nonthaburi",
      address: "199, 199/1 Moo 6, Sao Thong Hin, Bang Yai, Nonthaburi",
      coords: { lat: 13.8743, lng: 100.4116 },
      hours: { open: "10:00", close: "22:00" }
    },
    {
      name: "the-mall-bangkapi",
      displayName: "The Mall Lifestore Bangkapi",
      district: "Bangkok",
      address: "3522 Lat Phrao Rd, Bang Kapi, Bangkok",
      coords: { lat: 13.7656, lng: 100.6440 },
      hours: { open: "10:00", close: "22:00" }
    },
    {
      name: "the-mall-thapra",
      displayName: "The Mall Thapra",
      district: "Bangkok",
      address: "99 Ratchadaphisek Rd, Bukkhalo, Thon Buri, Bangkok",
      coords: { lat: 13.7147, lng: 100.4765 },
      hours: { open: "10:00", close: "22:00" }
    },
    {
      name: "siam-paragon",
      displayName: "Siam Paragon",
      district: "Bangkok",
      address: "991 Rama I Rd, Pathum Wan, Bangkok",
      coords: { lat: 13.7460, lng: 100.5340 },
      hours: { open: "10:00", close: "22:00" },
      contact: { website: "https://www.siamparagon.co.th/" }
    },
    {
      name: "emporium",
      displayName: "The Emporium",
      district: "Bangkok",
      address: "622 Sukhumvit Rd, Khlong Tan, Khlong Toei, Bangkok",
      coords: { lat: 13.7300, lng: 100.5690 },
      hours: { open: "10:00", close: "22:00" }
    },
    {
      name: "iconsiam",
      displayName: "ICONSIAM",
      district: "Bangkok",
      address: "299 Charoen Nakhon Rd, Khlong Ton Sai, Khlong San, Bangkok",
      coords: { lat: 13.7260, lng: 100.5100 },
      hours: { open: "10:00", close: "22:00" }
    }
  ];

  const colRef = collection(db, 'malls');
  for (const mall of seedData) {
    await addDoc(colRef, {
      ...mall,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
}
