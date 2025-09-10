#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runScript(scriptName, description, failFast = true) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 ${description}`);
    console.log('=' .repeat(60));
    
    const scriptPath = join(__dirname, scriptName);
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${description} completed successfully!`);
        resolve();
      } else {
        console.log(`\n❌ ${description} failed with exit code ${code}`);
        if (failFast) {
          reject(new Error(`Script ${scriptName} failed with exit code ${code}`));
        } else {
          console.log(`⚠️  Continuing despite failure (fail-fast disabled)`);
          resolve();
        }
      }
    });
    
    child.on('error', (error) => {
      console.log(`\n❌ Error running ${scriptName}:`, error.message);
      if (failFast) {
        reject(error);
      } else {
        console.log(`⚠️  Continuing despite error (fail-fast disabled)`);
        resolve();
      }
    });
  });
}

async function runMallCleanup() {
  console.log('🎯 Starting Mall Data Cleanup Process');
  console.log('📋 This will run all cleanup scripts in sequence');
  console.log('⚠️  Make sure you have a backup before proceeding!');
  
  try {
    // Phase B: Data cleanup scripts
    await runScript('merge-duplicates.mjs', 'Phase B1: Merging duplicate malls');
    await runScript('convert-autoid-to-slug.mjs', 'Phase B2: Converting autoId to slug');
    await runScript('recalc-counts.mjs', 'Phase B3: Recalculating store and floor counts');
    await runScript('normalize-times-and-status.mjs', 'Phase B4: Normalizing times and status');
    await runScript('normalize-location-fields.mjs', 'Phase B5: Normalizing location fields');
    
    console.log('\n🎉 All mall cleanup scripts completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Review the results');
    console.log('   2. Test the application');
    console.log('   3. Deploy Firestore indexes if needed');
    console.log('   4. Update any hardcoded mall IDs in the codebase');
    
  } catch (error) {
    console.error('\n❌ Mall cleanup process failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check Firebase connection');
    console.log('   2. Verify service account permissions');
    console.log('   3. Review individual script logs');
    process.exit(1);
  }
}

// Run the cleanup process
runMallCleanup().catch(console.error);
