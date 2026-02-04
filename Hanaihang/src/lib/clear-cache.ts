/**
 * Utility functions to clear various caches
 */

import { clearSearchCache } from './optimized-search';

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  console.log('🧹 Clearing all caches...');
  
  // Clear search cache
  clearSearchCache();
  
  // Clear localStorage analytics
  try {
    localStorage.removeItem('search_analytics');
    console.log('✅ Cleared analytics cache');
  } catch (error) {
    console.warn('Failed to clear analytics cache:', error);
  }
  
  // Clear any other caches
  console.log('✅ All caches cleared');
}

/**
 * Clear cache for development/testing
 */
export function clearCacheForTesting(): void {
  console.log('🧪 Clearing cache for testing...');
  clearAllCaches();
  
  // Force reload if in browser
  if (typeof window !== 'undefined') {
    console.log('🔄 Reloading page...');
    window.location.reload();
  }
}

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as unknown).clearAllCaches = clearAllCaches;
  (window as unknown).clearCacheForTesting = clearCacheForTesting;
}
