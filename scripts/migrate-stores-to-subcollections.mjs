#!/usr/bin/env node

/**
 * Migration Script: Move stores from top-level collection to subcollections
 * 
 * This script migrates stores from /stores to /malls/{mallId}/stores
 * 
 * Usage:
 *   node scripts/migrate-stores-to-subcollections.mjs
 * 
 * Environment Variables Required:
 *   - FB_API_KEY
 *   - FB_AUTH_DOMAIN  
 *   - FB_PROJECT_ID
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  writeBatch, 
  doc,
  query,
  where,
  limit
} from 'firebase/firestore';
import { normalizeThai } from '../src/lib/thai-normalize.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FB_API_KEY,
  authDomain: process.env.FB_AUTH_DOMAIN,
  projectId: process.env.FB_PROJECT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Migration configuration
const BATCH_SIZE = 100; // Firestore batch limit
const DRY_RUN = process.argv.includes('--dry-run');

console.log('🚀 Starting Store Migration to Subcollections');
console.log(`📊 Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE MIGRATION'}`);
console.log('');

// Helper function to extract mall ID from store document ID
function extractMallIdFromStoreId(storeId) {
  // Pattern: central-festival-eastville_chabuton-ramen_...
  // Extract mall slug before first underscore
  const parts = storeId.split('_');
  if (parts.length >= 2) {
    return parts[0]; // Return mall slug
  }
  return null;
}

// Helper function to get mall ID from store data
function getMallIdFromStoreData(storeData, storeId) {
  // Try different possible fields
  if (storeData.mallId) return storeData.mallId;
  if (storeData.mallSlug) return storeData.mallSlug;
  if (storeData.mall) return storeData.mall;
  
  // Try to extract from document ID
  const extractedId = extractMallIdFromStoreId(storeId);
  if (extractedId) return extractedId;
  
  return null;
}

// Helper function to enhance store data with denormalized fields
function enhanceStoreData(storeData, mallId) {
  return {
    ...storeData,
    // Ensure required denormalized fields
    mallId: mallId,
    mallName: storeData.mallName || '',
    mallCoords: storeData.mallCoords || null,
    // Add normalized search fields
    name_normalized: storeData.name ? normalizeThai(storeData.name) : '',
    // Preserve original timestamps
    createdAt: storeData.createdAt,
    updatedAt: storeData.updatedAt
  };
}

async function migrateStores() {
  try {
    console.log('📋 Step 1: Analyzing existing stores...');
    
    // Get all stores from top-level collection
    const topLevelStores = collection(db, 'stores');
    const snapshot = await getDocs(topLevelStores);
    
    console.log(`📊 Found ${snapshot.size} stores in top-level collection`);
    
    if (snapshot.size === 0) {
      console.log('✅ No stores to migrate. Migration complete!');
      return;
    }
    
    // Analyze stores and group by mall
    const storesByMall = new Map();
    const unmappedStores = [];
    
    for (const doc of snapshot.docs) {
      const storeData = doc.data();
      const mallId = getMallIdFromStoreData(storeData, doc.id);
      
      if (mallId) {
        if (!storesByMall.has(mallId)) {
          storesByMall.set(mallId, []);
        }
        storesByMall.get(mallId).push({
          id: doc.id,
          data: storeData
        });
      } else {
        unmappedStores.push({
          id: doc.id,
          data: storeData
        });
      }
    }
    
    console.log(`📊 Stores grouped by mall:`);
    for (const [mallId, stores] of storesByMall) {
      console.log(`   ${mallId}: ${stores.length} stores`);
    }
    
    if (unmappedStores.length > 0) {
      console.log(`⚠️  ${unmappedStores.length} stores could not be mapped to a mall:`);
      unmappedStores.forEach(store => {
        console.log(`   - ${store.id}`);
      });
    }
    
    console.log('');
    console.log('📋 Step 2: Verifying mall existence...');
    
    // Verify that all malls exist
    const mallsCol = collection(db, 'malls');
    const mallsSnapshot = await getDocs(mallsCol);
    const existingMalls = new Set();
    
    mallsSnapshot.docs.forEach(doc => {
      existingMalls.add(doc.id);
    });
    
    const missingMalls = [];
    for (const mallId of storesByMall.keys()) {
      if (!existingMalls.has(mallId)) {
        missingMalls.push(mallId);
      }
    }
    
    if (missingMalls.length > 0) {
      console.log(`❌ Missing malls: ${missingMalls.join(', ')}`);
      console.log('   Please create these malls first before running migration.');
      return;
    }
    
    console.log('✅ All malls exist');
    console.log('');
    
    if (DRY_RUN) {
      console.log('🔍 DRY RUN - No changes will be made');
      console.log('   To perform actual migration, run without --dry-run flag');
      return;
    }
    
    console.log('📋 Step 3: Migrating stores to subcollections...');
    
    let totalMigrated = 0;
    let totalBatches = 0;
    
    // Process each mall
    for (const [mallId, stores] of storesByMall) {
      console.log(`🔄 Migrating ${stores.length} stores for mall: ${mallId}`);
      
      // Process in batches
      for (let i = 0; i < stores.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const batchStores = stores.slice(i, i + BATCH_SIZE);
        
        for (const store of batchStores) {
          const enhancedData = enhanceStoreData(store.data, mallId);
          const newStoreRef = doc(db, 'malls', mallId, 'stores', store.id);
          
          // Set store in new location
          batch.set(newStoreRef, enhancedData, { merge: true });
          
          // Optionally delete from old location (uncomment if desired)
          // const oldStoreRef = doc(db, 'stores', store.id);
          // batch.delete(oldStoreRef);
        }
        
        await batch.commit();
        totalMigrated += batchStores.length;
        totalBatches++;
        
        console.log(`   ✅ Migrated batch ${totalBatches}: ${batchStores.length} stores`);
      }
    }
    
    console.log('');
    console.log('📋 Step 4: Updating mall store counts...');
    
    // Update store counts for each mall
    for (const [mallId, stores] of storesByMall) {
      const mallRef = doc(db, 'malls', mallId);
      await writeBatch(db).update(mallRef, {
        storeCount: stores.length,
        updatedAt: new Date()
      }).commit();
      
      console.log(`   ✅ Updated store count for ${mallId}: ${stores.length} stores`);
    }
    
    console.log('');
    console.log('🎉 Migration Complete!');
    console.log(`📊 Summary:`);
    console.log(`   - Total stores migrated: ${totalMigrated}`);
    console.log(`   - Total batches processed: ${totalBatches}`);
    console.log(`   - Malls affected: ${storesByMall.size}`);
    
    if (unmappedStores.length > 0) {
      console.log(`   - Unmapped stores: ${unmappedStores.length} (manual review needed)`);
    }
    
    console.log('');
    console.log('🔍 Next steps:');
    console.log('   1. Test the application to ensure stores are visible');
    console.log('   2. Run search tests to verify cross-mall search works');
    console.log('   3. Consider removing old /stores collection after verification');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Helper function to verify migration
async function verifyMigration() {
  console.log('🔍 Verifying migration...');
  
  try {
    // Check subcollections
    const mallsCol = collection(db, 'malls');
    const mallsSnapshot = await getDocs(mallsCol);
    
    let totalStoresInSubcollections = 0;
    
    for (const mallDoc of mallsSnapshot.docs) {
      const storesCol = collection(db, 'malls', mallDoc.id, 'stores');
      const storesSnapshot = await getDocs(storesCol);
      totalStoresInSubcollections += storesSnapshot.size;
      
      console.log(`   ${mallDoc.id}: ${storesSnapshot.size} stores`);
    }
    
    // Check top-level collection
    const topLevelStores = collection(db, 'stores');
    const topLevelSnapshot = await getDocs(topLevelStores);
    
    console.log('');
    console.log(`📊 Verification Results:`);
    console.log(`   - Stores in subcollections: ${totalStoresInSubcollections}`);
    console.log(`   - Stores in top-level: ${topLevelSnapshot.size}`);
    
    if (topLevelSnapshot.size === 0) {
      console.log('✅ All stores successfully migrated!');
    } else {
      console.log('⚠️  Some stores remain in top-level collection');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Main execution
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'verify':
      await verifyMigration();
      break;
    case 'migrate':
    default:
      await migrateStores();
      break;
  }
}

// Run migration
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
