/**
 * Store utility functions for consistent key generation and data handling
 */

export interface StoreRow {
  id: string;
  mallId: string;
  _path?: string;           // จะเติมให้เสมอในฟังก์ชัน ensure/dedupe
  [key: string]: unknown;
}

/** Format: malls/{mallId}/stores/{storeId} */
export const storePathKey = (mallId: string, storeId: string): string =>
  `malls/${mallId}/stores/${storeId}`;

/** React key = full path (unique ข้ามทุกห้าง) */
export const storeRowKey = (mallId: string, storeId: string): string =>
  storePathKey(mallId, storeId);

/** เติม _path ให้ทุกรายการ (ไม่แก้ของเดิม, คืนค่าใหม่) */
export function ensureStorePath<T extends { id: string; mallId: string; _path?: string }>(
  s: T
): T & { _path: string } {
  const _path = s._path ?? storePathKey(s.mallId, s.id);
  return (_path === s._path ? s : { ...s, _path }) as T & { _path: string };
}

/** แปลงทั้งลิสต์ให้มี _path */
export function withStorePaths<T extends { id: string; mallId: string; _path?: string }>(
  stores: ReadonlyArray<T>
): Array<T & { _path: string }> {
  return stores.map(ensureStorePath);
}

/** ลบรายการซ้ำ โดยยึด unique key = _path (หรือคำนวณจาก mallId+id) */
export function deduplicateStores<T extends { id: string; mallId: string; _path?: string }>(
  stores: ReadonlyArray<T>
): Array<T & { _path: string }> {
  const map = new Map<string, T & { _path: string }>();
  for (const raw of stores) {
    const s = ensureStorePath(raw);
    map.set(s._path, s); // รายการหลังสุดจะทับรายการก่อนหน้า
  }
  return Array.from(map.values());
}

/** รวมรายการแบบ "unique" สำหรับ pagination/infinite query */
export function mergeUniqueStores<
  T extends { id: string; mallId: string; _path?: string }
>(
  prev: ReadonlyArray<T>,
  incoming: ReadonlyArray<T>
): Array<T & { _path: string }> {
  const map = new Map<string, T & { _path: string }>();
  for (const raw of prev) {
    const s = ensureStorePath(raw);
    map.set(s._path, s);
  }
  for (const raw of incoming) {
    const s = ensureStorePath(raw);
    map.set(s._path, s); // ทับด้วยข้อมูลใหม่
  }
  return Array.from(map.values());
}

/** เปรียบเทียบว่าเป็นร้านเดียวกันหรือไม่ (ไม่สนข้อมูลอื่น) */
export function isSameStore(
  a: { id: string; mallId: string },
  b: { id: string; mallId: string }
): boolean {
  return a.id === b.id && a.mallId === b.mallId;
}

/** safe key extractor เผื่อมี _path ติดมาแล้ว */
export function getStoreReactKey(s: { id: string; mallId: string; _path?: string }): string {
  return s._path ?? storeRowKey(s.mallId, s.id);
}
