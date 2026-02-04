import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const argMap = new Map();
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i += 1) {
  const arg = argv[i];
  if (!arg.startsWith('--')) continue;
  const raw = arg.slice(2);
  if (raw.includes('=')) {
    const [key, value] = raw.split('=');
    argMap.set(key, value);
    continue;
  }
  const next = argv[i + 1];
  if (next && !next.startsWith('--')) {
    argMap.set(raw, next);
    i += 1;
  } else {
    argMap.set(raw, true);
  }
}

const filePath = argMap.get('file')
  ? path.resolve(ROOT, String(argMap.get('file')))
  : path.join(ROOT, 'data/derived/malls-osm.json');

const dryRun = Boolean(argMap.get('dry-run'));
const batchSize = Number(argMap.get('batch') || 300);
const setCreatedAt = Boolean(argMap.get('set-created'));

const toSlug = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^\u0E00-\u0E7Fa-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const buildSearchKeywords = (displayName, slug, brandGroup) => {
  const keywords = new Set();
  if (displayName) {
    keywords.add(displayName);
    keywords.add(displayName.toLowerCase());
    keywords.add(displayName.replace(/\s+/g, ''));
  }
  if (slug) {
    keywords.add(slug);
    keywords.add(slug.replace(/-/g, ' '));
  }
  if (brandGroup) {
    keywords.add(brandGroup);
    keywords.add(brandGroup.toLowerCase());
  }
  return Array.from(keywords).filter(Boolean);
};

const sanitize = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize).filter((v) => v !== undefined);

  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (typeof value === 'number' && !Number.isFinite(value)) continue;
    if (typeof value === 'object' && value !== null) {
      const nested = sanitize(value);
      if (nested && (typeof nested !== 'object' || Object.keys(nested).length > 0)) {
        out[key] = nested;
      }
    } else {
      out[key] = value;
    }
  }
  return out;
};

const loadInput = async () => {
  const raw = JSON.parse(await fs.readFile(filePath, 'utf8'));
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.malls)) return raw.malls;
  throw new Error('Invalid input JSON: expected array or { malls: [] }');
};

const initFirebase = async () => {
  if (admin.apps.length) return admin.app();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID is required in env');
  }
  if (!credentialsPath) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS is required in env');
  }

  const serviceAccount = JSON.parse(await fs.readFile(credentialsPath, 'utf8'));

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId,
  });
};

const main = async () => {
  const malls = await loadInput();
  if (!malls.length) {
    console.log('No malls found in input.');
    return;
  }

  if (dryRun) {
    console.log(`Dry run: ${malls.length} malls ready to import from ${filePath}`);
    return;
  }

  await initFirebase();
  const db = admin.firestore();
  const now = admin.firestore.FieldValue.serverTimestamp();

  let batch = db.batch();
  let batchCount = 0;
  let total = 0;

  const commitBatch = async () => {
    if (batchCount === 0) return;
    await batch.commit();
    batch = db.batch();
    batchCount = 0;
  };

  for (const mall of malls) {
    if (!mall.displayName) continue;

    const slug = mall.name || toSlug(mall.displayName);
    const nameLower = mall.nameLower || mall.displayName.toLowerCase();

    const payload = sanitize({
      name: slug,
      displayName: mall.displayName,
      nameLower,
      searchKeywords: mall.searchKeywords || buildSearchKeywords(mall.displayName, slug, mall.brandGroup),
      address: mall.address || '',
      district: mall.district || '',
      province: mall.province || '',
      contact: mall.contact || {},
      lat: mall.lat,
      lng: mall.lng,
      coords: mall.lat && mall.lng ? { lat: mall.lat, lng: mall.lng } : undefined,
      openTime: mall.openTime || '',
      closeTime: mall.closeTime || '',
      category: mall.category,
      categoryLabel: mall.categoryLabel,
      status: mall.status || 'Active',
      storeCount: mall.storeCount ?? 0,
      floorCount: mall.floorCount ?? 0,
      brandGroup: mall.brandGroup || '',
      sources: mall.sources || [],
      osm: mall.osm,
      updatedAt: now,
      ...(setCreatedAt ? { createdAt: now } : {}),
    });

    const ref = db.collection('malls').doc(slug);
    batch.set(ref, payload, { merge: true });
    batchCount += 1;
    total += 1;

    if (batchCount >= batchSize) {
      await commitBatch();
    }
  }

  await commitBatch();
  console.log(`✅ Imported ${total} malls to Firestore`);
};

main().catch((error) => {
  console.error('❌ Import failed:', error);
  process.exit(1);
});
