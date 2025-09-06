// Simple in-memory cache for Firebase data
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SimpleCache {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clear cache for specific pattern
  clearPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const cache = new SimpleCache();

// Cache keys
export const CACHE_KEYS = {
  MALLS: 'malls:all',
  STORES: (mallId: string) => `stores:${mallId}`,
  STORES_ALL: 'stores:all',
  FLOORS: (mallId: string) => `floors:${mallId}`,
  MALL: (mallId: string) => `mall:${mallId}`,
  STORE: (mallId: string, storeId: string) => `store:${mallId}:${storeId}`
} as const;
