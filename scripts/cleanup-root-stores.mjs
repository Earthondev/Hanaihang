#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

if (isDryRun) {
  console.log('🔍 DRY RUN MODE - No actual changes will be made\n');
}

// Load Firebase config
const serviceAccountPath = join(__dirname, '..', 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase
const app = initializeApp({
  projectId: serviceAccount.project_id,
});

const db = getFirestore(app);

async function cleanupRootStores() {
  console.log('🔄 Starting root stores cleanup...\n');
  
  try {
    // Get all stores from root collection
    const rootStoresRef = collection(db, 'stores');
    const rootStoresSnap = await getDocs(rootStoresRef);
    
    console.log(`📊 Found ${rootStoresSnap.docs.length} stores in root collection`);
    
    if (rootStoresSnap.docs.length === 0) {
      console.log('✅ No root stores found. Cleanup not needed.');
      return;
    }
    
    let deletedCount = 0;
    
    for (const storeDoc of rootStoresSnap.docs) {
      const storeData = storeDoc.data();
      const storeId = storeDoc.id;
      const storeName = storeData.name || 'Unknown';
      
      console.log(`📋 Processing root store: ${storeName} (${storeId})`);
      
      if (isDryRun) {
        console.log(`   🔍 DRY RUN: Would delete root store ${storeId}`);
        continue;
      }
      
      try {
        await deleteDoc(doc(db, 'stores', storeId));
        deletedCount++;
        console.log(`   ✅ Deleted root store: ${storeName}`);
      } catch (error) {
        console.error(`   ❌ Error deleting store ${storeId}:`, error.message);
      }
    }
    
    console.log('\n🎉 Root stores cleanup completed!');
    console.log(`📊 Summary:`);
    console.log(`   🗑️  Deleted: ${deletedCount} root stores`);
    
  } catch (error) {
    console.error('❌ Fatal error during root stores cleanup:', error.message);
    process.exit(1);
  }
}

// Run the script
cleanupRootStores().catch(console.error);
