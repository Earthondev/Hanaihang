import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import admin from 'firebase-admin';

const projectRoot = process.cwd();
const defaultKeyPath = path.join(projectRoot, 'service-account.json');
const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? path.resolve(projectRoot, process.env.GOOGLE_APPLICATION_CREDENTIALS)
  : defaultKeyPath;

if (!fs.existsSync(keyPath)) {
  console.error(`Service account not found at ${keyPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const BATCH_SIZE = Number(process.env.MIGRATION_BATCH_SIZE || 200);
const DELAY_MS = Number(process.env.MIGRATION_DELAY_MS || 100);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/#\s*\d+$/g, '')
    .replace(/\s+\d+$/g, '')
    .replace(/[\u200b\u200c\u200d]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim();
}

async function commitBatch(updates) {
  let batch = db.batch();
  let counter = 0;
  let total = 0;

  for (const { ref, data } of updates) {
    batch.update(ref, data);
    counter += 1;
    total += 1;

    if (counter >= BATCH_SIZE) {
      await batch.commit();
      counter = 0;
      batch = db.batch();
      await sleep(DELAY_MS);
    }
  }

  if (counter > 0) {
    await batch.commit();
  }

  return total;
}

async function main() {
  const inputPath = path.join(projectRoot, 'data', 'derived', 'siamparagon-directory.json');
  if (!fs.existsSync(inputPath)) {
    console.error('Directory data not found. Run: npm run scrape:siamparagon');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const storeList = data.stores || [];

  const mapping = new Map();
  for (const store of storeList) {
    const key = normalizeName(store.name);
    if (!key) continue;
    if (!mapping.has(key)) mapping.set(key, new Set());
    mapping.get(key).add(store.floor || '');
  }

  const storesSnap = await db.collection('malls').doc('siam-paragon').collection('stores').get();
  const updates = [];
  let matched = 0;
  let skipped = 0;
  let noMatch = 0;
  const unmatched = [];

  storesSnap.forEach((doc) => {
    const store = doc.data();
    const key = normalizeName(store.name);
    if (!mapping.has(key)) {
      noMatch += 1;
      unmatched.push({ id: doc.id, name: store.name || '', key });
      return;
    }

    const floors = Array.from(mapping.get(key));
    const floorLabel = floors.find((f) => f) || '';
    if (!floorLabel) {
      skipped += 1;
      return;
    }

    if (store.floorLabel && store.floorLabel === floorLabel) {
      skipped += 1;
      return;
    }

    updates.push({
      ref: doc.ref,
      data: {
        floorLabel,
      },
    });
    matched += 1;
  });

  const updated = await commitBatch(updates);

  const report = {
    totalStores: storesSnap.size,
    matched,
    updated,
    skipped,
    noMatch,
    unmatched,
  };

  const reportDir = path.join(projectRoot, 'data', 'derived');
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, 'siamparagon-floorlabel-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  const unmatchedPath = path.join(reportDir, 'siamparagon-floorlabel-unmatched.json');
  fs.writeFileSync(unmatchedPath, JSON.stringify(unmatched, null, 2));

  console.log('Siam Paragon floor label update complete');
  console.log(JSON.stringify(report, null, 2));
  console.log(`Report: ${reportPath}`);
  console.log(`Unmatched: ${unmatchedPath}`);
}

main().catch((error) => {
  console.error('Update failed:', error);
  process.exit(1);
});
