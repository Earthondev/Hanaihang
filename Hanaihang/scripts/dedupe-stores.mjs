import dotenv from 'dotenv';
import admin from 'firebase-admin';
import fs from 'node:fs/promises';

dotenv.config();

const argMap = new Map();
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i += 1) {
  const arg = argv[i];
  if (!arg.startsWith('--')) continue;
  const raw = arg.slice(2);
  const next = argv[i + 1];
  if (next && !next.startsWith('--')) {
    argMap.set(raw, next);
    i += 1;
  } else {
    argMap.set(raw, true);
  }
}

const mallId = argMap.get('mall');
const dryRun = Boolean(argMap.get('dry-run'));

if (!mallId) {
  console.error('Usage: node scripts/dedupe-stores.mjs --mall <mallId> [--dry-run]');
  process.exit(1);
}

const normalizeKey = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[\u200b\u200c\u200d]/g, '')
    .replace(/[^\p{L}\p{N}\s-]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');

const initFirebase = async () => {
  if (admin.apps.length) return admin.app();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!projectId) throw new Error('FIREBASE_PROJECT_ID is required in env');
  if (!credentialsPath) throw new Error('GOOGLE_APPLICATION_CREDENTIALS is required in env');

  const serviceAccount = JSON.parse(await fs.readFile(credentialsPath, 'utf8'));

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId,
  });
};

const main = async () => {
  await initFirebase();
  const db = admin.firestore();
  const storesSnap = await db.collection('malls').doc(mallId).collection('stores').get();

  const seen = new Map();
  const duplicates = [];

  for (const doc of storesSnap.docs) {
    const data = doc.data();
    const key = `${normalizeKey(data.nameLower || data.name)}|${data.floorId || ''}|${data.unit || ''}`;
    if (!key.trim()) continue;
    if (seen.has(key)) {
      duplicates.push({ key, id: doc.id, keepId: seen.get(key) });
    } else {
      seen.set(key, doc.id);
    }
  }

  if (dryRun) {
    console.log(`Found ${duplicates.length} duplicates for ${mallId}.`);
    console.log(duplicates.slice(0, 20));
    return;
  }

  let batch = db.batch();
  let batchCount = 0;
  let deleted = 0;

  const commitBatch = async () => {
    if (batchCount === 0) return;
    await batch.commit();
    batch = db.batch();
    batchCount = 0;
  };

  for (const dup of duplicates) {
    const ref = db.collection('malls').doc(mallId).collection('stores').doc(dup.id);
    batch.delete(ref);
    batchCount += 1;
    deleted += 1;
    if (batchCount >= 400) {
      await commitBatch();
    }
  }

  await commitBatch();
  console.log(`✅ Deleted ${deleted} duplicate stores for ${mallId}`);
};

main().catch((error) => {
  console.error('❌ Dedupe failed:', error);
  process.exit(1);
});
