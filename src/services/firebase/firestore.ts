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
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';

import { MallFormData, Mall, Floor, Store, StoreFormData } from '../../types/mall-system';
import { MallInput } from '../../legacy/validation/mall.schema';

import { db } from './firebase';

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
    // Basic info
    name: slug,
    displayName: data.displayName,
    address: data.address,
    district: data.district,
    
    // Contact info
    contact: {
      phone: data.phone || '',
      website: data.website || ''
    },
    
    // Schema v2: top-level lat/lng
    lat: typeof data.lat === 'string' ? parseFloat(data.lat) : (data.lat || 0),
    lng: typeof data.lng === 'string' ? parseFloat(data.lng) : (data.lng || 0),
    
    // Legacy coords for compatibility
    coords: data.lat && data.lng ? {
      lat: typeof data.lat === 'string' ? parseFloat(data.lat) : data.lat,
      lng: typeof data.lng === 'string' ? parseFloat(data.lng) : data.lng
    } : undefined,
    
    // Hours handling
    hours: data.openTime && data.closeTime ? {
      open: data.openTime,
      close: data.closeTime
    } : undefined,
    
    // Support hours field for non-everyday schedules
    ...(data.hours && { hours: data.hours }),
    
    // Social media
    social: data.social || '',
    
    // Logo
    logoUrl: data.logoUrl || '',
    
    // System fields
    storeCount: 0,
    floorCount: 0,
    createdAt: now,
    updatedAt: now,
    published: true,
    featured: false,
    source: 'admin-create'
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
export async function updateMall(id: string, data: Partial<MallInput>): Promise<void> {
  try {
    // ดึงข้อมูลห้างเดิมก่อนเพื่อ merge contact field
    const mallRef = doc(db, 'malls', id);
    const mallSnap = await getDoc(mallRef);
    
    if (!mallSnap.exists()) {
      throw new Error('ห้างไม่พบ');
    }
    
    const existingMall = mallSnap.data();
    const existingContact = existingMall.contact || {};
    
    const updateData: any = {
      updatedAt: serverTimestamp(),
    };

    // Basic fields
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.district !== undefined) updateData.district = data.district;

    // Contact fields - merge with existing data
    const contactUpdates: any = { ...existingContact };
    if (data.phone !== undefined) contactUpdates.phone = data.phone;
    if (data.website !== undefined) contactUpdates.website = data.website;
    if ((data as any).social !== undefined) contactUpdates.social = (data as any).social;
    
    // Only update contact if there are changes
    if (Object.keys(contactUpdates).length > 0) {
      updateData.contact = contactUpdates;
    }

    // Handle coordinates
    if ((data as any).location !== undefined && (data as any).location !== null) {
      const location = (data as any).location;
      updateData.coords = {
        lat: location.lat || 0,
        lng: location.lng || 0,
      };
    }

    // Handle hours
    if ((data as any).openTime || (data as any).closeTime) {
      updateData.hours = {
        open: (data as any).openTime || '10:00',
        close: (data as any).closeTime || '22:00',
      };
    }

    console.log('🔄 Updating mall with data:', updateData);
    await updateDoc(mallRef, updateData);
    console.log('✅ Mall updated successfully');
    
  } catch (error) {
    console.error('❌ Error updating mall:', error);
    throw error;
  }
}

/**
 * ลบห้าง
 */
export async function deleteMall(_mallId: string): Promise<void> {
  const batch = writeBatch(db);
  
  // ลบ stores ทั้งหมดในห้าง
  const storesSnapshot = await getDocs(collection(db, 'malls', _mallId, 'stores'));
  storesSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  // ลบ floors ทั้งหมด
  const floorsSnapshot = await getDocs(collection(db, 'malls', _mallId, 'floors'));
  floorsSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  // ลบห้าง
  batch.delete(doc(db, 'malls', _mallId));
  
  await batch.commit();
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
  
  // อัปเดต floorCount ในห้าง
  await updateMallFloorCount(_mallId, defaultFloors.length);
}

/**
 * สร้าง floor ใหม่
 */
export async function createFloor(_mallId: string, data: { label: string; order: number }): Promise<string> {
  const now = serverTimestamp();
  
  const floorData = {
    label: data.label,
    order: data.order,
    createdAt: now,
    updatedAt: now
  };

  const docRef = await addDoc(collection(db, 'malls', _mallId, 'floors'), floorData);
  
  // อัปเดต floorCount ในห้าง
  await updateMallFloorCount(_mallId);
  
  return docRef.id;
}

