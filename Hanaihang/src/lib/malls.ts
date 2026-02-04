import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";

import { Floor, Mall } from "../types/mall-system";

import { db } from "./firebase";

// Cache สำหรับ Mall
const mallCache = new Map<string, Mall | null>();
const mallCacheTimeout = 5 * 60 * 1000; // 5 นาที
const mallCacheTimestamps = new Map<string, number>();

// Cache สำหรับ Floors
const floorCache = new Map<string, Floor[]>();
const floorCacheTimeout = 5 * 60 * 1000; // 5 นาที
const floorCacheTimestamps = new Map<string, number>();

/**
 * ดึงข้อมูลห้างสรรพสินค้าจาก cache หรือ database
 * @param mallId ID ของห้าง
 * @returns ข้อมูลห้างหรือ null
 */
export async function getMall(mallId: string): Promise<Mall | null> {
  // ตรวจสอบ cache
  const cacheTime = mallCacheTimestamps.get(mallId);
  if (mallCache.has(mallId) && cacheTime && Date.now() - cacheTime < mallCacheTimeout) {
    return mallCache.get(mallId);
  }

  try {
    const snap = await getDoc(doc(db, "malls", mallId));
    const data = snap.exists()
      ? ({ id: snap.id, ...snap.data() } as Mall)
      : null;
    
    // เก็บใน cache
    mallCache.set(mallId, data);
    mallCacheTimestamps.set(mallId, Date.now());
    
    return data;
  } catch (error) {
    console.error('Error fetching mall:', error);
    return null;
  }
}

/**
 * ดึงรายการชั้นของห้างจาก cache หรือ database
 * @param mallId ID ของห้าง
 * @returns รายการชั้น
 */
export async function listFloors(mallId: string): Promise<Floor[]> {
  // ตรวจสอบ cache
  const cacheTime = floorCacheTimestamps.get(mallId);
  if (floorCache.has(mallId) && cacheTime && Date.now() - cacheTime < floorCacheTimeout) {
    return floorCache.get(mallId)!;
  }

  try {
    const col = collection(db, "malls", mallId, "floors");
    const q = query(col, orderBy("order"));
    const snaps = await getDocs(q);
    const rows: Floor[] = snaps.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<Floor, 'id'>),
    }));
    
    // เก็บใน cache
    floorCache.set(mallId, rows);
    floorCacheTimestamps.set(mallId, Date.now());
    
    return rows;
  } catch (error) {
    console.error('Error fetching floors:', error);
    return [];
  }
}

/**
 * ดึงข้อมูลชั้นเฉพาะจาก mallId และ floorId
 * @param mallId ID ของห้าง
 * @param floorId ID หรือ label ของชั้น
 * @returns ข้อมูลชั้นหรือ null
 */
export async function getFloorInfo(
  mallId: string,
  floorId: string
): Promise<Floor | null> {
  const floors = await listFloors(mallId);
  return floors.find(f => f.id === floorId || f.label === floorId) ?? null;
}

/**
 * ล้าง cache ทั้งหมด
 */
export function clearCache(): void {
  mallCache.clear();
  mallCacheTimestamps.clear();
  floorCache.clear();
  floorCacheTimestamps.clear();
}

/**
 * ล้าง cache ของห้างเฉพาะ
 * @param mallId ID ของห้าง
 */
export function clearMallCache(mallId: string): void {
  mallCache.delete(mallId);
  mallCacheTimestamps.delete(mallId);
  floorCache.delete(mallId);
  floorCacheTimestamps.delete(mallId);
}
