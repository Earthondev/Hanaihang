import { Timestamp } from 'firebase/firestore';

// Core Types for Mall System
export interface Mall {
  id?: string;
  name: string;          // slug เช่น "central-rama-3"
  displayName: string;   // ชื่อโชว์
  address?: string;
  contact?: {
    phone?: string;
    website?: string;
    social?: string;
  };
  coords?: {
    lat: number;
    lng: number;
  };
  hours?: {
    open: string;
    close: string;
  };
  district?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Floor {
  id?: string;
  label: string;         // "G", "1", "2", ...
  order: number;         // 0,1,2...
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Store {
  id?: string;
  name: string;
  category: StoreCategory;      // "Fashion" | "Food & Beverage" | ...
  floorId: string;       // อ้างอิง floors.{floorId}
  unit?: string;         // "2-22"
  phone?: string | null;
  hours?: string | null; // "10:00-22:00"
  status: StoreStatus;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Store Categories
export const STORE_CATEGORIES = [
  "Fashion",
  "Beauty",
  "Electronics",
  "Food & Beverage",
  "Sports",
  "Books",
  "Home & Garden",
  "Health & Pharmacy",
  "Entertainment",
  "Services"
] as const;

export type StoreCategory = typeof STORE_CATEGORIES[number];

// Floor Labels
export const FLOOR_LABELS = ["G", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
export type FloorLabel = typeof FLOOR_LABELS[number];

// Store Status
export const STORE_STATUS = ["Active", "Maintenance", "Closed"] as const;
export type StoreStatus = typeof STORE_STATUS[number];

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

// Form Types
export interface MallFormData {
  displayName: string;
  name?: string;
  address?: string;
  district?: string;
  phone?: string;
  website?: string;
  social?: string;
  lat?: number;
  lng?: number;
  openTime?: string;
  closeTime?: string;
}

export interface StoreFormData {
  name: string;
  category: StoreCategory;
  floorId: string;
  unit?: string;
  phone?: string;
  hours?: string;
  status: StoreStatus;
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