/**
 * อัปเดต floorCount ในห้าง
 */
async function updateMallFloorCount(_mallId: string, count?: number): Promise<void> {
  const mallRef = doc(db, 'malls', _mallId);
  
  if (count !== undefined) {
    // ใช้จำนวนที่ส่งมา
    await updateDoc(mallRef, { 
      floorCount: count,
      updatedAt: serverTimestamp()
    });
  } else {
    // นับจำนวน floors จริง
    const floors = await listFloors(_mallId);
    await updateDoc(mallRef, { 
      floorCount: floors.length,
      updatedAt: serverTimestamp()
    });
  }
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
 * ลบ floor
 */
export async function deleteFloor(_mallId: string, floorId: string): Promise<void> {
  await deleteDoc(doc(db, 'malls', _mallId, 'floors', floorId));
  
  // อัปเดต floorCount ในห้าง
  await updateMallFloorCount(_mallId);
}

/**
 * อัปเดต order ของ floor
 */
export async function updateFloorOrder(_mallId: string, floorId: string, newOrder: number): Promise<void> {
  await updateDoc(doc(db, 'malls', _mallId, 'floors', floorId), {
    order: newOrder,
    updatedAt: serverTimestamp()
  });
}

// ======================
// STORE OPERATIONS
// ======================

/**
 * สร้างร้านใหม่
 */
export async function createStore(_mallId: string, data: StoreFormData): Promise<string> {
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

  const docRef = await addDoc(collection(db, 'malls', _mallId, 'stores'), storeData);
  return docRef.id;
}

/**
 * ดึงรายการร้านของห้าง
 * @deprecated Use stores service instead
 */
export async function listStores(_mallId: string, filters?: {
  floorId?: string;
  category?: string;
  status?: string;
  query?: string;
}): Promise<Store[]> {
  // Import and use the new stores service
  const { listStores: newListStores } = await import('./stores');
  return newListStores(_mallId, filters);
}

/**
 * ดึงร้านทั้งหมดจากทุกห้าง (สำหรับ Admin Panel)
 * @deprecated Use stores service instead
 */
export async function listAllStores(): Promise<{ store: Store; _mallId: string }[]> {
  // Import and use the new stores service
  const { listAllStores: newListAllStores } = await import('./stores');
  return newListAllStores();
}

/**
 * ค้นหาร้านข้ามทุกห้าง
 * @deprecated Use stores service instead
 */
export async function searchStoresGlobally(query: string, limitCount = 50): Promise<{ store: Store; _mallId: string }[]> {
  // Import and use the new stores service
  const { searchStoresGlobally: newSearchStoresGlobally } = await import('./stores');
  return newSearchStoresGlobally(query, limitCount);
}

/**
 * ค้นหาร้านด้วย ID ข้ามทุกห้าง
 * @deprecated Use stores service instead
 */
export async function findStoreById(storeId: string): Promise<{ store: Store; _mallId: string } | null> {
  // Import and use the new stores service
  const { findStoreById: newFindStoreById } = await import('./stores');
  return newFindStoreById(storeId);
}

/**
 * อัปเดตข้อมูลร้าน
 * @deprecated Use stores service instead
 */
export async function updateStore(_mallId: string, storeId: string, data: Partial<Store>): Promise<void> {
  // Import and use the new stores service
  const { updateStore: newUpdateStore } = await import('./stores');
  return newUpdateStore(_mallId, storeId, data);
}

/**
 * ดึงข้อมูลร้านตาม ID
 * @deprecated Use stores service instead
 */
export async function getStore(_mallId: string, storeId: string): Promise<Store | null> {
  // Import and use the new stores service
  const { getStore: newGetStore } = await import('./stores');
  return newGetStore(_mallId, storeId);
}


/**
 * ลบร้าน
 * @deprecated Use stores service instead
 */
export async function deleteStore(_mallId: string, storeId: string): Promise<void> {
  // Import and use the new stores service
  const { deleteStore: newDeleteStore } = await import('./stores');
  return newDeleteStore(_mallId, storeId);
}

/**
 * ทำซ้ำร้าน (สำหรับ admin)
 * @deprecated Use stores service instead
 */
export async function duplicateStore(
  sourceMallId: string, 
  sourceStoreId: string, 
  targetMallId: string, 
  updates?: Partial<StoreFormData>
): Promise<string> {
  // Import and use the new stores service
  const { duplicateStore: newDuplicateStore } = await import('./stores');
  return newDuplicateStore(sourceMallId, sourceStoreId, targetMallId, updates);
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
