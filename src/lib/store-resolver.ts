import { getMall, getFloorInfo } from "./malls";
import { distanceKm } from "./geo";

export type Store = {
  id: string;
  name: string;
  mallId: string;
  mallSlug: string;
  floorId: string;
  unit?: string;
  location?: {lat: number, lng: number};   // optional
  mallCoords?: {lat: number, lng: number}; // denormalized cache
  floorLabel?: string;                     // denormalized cache
  category?: string;
  status?: string;
  phone?: string;
  hours?: string;
};

export type ResolvedStore = {
  mallName: string;
  floorLabel: string;
  distanceKm: number | null;
  coordsUsed: {lat: number, lng: number} | null;
  mall?: any;
  floor?: any;
};

/**
 * แก้ไขข้อมูลร้านค้าให้ครบถ้วน (ชื่อห้าง, ชั้น, ระยะทาง)
 * @param store ข้อมูลร้านค้า
 * @param user ตำแหน่งผู้ใช้
 * @returns ข้อมูลร้านค้าที่แก้ไขแล้ว
 */
export async function resolveStoreComputed(
  store: Store,
  user?: {lat: number; lng: number}
): Promise<ResolvedStore> {
  // 1) ดึงข้อมูลห้าง
  const mall = store.mallId ? await getMall(store.mallId) : null;
  const mallCoords = store.mallCoords ?? mall?.location ?? mall?.coords ?? null;

  // 2) ดึงข้อมูลชั้น
  const floor = store.floorLabel
    ? { label: store.floorLabel }
    : (store.mallId && store.floorId ? await getFloorInfo(store.mallId, store.floorId) : null);

  // 3) คำนวณระยะทาง
  const coordsForDistance = store.location ?? mallCoords ?? null;
  const distance = (user && coordsForDistance)
    ? distanceKm(user, coordsForDistance)
    : null;

  return {
    mallName: mall?.displayName ?? store.mallSlug ?? "",
    floorLabel: floor?.name || floor?.label || store.floorId,
    distanceKm: distance,
    coordsUsed: coordsForDistance,
    mall,
    floor
  };
}

/**
 * แก้ไขข้อมูลร้านค้าหลายตัวพร้อมกัน
 * @param stores รายการร้านค้า
 * @param user ตำแหน่งผู้ใช้
 * @returns รายการร้านค้าที่แก้ไขแล้ว
 */
export async function resolveStoresComputed(
  stores: Store[],
  user?: {lat: number; lng: number}
): Promise<(Store & ResolvedStore)[]> {
  const promises = stores.map(async (store) => {
    const resolved = await resolveStoreComputed(store, user);
    return { ...store, ...resolved };
  });

  return Promise.all(promises);
}

/**
 * แก้ไขข้อมูลร้านค้าแบบ lazy loading (ใช้ denormalized data ก่อน)
 * @param store ข้อมูลร้านค้า
 * @param user ตำแหน่งผู้ใช้
 * @returns ข้อมูลร้านค้าที่แก้ไขแล้ว
 */
export function resolveStoreLazy(
  store: Store,
  user?: {lat: number; lng: number}
): ResolvedStore {
  // ใช้ข้อมูล denormalized ที่มีอยู่
  const mallCoords = store.mallCoords ?? null;
  const coordsForDistance = store.location ?? mallCoords ?? null;
  const distance = (user && coordsForDistance)
    ? distanceKm(user, coordsForDistance)
    : null;

  return {
    mallName: store.mallSlug ?? "",
    floorLabel: store.floorLabel || store.floorId,
    distanceKm: distance,
    coordsUsed: coordsForDistance
  };
}

/**
 * ตรวจสอบว่าร้านค้าอยู่ในรัศมีที่กำหนดหรือไม่
 * @param store ข้อมูลร้านค้า
 * @param user ตำแหน่งผู้ใช้
 * @param radiusKm รัศมีเป็นกิโลเมตร
 * @returns true ถ้าอยู่ในรัศมี
 */
export async function isStoreWithinRadius(
  store: Store,
  user: {lat: number; lng: number},
  radiusKm: number
): Promise<boolean> {
  const resolved = await resolveStoreComputed(store, user);
  return resolved.distanceKm !== null && resolved.distanceKm <= radiusKm;
}
