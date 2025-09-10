import {
  collection, collectionGroup, doc, getDoc, getDocs, query, where,
  setDoc, updateDoc, deleteDoc, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { StoreCategory, StoreStatus } from '../../types/mall-system';

export type Store = {
  id?: string;
  name: string;
  nameLower?: string;
  brandSlug?: string;
  category: StoreCategory;
  floorId: string;
  unit?: string;
  phone?: string | null;
  hours?: string | null;
  status: StoreStatus;
  mallId?: string;
  mallSlug?: string;
  location?: {
    lat?: number;
    lng?: number;
    geohash?: string;
  };
  createdAt?: any;
  updatedAt?: any;
};

const storesCol = (mallId: string) => collection(db, 'malls', mallId, 'stores');
const storeDoc = (mallId: string, storeId: string) => doc(db, 'malls', mallId, 'stores', storeId);

export async function createStore(mallId: string, payload: Omit<Store, 'id'|'createdAt'|'updatedAt'>) {
  const ref = doc(storesCol(mallId)); // auto-id
  const data: Store = {
    ...payload,
    mallId,
    nameLower: payload.name.toLowerCase(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, data);
  return ref.id;
}

export async function getStore(mallId: string, storeId: string): Promise<Store | null> {
  const snap = await getDoc(storeDoc(mallId, storeId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Store) };
}

export async function updateStore(mallId: string, storeId: string, patch: Partial<Store>) {
  const norm: any = { ...patch, updatedAt: serverTimestamp() };
  if (norm.name && !norm.nameLower) norm.nameLower = norm.name.toLowerCase();
  await updateDoc(storeDoc(mallId, storeId), norm);
}

export async function deleteStore(mallId: string, storeId: string) {
  await deleteDoc(storeDoc(mallId, storeId));
}

export async function listStoresInMall(mallId: string, filters?: { category?: string; status?: Store['status']; q?: string; }) {
  let qRef: any = storesCol(mallId);
  const qs: any[] = [];
  if (filters?.category) qs.push(where('category', '==', filters.category));
  if (filters?.status) qs.push(where('status', '==', filters.status));
  // ไม่ filter by q ที่นี่ (ต้องใช้ nameLower startsWith → ทำ client-side หรือ add index)
  qRef = query(qRef, ...qs, orderBy('nameLower'), limit(500));
  const snaps = await getDocs(qRef);
  return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Store) }));
}

// Global search (ทุกห้าง): ใช้ collectionGroup
export async function searchStoresGlobal(term: string) {
  const lower = term.toLowerCase();
  // ถ้าต้องการ startsWith ให้ index prefix หรือใช้ client filter
  const cg = collectionGroup(db, 'stores');
  const snaps = await getDocs(query(cg, where('nameLower', '>=', lower), where('nameLower', '<=', lower + '\uf8ff'), limit(50)));
  return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Store) }));
}

// List all stores across all malls (for admin)
export async function listAllStores() {
  const cg = collectionGroup(db, 'stores');
  const snaps = await getDocs(query(cg, orderBy('nameLower'), limit(1000)));
  return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Store) }));
}
