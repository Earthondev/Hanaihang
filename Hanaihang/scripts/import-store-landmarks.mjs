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

function parseArgs() {
  const args = process.argv.slice(2);
  let file = null;
  let dryRun = false;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--file' && args[i + 1]) {
      file = args[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith('--file=')) {
      file = arg.split('=')[1];
      continue;
    }
    if (arg === '--dry-run') {
      dryRun = true;
    }
  }

  if (!file) {
    throw new Error('Missing --file argument');
  }

  return { file, dryRun };
}

function parseTsv(content) {
  const lines = content.split(/\r?\n/).filter(Boolean);
  const [headerLine, ...rows] = lines;
  const headers = headerLine.split('\t').map((h) => h.trim());
  return rows.map((line) => {
    const cols = line.split('\t');
    const record = {};
    headers.forEach((key, idx) => {
      record[key] = cols[idx] != null ? cols[idx].trim() : '';
    });
    return record;
  });
}

function parseList(value) {
  if (!value) return [];
  return value
    .split(';')
    .map((v) => v.trim())
    .filter(Boolean);
}

async function commitBatches(updates) {
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
  const { file, dryRun } = parseArgs();
  const filePath = path.resolve(projectRoot, file);

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const rows = parseTsv(content);

  const updates = [];
  let skipped = 0;

  for (const row of rows) {
    const mallId = row.mallId;
    const storeId = row.storeId;

    if (!mallId || !storeId) {
      skipped += 1;
      continue;
    }

    const ref = db.collection('malls').doc(mallId).collection('stores').doc(storeId);
    const updateData = {};

    if (row.floorLabel) updateData.floorLabel = row.floorLabel;
    if (row.landmarks) updateData.landmarks = parseList(row.landmarks);
    if (row.directions) updateData.directions = row.directions;
    if (row.nearbyStores) updateData.nearbyStores = parseList(row.nearbyStores);

    if (Object.keys(updateData).length === 0) {
      skipped += 1;
      continue;
    }

    updates.push({ ref, data: updateData });
  }

  if (dryRun) {
    console.log(`Dry run: ${updates.length} updates ready (${skipped} skipped).`);
    process.exit(0);
  }

  const total = await commitBatches(updates);
  console.log(`Updated ${total} stores (${skipped} skipped).`);
}

main().catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});
