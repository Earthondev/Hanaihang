/**
 * Firebase Firestore Collection Paths
 * Centralized path management for consistent data access
 */

import { collection, collectionGroup } from 'firebase/firestore';
import { db } from './firebase';

// ======================
// MALL COLLECTIONS
// ======================

/**
 * Get malls collection reference
 */
export const mallsCol = () => collection(db, 'malls');

/**
 * Get specific mall document reference
 */
export const mallDoc = (mallId: string) => doc(db, 'malls', mallId);

// ======================
// STORE COLLECTIONS
// ======================

/**
 * Get stores subcollection for specific mall
 * Path: malls/{mallId}/stores
 */
export const mallStoresCol = (mallId: string) =>
  collection(db, 'malls', mallId, 'stores');

/**
 * Get specific store document reference
 * Path: malls/{mallId}/stores/{storeId}
 */
export const storeDoc = (mallId: string, storeId: string) =>
  doc(db, 'malls', mallId, 'stores', storeId);

/**
 * Get all stores across all malls (collection group)
 * Use this for global search across all stores
 */
export const allStoresGroup = () => collectionGroup(db, 'stores');

// ======================
// FLOOR COLLECTIONS
// ======================

/**
 * Get floors subcollection for specific mall
 * Path: malls/{mallId}/floors
 */
export const mallFloorsCol = (mallId: string) =>
  collection(db, 'malls', mallId, 'floors');

/**
 * Get specific floor document reference
 * Path: malls/{mallId}/floors/{floorId}
 */
export const floorDoc = (mallId: string, floorId: string) =>
  doc(db, 'malls', mallId, 'floors', floorId);

// ======================
// LEGACY SUPPORT (for migration)
// ======================

/**
 * Legacy top-level stores collection
 * Used only during migration from old structure
 */
export const legacyStoresCol = () => collection(db, 'stores');

// ======================
// HELPER FUNCTIONS
// ======================

/**
 * Extract mall ID from store document path
 * Useful for migration and data processing
 */
export function extractMallIdFromPath(path: string): string | null {
  const match = path.match(/malls\/([^\/]+)\/stores/);
  return match ? match[1] : null;
}

/**
 * Check if store path is in subcollection format
 */
export function isSubcollectionPath(path: string): boolean {
  return path.includes('/malls/') && path.includes('/stores/');
}

/**
 * Check if store path is in legacy top-level format
 */
export function isLegacyPath(path: string): boolean {
  return path.startsWith('stores/') && !path.includes('/malls/');
}
