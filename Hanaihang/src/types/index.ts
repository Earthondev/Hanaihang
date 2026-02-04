// Core types for HaaNaiHang system

export interface Mall {
  id: string;
  code: string;
  name: string;
  address: string;
  district: string;
  province: string;
  postcode: string;
  lat: number;
  lng: number;
  open_time: string;
  close_time: string;
  phone: string;
  website: string;
  weight: number;
  published: boolean;
  order: number;
}

export interface Floor {
  id: string;
  mall_id: string;
  floor_code: string;
  name: string;
  level_index: number;
  map_image_url: string;
  map_type: 'svg' | 'png';
  published: boolean;
}

export interface Store {
  id: string;
  mall_id: string;
  name: string;
  category: string;
  floor: string;
  unit: string;
  zone: string;
  tags: string[];
  open_time: string;
  close_time: string;
  phone: string;
  website: string;
  x: number;
  y: number;
  images: string[];
  features: string[];
  published: boolean;
  order: number;
}

export interface FloorStore {
  id: string;
  store_id: string;
  mall_id: string;
  floor_code: string;
  unit: string;
  zone: string;
  x: number;
  y: number;
  note: string;
}

export interface Promotion {
  id: string;
  mall_id: string;
  store_id?: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  tags: string[];
  cta_label: string;
  cta_url: string;
  image_url: string;
  published: boolean;
  order: number;
}

export interface Favorite {
  id: string;
  device: string;
  store_id: string;
  created_at: string;
}

export interface Event {
  timestamp: string;
  device: string;
  event: string;
  store_id?: string;
  mall_id?: string;
  meta: Record<string, unknown>;
  user_email?: string;
}

export interface Config {
  key: string;
  value: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// API Request types
export interface GetStoresParams {
  mall_id?: string;
  floor?: string;
  category?: string;
  search?: string;
  openNow?: boolean;
}

export interface GetPromotionsParams {
  mall_id?: string;
  store_id?: string;
  status?: 'active' | 'future' | 'expired';
}

export interface AddFavoriteParams {
  device: string;
  store_id: string;
}

export interface LogEventParams {
  device: string;
  event: string;
  store_id?: string;
  mall_id?: string;
  meta?: Record<string, unknown>;
}

// UI State types
export interface FilterState {
  categories: string[];
  floor: string;
  openNow: boolean;
  search: string;
}

export interface SortOption {
  value: string;
  label: string;
}

// Utility types
export type StoreStatus = 'open' | 'closed' | 'unknown';

export interface StoreWithStatus extends Store {
  status: StoreStatus;
  distance?: number;
}

export interface MallWithStats extends Mall {
  floorCount: number;
  storeCount: number;
  distance?: number;
}

// Admin types
export interface AdminUser {
  email: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
}

export interface BulkImportData {
  sheetName: string;
  rows: Record<string, unknown>[];
}
