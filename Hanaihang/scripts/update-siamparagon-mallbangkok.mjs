import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import admin from 'firebase-admin';

const SOURCE_URL = 'https://www.mallbangkok.com/siam-paragon-%E0%B8%AA%E0%B8%A2%E0%B8%B2%E0%B8%A1%E0%B8%9E%E0%B8%B2%E0%B8%A3%E0%B8%B2%E0%B8%81%E0%B8%AD%E0%B8%99/';

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

function decodeHtml(value) {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
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

async function fetchDirectory() {
  const res = await fetch(SOURCE_URL, {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; HanaihangBot/1.0)' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${SOURCE_URL}: ${res.status}`);
  }
  return res.text();
}

function parseRows(html) {
  const rowRegex = /<tr class="row-\d+">\s*<td class="column-1">(.*?)<\/td>\s*<td class="column-2">(.*?)<\/td>\s*<td class="column-3">(.*?)<\/td>\s*<td class="column-4">(.*?)<\/td>\s*<\/tr>/gs;
  const mapping = new Map();
  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const name = decodeHtml(match[1]);
    const floor = decodeHtml(match[2]);
    const zone = decodeHtml(match[3]);
    const key = normalizeName(name);
    if (!key) continue;
    if (!mapping.has(key)) {
      mapping.set(key, { name, floor, zone });
    }
  }
  return mapping;
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
  const html = await fetchDirectory();
  const mapping = parseRows(html);

  const storesSnap = await db.collection('malls').doc('siam-paragon').collection('stores').get();
  const updates = [];
  let matched = 0;
  let updated = 0;
  let skipped = 0;
  let noMatch = 0;

  storesSnap.forEach((doc) => {
    const store = doc.data();
    const key = normalizeName(store.name);
    if (!mapping.has(key)) {
      noMatch += 1;
      return;
    }

    const info = mapping.get(key);
    const updateData = {};

    if (!store.floorLabel && info.floor) {
      updateData.floorLabel = info.floor;
    }

    if ((!store.landmarks || store.landmarks.length === 0) && info.zone) {
      updateData.landmarks = [`Zone: ${info.zone}`];
    }

    if (Object.keys(updateData).length === 0) {
      skipped += 1;
      return;
    }

    updates.push({ ref: doc.ref, data: updateData });
    matched += 1;
  });

  updated = await commitBatch(updates);

  const report = {
    totalStores: storesSnap.size,
    matched,
    updated,
    skipped,
    noMatch,
    source: SOURCE_URL,
  };

  const reportDir = path.join(projectRoot, 'data', 'derived');
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, 'siamparagon-mallbangkok-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('MallBangkok update complete');
  console.log(JSON.stringify(report, null, 2));
  console.log(`Report: ${reportPath}`);
}

main().catch((error) => {
  console.error('Update failed:', error);
  process.exit(1);
});
