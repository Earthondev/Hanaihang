import 'dotenv/config';
import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';

const {
  GOOGLE_APPLICATION_CREDENTIALS,
  FIREBASE_PROJECT_ID,
} = process.env;

if (!GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('❌ Missing GOOGLE_APPLICATION_CREDENTIALS env.');
  process.exit(1);
}
if (!FIREBASE_PROJECT_ID) {
  console.error('❌ Missing FIREBASE_PROJECT_ID env.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(readFileSync(GOOGLE_APPLICATION_CREDENTIALS, 'utf8'))
  ),
  projectId: FIREBASE_PROJECT_ID,
});

const db = admin.firestore();

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const deleteRoot = args.includes('--delete-root');
const batchSizeArg = args.find(a => a.startsWith('--batch='));
const resumeArg = args.find(a => a.startsWith('--resume='));
const batchSize = batchSizeArg ? Number(batchSizeArg.split('=')[1]) : 100;
const resumeFrom = resumeArg ? resumeArg.split('=')[1] : null;

console.log('🟢 Starting migration:', { isDryRun, deleteRoot, batchSize, resumeFrom });

let migrated = 0, skipped = 0, failed = 0;

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function upsertMallStoreCount(mallId, delta) {
  const mallRef = db.collection('malls').doc(mallId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(mallRef);
    if (!snap.exists) throw new Error(`Mall not found: ${mallId}`);
    const data = snap.data() || {};
    const current = Number(data.storeCount || 0);
    tx.update(mallRef, { storeCount: current + delta, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  });
}

async function migrateOne(docSnap) {
  const storeId = docSnap.id;
  const store = docSnap.data() || {};

  const mallId = store.mallId;
  if (!mallId) {
    console.warn(`⚠️  Skip ${storeId}: no mallId field`);
    return { status: 'skip' };
  }

  // ปรับ schema เวลาให้ exclusive (ถ้ามี)
  const patch = { ...store };
  const hasEveryday = !!(patch.openTime && patch.closeTime);
  if (hasEveryday) {
    patch.hours = null;
  } else if (patch.hours) {
    patch.openTime = null;
    patch.closeTime = null;
  }

  // normalize nameLower
  if (patch.name && !patch.nameLower) {
    patch.nameLower = String(patch.name).toLowerCase();
  }

  const nestedRef = db.collection('malls').doc(mallId).collection('stores').doc(storeId);
  const nestedExists = (await nestedRef.get()).exists;

  if (nestedExists) {
    console.log(`↔️  Exists nested ${mallId}/stores/${storeId} → overwrite`);
  }

  if (isDryRun) {
    console.log(`🧪 [dry-run] set ${mallId}/stores/${storeId}`);
    return { status: 'dry' };
  }

  await nestedRef.set(
    {
      ...patch,
      mallId, // keep mallId for collectionGroup queries
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: patch.createdAt || admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  if (!nestedExists) {
    await upsertMallStoreCount(mallId, +1);
  }

  if (deleteRoot) {
    await docSnap.ref.delete();
  }

  return { status: 'ok' };
}

async function main() {
  const rootCol = db.collection('stores');
  let query = rootCol.orderBy(admin.firestore.FieldPath.documentId());
  if (resumeFrom) query = query.startAfter(resumeFrom);

  while (true) {
    const page = await query.limit(batchSize).get();
    if (page.empty) break;

    for (const docSnap of page.docs) {
      try {
        const res = await migrateOne(docSnap);
        if (res.status === 'ok') migrated++;
        else if (res.status === 'skip') skipped++;
      } catch (e) {
        failed++;
        console.error(`❌ Fail ${docSnap.id}:`, e.message);
        await sleep(200); // backoff
      }
    }

    const last = page.docs[page.docs.length - 1];
    query = rootCol.orderBy(admin.firestore.FieldPath.documentId()).startAfter(last.id);
    console.log(`📦 progress: migrated=${migrated} skipped=${skipped} failed=${failed} (resume=${last.id})`);
    await sleep(100);
  }

  console.log('✅ Done:', { migrated, skipped, failed, isDryRun, deleteRoot, batchSize });
}

main().catch(e => {
  console.error('💥 Fatal:', e);
  process.exit(1);
});
