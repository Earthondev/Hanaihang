/**
 * คำนวณระยะทางระหว่างสองจุดด้วย Haversine formula
 * @param a ตำแหน่งแรก {lat, lng}
 * @param b ตำแหน่งที่สอง {lat, lng}
 * @returns ระยะทางเป็นกิโลเมตร
 */
export function distanceKm(a: {lat: number, lng: number}, b: {lat: number, lng: number}): number {
  const R = 6371; // รัศมีโลกเป็นกิโลเมตร
  const d2r = Math.PI / 180;
  
  const dLat = (b.lat - a.lat) * d2r;
  const dLng = (b.lng - a.lng) * d2r;
  
  const sLat = Math.sin(dLat / 2);
  const sLng = Math.sin(dLng / 2);
  
  const A = sLat * sLat + Math.cos(a.lat * d2r) * Math.cos(b.lat * d2r) * sLng * sLng;
  
  return R * 2 * Math.atan2(Math.sqrt(A), Math.sqrt(1 - A));
}

/**
 * ตรวจสอบว่าตำแหน่งอยู่ในรัศมีที่กำหนดหรือไม่
 * @param userLocation ตำแหน่งผู้ใช้
 * @param targetLocation ตำแหน่งเป้าหมาย
 * @param radiusKm รัศมีเป็นกิโลเมตร
 * @returns true ถ้าอยู่ในรัศมี
 */
export function isWithinRadius(
  userLocation: {lat: number, lng: number},
  targetLocation: {lat: number, lng: number},
  radiusKm: number
): boolean {
  return distanceKm(userLocation, targetLocation) <= radiusKm;
}

/**
 * คำนวณระยะทางและจัดเรียงตามระยะใกล้สุด
 * @param userLocation ตำแหน่งผู้ใช้
 * @param locations รายการตำแหน่งเป้าหมาย
 * @returns รายการที่จัดเรียงตามระยะใกล้สุด
 */
export function sortByDistance<T extends {lat: number, lng: number}>(
  userLocation: {lat: number, lng: number},
  locations: T[]
): (T & {distanceKm: number})[] {
  return locations
    .map(location => ({
      ...location,
      distanceKm: distanceKm(userLocation, location)
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}