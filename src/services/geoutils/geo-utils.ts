import { UserLocation } from '@/types/mall-system';

/**
 * คำนวณระยะทางระหว่างสองจุดด้วย Haversine formula
 * @param a ตำแหน่งแรก {lat, lng}
 * @param b ตำแหน่งที่สอง {lat, lng}
 * @returns ระยะทางเป็นกิโลเมตร
 */
export function distanceKm(
  a: { lat: number; lng: number }, 
  b: { lat: number; lng: number }
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371; // รัศมีโลกเป็นกิโลเมตร
  
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  
  const s = 
    Math.sin(dLat / 2) ** 2 + 
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  
  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * ขอตำแหน่งปัจจุบันจากผู้ใช้
 * @returns Promise<UserLocation>
 */
export function getCurrentLocation(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now()
        });
      },
      (error) => {
        let message = 'Unable to retrieve location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}

/**
 * จัดเรียงรายการตามระยะทางจากตำแหน่งผู้ใช้
 * @param items รายการที่มี coords
 * @param userLocation ตำแหน่งผู้ใช้
 * @returns รายการที่เรียงตามระยะทาง พร้อมข้อมูลระยะทาง
 */
export function sortByDistance<T extends { coords?: { lat: number; lng: number } }>(
  items: T[],
  userLocation: UserLocation
): (T & { distance?: number })[] {
  return items
    .map(item => ({
      ...item,
      distance: item.coords ? distanceKm(userLocation, item.coords) : undefined
    }))
    .sort((a, b) => {
      if (a.distance === undefined && b.distance === undefined) return 0;
      if (a.distance === undefined) return 1;
      if (b.distance === undefined) return -1;
      return a.distance - b.distance;
    });
}

/**
 * แปลงระยะทางเป็นข้อความที่อ่านง่าย
 * @param distance ระยะทางเป็นกิโลเมตร
 * @returns ข้อความระยะทาง
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} ม.`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)} กม.`;
  } else {
    return `${Math.round(distance)} กม.`;
  }
}

/**
 * ตรวจสอบว่าตำแหน่งอยู่ในรัศมีที่กำหนด
 * @param center จุดศูนย์กลาง
 * @param point จุดที่ต้องการตรวจสอบ
 * @param radiusKm รัศมีเป็นกิโลเมตร
 * @returns true ถ้าอยู่ในรัศมี
 */
export function isWithinRadius(
  center: { lat: number; lng: number },
  point: { lat: number; lng: number },
  radiusKm: number
): boolean {
  return distanceKm(center, point) <= radiusKm;
}

/**
 * หาจุดกึ่งกลางของรายการตำแหน่ง
 * @param locations รายการตำแหน่ง
 * @returns จุดกึ่งกลาง
 */
export function getCenterPoint(locations: { lat: number; lng: number }[]): { lat: number; lng: number } {
  if (locations.length === 0) {
    throw new Error('Cannot calculate center of empty locations array');
  }

  const sum = locations.reduce(
    (acc, loc) => ({
      lat: acc.lat + loc.lat,
      lng: acc.lng + loc.lng
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / locations.length,
    lng: sum.lng / locations.length
  };
}

/**
 * Bangkok center coordinates (for default map center)
 */
export const BANGKOK_CENTER = {
  lat: 13.7563,
  lng: 100.5018
};

/**
 * Thailand bounds (for map restrictions)
 */
export const THAILAND_BOUNDS = {
  north: 20.4649,
  south: 5.6333,
  east: 105.6372,
  west: 97.3436
};
