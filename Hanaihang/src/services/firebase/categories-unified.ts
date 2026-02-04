import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    serverTimestamp, query, orderBy, where, limit, collectionGroup,
    Timestamp
} from 'firebase/firestore';

import { db } from './firebase';

export interface Category {
    id?: string;
    name: string; // The display name
    slug: string; // The value stored in store.category
    description?: string;
    count?: number; // Optional stats
    createdAt?: Timestamp | Date;
    updatedAt?: Timestamp | Date;
}

const categoriesCol = collection(db, 'categories');
const categoryDoc = (id: string) => doc(db, 'categories', id);

export async function createCategory(payload: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) {
    // Use slug as document ID to ensure uniqueness easily
    const ref = categoryDoc(payload.slug);

    // Check existence
    const snap = await getDoc(ref);
    if (snap.exists()) {
        throw new Error('Category slug already exists');
    }

    const data = {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    await setDoc(ref, data);
    return ref.id;
}

export async function getCategory(id: string): Promise<Category | null> {
    const snap = await getDoc(categoryDoc(id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Category) };
}

export async function updateCategory(id: string, patch: Partial<Category>) {
    const data = { ...patch, updatedAt: serverTimestamp() };
    await updateDoc(categoryDoc(id), data);
}

export async function deleteCategory(id: string) {
    await deleteDoc(categoryDoc(id));
}

export async function listAllCategories() {
    const q = query(categoriesCol, orderBy('name'));
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Category) }));
}

// Validation helper
export async function isCategoryUsed(slug: string): Promise<boolean> {
    // Check if any store uses this category
    // Using collectionGroup to check across all malls
    // Note: This requires index. If no index, might fail or require client filtering.
    // Simplified check:
    const storesGroup = query(collectionGroup(db, 'stores'), where('category', '==', slug), limit(1));
    const snap = await getDocs(storesGroup);
    return !snap.empty;
}
