import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    serverTimestamp, query, orderBy
} from 'firebase/firestore';

import { Mall } from '../../types/mall-system';

import { db } from './firebase';

import { isE2E } from '@/lib/e2e';
import { E2E_MALLS } from '@/lib/e2e-fixtures';

const mallsCol = collection(db, 'malls');
const mallDoc = (mallId: string) => doc(db, 'malls', mallId);

export async function createMall(payload: Omit<Mall, 'id' | 'createdAt' | 'updatedAt'>) {
    if (isE2E) {
        return payload.name || 'e2e-mall';
    }

    // Use a random ID or maybe name based ID if user prefers (random is safer for now)
    const ref = doc(mallsCol);
    const data = {
        ...payload,
        // Ensure numeric values
        lat: payload.lat ? Number(payload.lat) : undefined,
        lng: payload.lng ? Number(payload.lng) : undefined,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    await setDoc(ref, data);
    return ref.id;
}

export async function getMall(mallId: string): Promise<Mall | null> {
    const snap = await getDoc(mallDoc(mallId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Mall) };
}

export async function updateMall(mallId: string, patch: Partial<Mall>) {
    const data = { ...patch, updatedAt: serverTimestamp() };

    // Ensure numeric values if they are being updated
    if (data.lat !== undefined) data.lat = Number(data.lat);
    if (data.lng !== undefined) data.lng = Number(data.lng);

    await updateDoc(mallDoc(mallId), data);
}

export async function deleteMall(mallId: string) {
    await deleteDoc(mallDoc(mallId));
}

export async function listAllMalls() {
    if (isE2E) {
        return E2E_MALLS;
    }

    const q = query(mallsCol, orderBy('displayName'));
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ id: d.id, ...(d.data() as Mall) }));
}
