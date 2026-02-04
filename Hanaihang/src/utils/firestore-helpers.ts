/**
 * Utility functions for Firestore operations
 * ป้องกัน undefined และ NaN ใน payload
 */

/**
 * ตรวจสอบว่าเป็น finite number หรือไม่
 */
export const isFiniteNumber = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

/**
 * ตัดฟิลด์ที่ undefined ออกให้หมด
 */
export const pruneUndefined = <T extends Record<string, unknown>>(obj: T): T =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;

/**
 * แปลง lat/lng ให้ปลอดภัยจาก NaN
 */
export const safeParseLatLng = (lat: unknown, lng: unknown): { lat: number | null; lng: number | null } => {
  const latNum = typeof lat === 'string'
    ? (lat.trim() === '' ? null : parseFloat(lat))
    : (isFiniteNumber(lat) ? lat : null);

  const lngNum = typeof lng === 'string'
    ? (lng.trim() === '' ? null : parseFloat(lng))
    : (isFiniteNumber(lng) ? lng : null);

  return { lat: latNum, lng: lngNum };
};

/**
 * สร้าง coords object ถ้ามี lat/lng ที่ถูกต้อง
 */
export const createCoords = (lat: number | null, lng: number | null) => {
  if (isFiniteNumber(lat) && isFiniteNumber(lng)) {
    return { lat, lng };
  }
  return null;
};

/**
 * Sanitize object สำหรับ Firestore - ลบ undefined/NaN/Infinity
 */
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj
      .map(sanitizeForFirestore)
      .filter((v) => v !== undefined) as unknown as T;
  }

  const out: unknown = {};
  for (const [k, v] of Object.entries(obj as unknown)) {
    if (v === undefined) continue;
    if (typeof v === 'number' && !Number.isFinite(v)) continue; // ตัด NaN/Infinity
    if (typeof v === 'object' && v !== null) {
      const nested = sanitizeForFirestore(v);
      if (nested !== undefined && (typeof nested !== 'object' || Object.keys(nested).length > 0)) {
        out[k] = nested;
      }
    } else {
      out[k] = v;
    }
  }
  return out;
}
