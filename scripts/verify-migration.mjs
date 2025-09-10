import 'dotenv/config';
import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'))
  ),
  projectId: process.env.FIREBASE_PROJECT_ID,
});

const db = admin.firestore();

async function main() {
  console.log('🔍 Verifying migration...');
  
  const rootSnaps = await db.collection('stores').get();
  console.log(`📊 Root stores: ${rootSnaps.size}`);

  const cgSnaps = await db.collectionGroup('stores').get();
  console.log(`📊 Nested stores (collectionGroup): ${cgSnaps.size}`);

  // หาว่าตัวไหนยังไม่ย้าย
  const nestedIds = new Set(cgSnaps.docs.map(d => d.id));
  const notMigrated = rootSnaps.docs.filter(d => !nestedIds.has(d.id)).map(d => d.id);

  if (notMigrated.length) {
    console.log('⚠️ Not migrated IDs:', notMigrated.slice(0, 50), notMigrated.length > 50 ? `(+${notMigrated.length-50} more)` : '');
  } else {
    console.log('🎉 All root stores have nested copies.');
  }

  // ตรวจสอบ storeCount ของแต่ละห้าง
  console.log('\n🏢 Checking mall store counts...');
  const mallsSnap = await db.collection('malls').get();
  
  for (const mallDoc of mallsSnap.docs) {
    const mallId = mallDoc.id;
    const mallData = mallDoc.data();
    const reportedCount = mallData.storeCount || 0;
    
    const actualStoresSnap = await db.collection('malls').doc(mallId).collection('stores').get();
    const actualCount = actualStoresSnap.size;
    
    if (reportedCount !== actualCount) {
      console.log(`⚠️ Mall ${mallId} (${mallData.displayName}): reported=${reportedCount}, actual=${actualCount}`);
    } else {
      console.log(`✅ Mall ${mallId} (${mallData.displayName}): ${actualCount} stores`);
    }
  }
}

main().catch(e => {
  console.error('💥 Error:', e);
  process.exit(1);
});
