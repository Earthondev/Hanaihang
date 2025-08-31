import { v4 as uuidv4 } from 'uuid';
import { format, isWithinInterval, parseISO } from 'date-fns';

import { Store, StoreStatus } from '@/types';

// Device ID management
const DEVICE_ID_KEY = 'haanaihang_device_id';

export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId) {
    deviceId = `dev_${uuidv4().replace(/-/g, '').substring(0, 8)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  
  return deviceId;
}

// Time utilities for Bangkok timezone
const BANGKOK_TIMEZONE = 'Asia/Bangkok';

export function getCurrentBangkokTime(): Date {
  // Simple timezone conversion for Bangkok (UTC+7)
  const now = new Date();
  const bangkokOffset = 7 * 60; // Bangkok is UTC+7
  const localOffset = now.getTimezoneOffset();
  const bangkokTime = new Date(now.getTime() + (bangkokOffset + localOffset) * 60 * 1000);
  return bangkokTime;
}

export function parseTimeString(timeStr: string): Date {
  if (!timeStr) {
    throw new Error('Time string is empty or undefined');
  }
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = getCurrentBangkokTime();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
}

export function isStoreOpen(store: Store): StoreStatus {
  try {
    // Check if store has valid time data
    if (!store.open_time || !store.close_time) {
      return 'unknown';
    }

    const now = getCurrentBangkokTime();
    const openTime = parseTimeString(store.open_time);
    const closeTime = parseTimeString(store.close_time);
    
    // Handle stores that close after midnight
    if (closeTime < openTime) {
      closeTime.setDate(closeTime.getDate() + 1);
    }
    
    const isOpen = isWithinInterval(now, { start: openTime, end: closeTime });
    return isOpen ? 'open' : 'closed';
  } catch (error) {
    console.error('Error calculating store status:', error);
    return 'unknown';
  }
}

export function formatTime(timeStr: string): string {
  try {
    const time = parseTimeString(timeStr);
    return format(time, 'HH:mm');
  } catch {
    return timeStr;
  }
}

// Distance calculation (Haversine formula)
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Search utilities
export function searchStores(stores: Store[], query: string): Store[] {
  if (!query.trim()) return stores;
  
  const searchTerm = query.toLowerCase();
  return stores.filter(store => 
    store.name.toLowerCase().includes(searchTerm) ||
    store.category.toLowerCase().includes(searchTerm) ||
    store.tags.some(tag => tag.toLowerCase().includes(searchTerm))
  );
}

// Filter utilities
export function filterStores(
  stores: Store[], 
  filters: {
    categories?: string[];
    floor?: string;
    openNow?: boolean;
    search?: string;
  }
): Store[] {
  let filtered = stores;

  // Search filter
  if (filters.search) {
    filtered = searchStores(filtered, filters.search);
  }

  // Category filter
  if (filters.categories && filters.categories.length > 0) {
    filtered = filtered.filter(store => 
      filters.categories!.includes(store.category)
    );
  }

  // Floor filter
  if (filters.floor) {
    filtered = filtered.filter(store => store.floor === filters.floor);
  }

  // Open now filter
  if (filters.openNow) {
    filtered = filtered.filter(store => isStoreOpen(store) === 'open');
  }

  return filtered;
}

// Sort utilities
export function sortStores(stores: Store[], sortBy: string): Store[] {
  const sorted = [...stores];
  
  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'floor':
      return sorted.sort((a, b) => a.floor.localeCompare(b.floor));
    case 'category':
      return sorted.sort((a, b) => a.category.localeCompare(b.category));
    case 'order':
      return sorted.sort((a, b) => a.order - b.order);
    default:
      return sorted;
  }
}

// URL utilities
export function createStoreUrl(mallId: string, storeId: string): string {
  return `/${mallId}/stores/${storeId}`;
}

export function createFloorUrl(mallId: string, floorId: string): string {
  return `/${mallId}/floors/${floorId}`;
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone);
}

// Local storage utilities
export function saveToLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

export function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
