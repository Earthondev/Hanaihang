import { getMall, getFloorInfo } from "./malls";
import { distanceKm } from "./geo";
import { Store, Mall, Floor } from "../types/mall-system";

export type ResolvedStore = {
  mallName: string;
  floorLabel: string;
  distanceKm: number | null;
  coordsUsed: { lat: number, lng: number } | null;
  mall?: Mall;
  floor?: Floor;
};

/**
 * แก้ไขข้อมูลร้านค้าให้ครบถ้วน (ชื่อห้าง, ชั้น, ระยะทาง)
 * @param store ข้อมูลร้านค้า
 * @param user ตำแหน่งผู้ใช้
 * @returns ข้อมูลร้านค้าที่แก้ไขแล้ว
 */
export async function resolveStoreComputed(
  store: Store,
  user?: { lat: number; lng: number }
): Promise<ResolvedStore> {
  const mallId = store.mallId || store._mallId;

  // 1) ดึงข้อมูลห้าง
  const mall = mallId ? await getMall(mallId) : null;

  // Resolve Mall Coords (priority: denormalized > v2 > legacy)
  let mallCoords = store.mallCoords ?? null;

  if (!mallCoords && mall) {
    if (mall.lat != null && mall.lng != null) {
      mallCoords = { lat: mall.lat, lng: mall.lng };
    } else if (mall.coords) {
      mallCoords = mall.coords;
    }
  }

  // 2) ดึงข้อมูลชั้น
  // พยายามดึงข้อมูลชั้นจริงก่อนเพื่อให้ได้ชื่อเต็ม (เช่น "Ground Floor")
  let floor = null;
  if (mallId && store.floorId) {
    floor = await getFloorInfo(mallId, store.floorId);
  }

  // fallback to denormalized label
  const floorLabel = floor?.name || floor?.label || store.floorLabel || store.floorId;

  // 3) คำนวณระยะทาง
  // 3) คำนวณระยะทาง
  let coordsForDistance: { lat: number, lng: number } | null = null;

  if (store.location?.lat != null && store.location?.lng != null) {
    coordsForDistance = { lat: store.location.lat, lng: store.location.lng };
  } else if (mallCoords) {
    coordsForDistance = mallCoords;
  }
  const distance = (user && coordsForDistance)
    ? distanceKm(user, coordsForDistance)
    : null;

  return {
    mallName: mall?.displayName ?? store.mallSlug ?? "",
    floorLabel: floorLabel,
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
  user?: { lat: number; lng: number }
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
  user?: { lat: number; lng: number }
): ResolvedStore {
  // ใช้ข้อมูล denormalized ที่มีอยู่
  const mallCoords = store.mallCoords ?? null;

  let coordsForDistance: { lat: number, lng: number } | null = null;
  if (store.location?.lat != null && store.location?.lng != null) {
    coordsForDistance = { lat: store.location.lat, lng: store.location.lng };
  } else if (mallCoords) {
    coordsForDistance = mallCoords;
  }
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
  user: { lat: number; lng: number },
  radiusKm: number
): Promise<boolean> {
  const resolved = await resolveStoreComputed(store, user);
  return resolved.distanceKm !== null && resolved.distanceKm <= radiusKm;
}
