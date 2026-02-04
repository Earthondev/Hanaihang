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

function normalizeText(value) {
  if (!value) return '';
  return String(value)
    .trim()
    .toLowerCase();
}

function splitKeywords(value) {
  const normalized = normalizeText(value);
  if (!normalized) return [];
  const tokens = normalized
    .replace(/[\u200b\u200c\u200d]/g, '')
    .replace(/[^\p{L}\p{N}\s-]+/gu, ' ')
    .split(/[\s\-]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  return Array.from(new Set(tokens));
}

function buildKeywords(...values) {
  const set = new Set();
  for (const value of values) {
    if (!value) continue;
    const normalized = normalizeText(value);
    if (normalized) set.add(normalized);
    for (const token of splitKeywords(value)) {
      set.add(token);
    }
  }
  return Array.from(set);
}

async function updateInBatches(updates) {
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

async function migrateMalls() {
  const mallsSnap = await db.collection('malls').get();
  const updates = [];

  mallsSnap.forEach((doc) => {
    const data = doc.data();
    const displayName = data.displayName || data.name || '';
    const nameLower = normalizeText(displayName);
    const keywords = buildKeywords(
      displayName,
      data.name,
      data.address,
      data.district,
      data.province,
      data.brandGroup
    );

    const updateData = {};
    if (!data.nameLower || data.nameLower !== nameLower) {
      updateData.nameLower = nameLower;
    }
    if (!Array.isArray(data.searchKeywords) || data.searchKeywords.length === 0) {
      updateData.searchKeywords = keywords;
    }

    if (Object.keys(updateData).length > 0) {
      updates.push({ ref: doc.ref, data: updateData });
    }
  });

  const updated = await updateInBatches(updates);
  return { total: mallsSnap.size, updated };
}

async function migrateStores() {
  const mallsSnap = await db.collection('malls').get();
  let totalStores = 0;
  let updates = [];
  let updatedCount = 0;

  for (const mallDoc of mallsSnap.docs) {
    const storesSnap = await mallDoc.ref.collection('stores').get();
    totalStores += storesSnap.size;

    storesSnap.forEach((storeDoc) => {
      const data = storeDoc.data();
      const displayName = data.name || '';
      const nameLower = normalizeText(displayName);
      const keywords = buildKeywords(
        displayName,
        data.brandSlug,
        data.category,
        data.floorLabel,
        data.floorId,
        data.unit
      );

      const updateData = {};
      if (!data.nameLower || data.nameLower !== nameLower) {
        updateData.nameLower = nameLower;
      }
      if (!Array.isArray(data.searchKeywords) || data.searchKeywords.length === 0) {
        updateData.searchKeywords = keywords;
      }

      if (Object.keys(updateData).length > 0) {
        updates.push({ ref: storeDoc.ref, data: updateData });
      }
    });

    if (updates.length >= BATCH_SIZE) {
      updatedCount += await updateInBatches(updates);
      updates = [];
    }
  }

  if (updates.length > 0) {
    updatedCount += await updateInBatches(updates);
  }

  return { total: totalStores, updated: updatedCount };
}

async function main() {
  console.log('Starting search field migration...');
  const malls = await migrateMalls();
  console.log(`Malls: ${malls.updated}/${malls.total} updated.`);

  const stores = await migrateStores();
  console.log(`Stores: ${stores.updated}/${stores.total} updated.`);

  console.log('Migration complete.');
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
