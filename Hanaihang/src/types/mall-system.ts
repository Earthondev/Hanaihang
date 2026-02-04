import { Timestamp } from 'firebase/firestore';

// Core Types for Mall System
export interface SourceAttribution {
  name: string;
  url?: string;
  retrievedAt?: string;
  license?: string;
  note?: string;
}

export interface Mall {
  id?: string;
  name: string; // slug เช่น "central-rama-3"
  displayName: string; // ชื่อโชว์
  nameLower?: string; // ชื่อพิมพ์เล็กสำหรับค้นหา
  searchKeywords?: string[]; // คีย์เวิร์ดสำหรับค้นหา
  address?: string;
  contact?: {
    phone?: string;
    website?: string;
    social?: string;
  };
  // Schema v2: top-level lat/lng
  lat?: number;
  lng?: number;
  // Legacy coords for compatibility
  coords?: {
    lat: number;
    lng: number;
  };
  geohash?: string; // สำหรับ geosearch
  // Schema v2: เวลาเปิด-ปิด
  openTime?: string;
  closeTime?: string;
  // Legacy hours for compatibility
  hours?: {
    open: string;
    close: string;
  };
  district?: string;
  province?: string;
  brandGroup?: string;
  sources?: SourceAttribution[];
  osm?: {
    id: number;
    type: string;
  };
  // หมวดหมู่ห้างสรรพสินค้า
  category?:
  | 'shopping-center'
  | 'community-mall'
  | 'high-end'
  | 'outlet'
  | 'department-store';
  categoryLabel?: string; // "ศูนย์การค้า", "คอมมูนิตี้มอลล์", "ไฮเอนด์"
  // สถานะห้าง
  status?: 'Active' | 'Closed' | 'Maintenance';
  storeCount?: number; // จำนวนร้านในห้าง (denormalized)
  floorCount?: number; // จำนวนชั้นในห้าง (denormalized)
  logoUrl?: string; // URL ของโลโก้ห้างจาก Firebase Storage
  images?: string[]; // รูปภาพห้าง
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Floor {
  id?: string;
  label: string; // "G", "1", "2", ...
  name?: string; // "Ground Floor", "First Floor"
  order: number; // 0,1,2...
  mallId?: string; // FK to malls.id (legacy compatibility)
  _mallId?: string; // FK to malls.id (new format)
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Store {
  id?: string;
  name: string;
  nameLower?: string; // ชื่อพิมพ์เล็กสำหรับค้นหา
  brandSlug?: string; // slug ของแบรนด์ เช่น "uniqlo", "zara"
  category: StoreCategory; // "Fashion" | "Food & Beverage" | ...
  floorId: string; // อ้างอิง floors.{floorId}
  floorLabel?: string; // "G", "1", "2" - denormalized
  unit?: string; // "2-22"
  phone?: string | null;
  hours?: string | null; // "10:00-22:00"
  status: StoreStatus;
  // Location info
  mallId?: string; // FK to malls.id (legacy compatibility)
  _mallId?: string; // FK to malls.id (new format)
  mallSlug?: string; // denormalized mall slug
  mallName?: string; // denormalized mall name
  mallCoords?: { lat: number; lng: number }; // denormalized mall coords cache
  location?: {
    lat?: number;
    lng?: number;
    geohash?: string;
  };
  // Enhanced location info
  landmarks?: string[]; // ["ใกล้ลิฟต์", "ใกล้บันไดเลื่อน", "ใกล้ทางออก"]
  directions?: string; // "จากทางเข้าหลัก เดินตรงไป 50 เมตร"
  nearbyStores?: string[]; // ร้านค้าใกล้เคียง
  // Search optimization
  searchKeywords?: string[]; // คีย์เวิร์ดสำหรับค้นหา
  tags?: string[]; // แท็กเพิ่มเติม
  sources?: SourceAttribution[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Store Categories
export const STORE_CATEGORIES = [
  'Fashion',
  'Beauty',
  'Electronics',
  'Food & Beverage',
  'Sports',
  'Books',
  'Home & Garden',
  'Health & Pharmacy',
  'Entertainment',
  'Services',
  'Jewelry',
  'Watches',
  'Bags & Accessories',
  'Shoes',
  'Kids & Baby',
  'Automotive',
  'Banking',
  'Travel',
  'Education',
  'Fitness',
] as const;

export type StoreCategory = (typeof STORE_CATEGORIES)[number];

// Floor Labels
export const FLOOR_LABELS = [
  'G',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
] as const;
export type FloorLabel = (typeof FLOOR_LABELS)[number];

// Store Status
export const STORE_STATUS = ['Active', 'Maintenance', 'Closed'] as const;
export type StoreStatus = (typeof STORE_STATUS)[number];

// Store Landmarks
export const STORE_LANDMARKS = [
  'ใกล้ลิฟต์',
  'ใกล้บันไดเลื่อน',
  'ใกล้ทางออก',
  'ใกล้ทางเข้าหลัก',
  'ใกล้ศูนย์อาหาร',
  'ใกล้โรงภาพยนตร์',
  'ใกล้ร้านค้าใหญ่',
  'ใกล้ทางเดินหลัก',
  'ใกล้ทางจอดรถ',
  'ใกล้ห้องน้ำ',
  'ใกล้จุดบริการ',
  'ใกล้ทางออกฉุกเฉิน',
] as const;

export type StoreLandmark = (typeof STORE_LANDMARKS)[number];

// Store Tags
export const STORE_TAGS = [
  'ใหม่',
  'แนะนำ',
  'ลดราคา',
  'โปรโมชั่น',
  '24 ชั่วโมง',
  'บริการส่ง',
  'รับบัตรเครดิต',
  'มีที่จอดรถ',
  'เข้าถึงได้',
  'WiFi ฟรี',
  'มีห้องน้ำ',
  'มีที่พัก',
] as const;

export type StoreTag = (typeof STORE_TAGS)[number];

// Search & Filter Types
export interface StoreSearchResult {
  store: Store;
  mall: Mall;
  floor: Floor;
  distance?: number; // กิโลเมตร
}

export interface UserLocation {
  lat: number;
  lng: number;
  timestamp?: number;
}

export interface SearchFilters {
  mallId?: string;
  floorId?: string;
  category?: StoreCategory;
  status?: StoreStatus;
  query?: string;
}

// Enhanced Search Types
export interface SearchResult {
  malls: Mall[];
  stores: (Store & {
    mallName?: string;
    mallSlug?: string;
    distanceKm?: number;
  })[];
}

export interface SearchOptions {
  keyword: string;
  userLocation?: UserLocation;
  limit?: number;
  includeMalls?: boolean;
  includeStores?: boolean;
}

// Form Types
export interface MallFormData {
  displayName: string;
  name?: string;
  address?: string;
  district?: string;
  phone?: string;
  website?: string;
  social?: string;
  facebook?: string;
  line?: string;
  lat?: number;
  lng?: number;
  openTime?: string;
  closeTime?: string;
  hours?: string;
  logoUrl?: string;
}

export interface StoreFormData {
  name: string;
  category: StoreCategory;
  floorId: string;
  floorLabel?: string;
  unit?: string;
  phone?: string;
  hours?: string;
  status: StoreStatus;
  brandSlug?: string;
  landmarks?: string[];
  directions?: string;
  nearbyStores?: string[];
  searchKeywords?: string[];
  tags?: string[];
}

// Mall with Distance Type (for Home page)
export interface MallWithDistance extends Mall {
  distanceKm: number | null;
  hasActiveCampaign?: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Missing Types for Legacy Compatibility
export interface MallSearchResult {
  id: string;
  name: string;
  displayName: string;
  address?: string;
  district?: string;
  coords?: {
    lat: number;
    lng: number;
  };
  hours?: {
    open: string;
    close: string;
  };
  storeCount?: number;
}

export interface StoreCategoryStatus {
  category: StoreCategory;
  status: StoreStatus;
}

// Legacy Form Data Types
export interface MallFormDataFormData {
  displayName: string;
  name?: string;
  address?: string;
  district?: string;
  phone?: string;
  website?: string;
  social?: string;
  facebook?: string;
  line?: string;
  lat?: number;
  lng?: number;
  openTime?: string;
  closeTime?: string;
  hours?: string;
  logoUrl?: string;
}

// Store Input Type for Forms
export interface StoreInput {
  _mallId: string;
  name: string;
  category: StoreCategory;
  floorId: string;
  unit?: string;
  phone?: string;
  hours?: string;
  status: StoreStatus;
  brandSlug?: string;
  landmarks?: string[];
  directions?: string;
  nearbyStores?: string[];
  searchKeywords?: string[];
  tags?: string[];
}
