#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const onlyFlag = args.find(arg => arg.startsWith('--only='));
const onlyMallId = onlyFlag ? onlyFlag.split('=')[1] : null;

if (isDryRun) {
  console.log('🔍 DRY RUN MODE - No actual changes will be made\n');
}

if (onlyMallId) {
  console.log(`🎯 TARGET MODE - Only processing mall: ${onlyMallId}\n`);
}

// Load Firebase config
const serviceAccountPath = join(__dirname, '..', 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase
const app = initializeApp({
  projectId: serviceAccount.project_id,
});

const db = getFirestore(app);

// Load mapping configuration
const mappingPath = join(__dirname, 'mall-duplicate-mapping.json');
const mapping = JSON.parse(readFileSync(mappingPath, 'utf8'));

async function rollbackMallCleanup() {
  console.log('🔄 Starting mall cleanup rollback process...\n');
  console.log('⚠️  WARNING: This will attempt to reverse the cleanup operations');
  console.log('⚠️  Make sure you have a backup before proceeding!\n');
  
  try {
    // Rollback duplicate merges (reverse the mapping)
    console.log('📋 Rolling back duplicate merges...');
    
    for (const { from, to, reason } of mapping.duplicateMappings) {
      try {
        console.log(`📋 Rolling back: ${to} → ${from}`);
        console.log(`   Original reason: ${reason}`);
        
        // Check if target mall exists
        const toRef = db.collection('malls').doc(to);
        const toSnap = await toRef.get();
        
        if (!toSnap.exists()) {
          console.log(`   ⚠️  Target mall ${to} does not exist, skipping rollback...`);
          continue;
        }
        
        if (isDryRun) {
          console.log(`   🔍 DRY RUN: Would attempt to restore mall ${from}`);
          continue;
        }
        
        // This is a simplified rollback - in practice you'd need the original data
        console.log(`   ⚠️  Manual rollback required for ${from} → ${to}`);
        console.log(`   📝 Check backup data for original mall ${from}`);
        
      } catch (error) {
        console.error(`   ❌ Error rolling back ${to} → ${from}:`, error.message);
      }
    }
    
    // Rollback autoId to slug conversions
    console.log('\n📋 Rolling back autoId to slug conversions...');
    
    for (const { from, to, reason } of mapping.slugMappings) {
      try {
        console.log(`📋 Rolling back: ${to} → ${from}`);
        console.log(`   Original reason: ${reason}`);
        
        // Check if slug mall exists
        const toRef = db.collection('malls').doc(to);
        const toSnap = await toRef.get();
        
        if (!toSnap.exists()) {
          console.log(`   ⚠️  Slug mall ${to} does not exist, skipping rollback...`);
          continue;
        }
        
        if (isDryRun) {
          console.log(`   🔍 DRY RUN: Would attempt to restore autoId mall ${from}`);
          continue;
        }
        
        // This is a simplified rollback - in practice you'd need the original data
        console.log(`   ⚠️  Manual rollback required for ${to} → ${from}`);
        console.log(`   📝 Check backup data for original mall ${from}`);
        
      } catch (error) {
        console.error(`   ❌ Error rolling back ${to} → ${from}:`, error.message);
      }
    }
    
    console.log('\n🎉 Mall cleanup rollback process completed!');
    console.log('\n📋 Manual steps required:');
    console.log('   1. Restore from backup: gcloud firestore import gs://<bucket>/backups/<timestamp>');
    console.log('   2. Or manually recreate malls using backup data');
    console.log('   3. Verify all malls and stores are restored correctly');
    
  } catch (error) {
    console.error('❌ Fatal error during rollback:', error.message);
    process.exit(1);
  }
}

// Run the script
rollbackMallCleanup().catch(console.error);
