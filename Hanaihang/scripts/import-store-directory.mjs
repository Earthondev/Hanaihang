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
  : null;

if (!filePath) {
  console.error('Usage: node scripts/import-store-directory.mjs --file data/directories/<mall>.json');
  process.exit(1);
}

const dryRun = Boolean(argMap.get('dry-run'));
const batchSize = Number(argMap.get('batch') || 300);
const updateCounts = !Boolean(argMap.get('skip-counts'));
const purgeExisting = Boolean(argMap.get('purge'));

const toSlug = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^\u0E00-\u0E7Fa-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

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

const normalizeCategory = (raw) => {
  if (!raw) return 'Services';
  const text = raw.toLowerCase();
  if (text.includes('food') || text.includes('cafe') || text.includes('restaurant') || text.includes('dining')) return 'Food & Beverage';
  if (text.includes('fashion') || text.includes('apparel') || text.includes('clothing')) return 'Fashion';
  if (text.includes('beauty') || text.includes('cosmetic')) return 'Beauty';
  if (text.includes('electronics') || text.includes('tech')) return 'Electronics';
  if (text.includes('sport') || text.includes('fitness')) return 'Sports';
  if (text.includes('book') || text.includes('stationery')) return 'Books';
  if (text.includes('home') || text.includes('furniture')) return 'Home & Garden';
  if (text.includes('health') || text.includes('pharmacy')) return 'Health & Pharmacy';
  if (text.includes('entertainment') || text.includes('cinema')) return 'Entertainment';
  if (text.includes('service') || text.includes('bank')) return 'Services';
  return 'Services';
};

const main = async () => {
  const payload = JSON.parse(await fs.readFile(filePath, 'utf8'));
  const mallSlug = payload.mallSlug;
  if (!mallSlug) {
    throw new Error('mallSlug is required in directory file');
  }

  if (dryRun) {
    console.log(`Dry run: ready to import stores for ${mallSlug}`);
    return;
  }

  await initFirebase();
  const db = admin.firestore();
  const now = admin.firestore.FieldValue.serverTimestamp();

  const mallRef = db.collection('malls').doc(mallSlug);
  const mallSnap = await mallRef.get();
  if (!mallSnap.exists) {
    throw new Error(`Mall not found: ${mallSlug}`);
  }
  const mall = mallSnap.data();

  const purgeCollection = async (collectionRef) => {
    const snap = await collectionRef.get();
    let batch = db.batch();
    let batchCount = 0;
    let deleted = 0;
    const commitBatch = async () => {
      if (batchCount === 0) return;
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    };

    for (const doc of snap.docs) {
      batch.delete(doc.ref);
      batchCount += 1;
      deleted += 1;
      if (batchCount >= batchSize) {
        await commitBatch();
      }
    }
    await commitBatch();
    return deleted;
  };

  if (purgeExisting) {
    const deletedStores = await purgeCollection(mallRef.collection('stores'));
    const deletedFloors = await purgeCollection(mallRef.collection('floors'));
    console.log(`🧹 Purged ${deletedStores} stores and ${deletedFloors} floors for ${mallSlug}`);
  }

  const floors = payload.floors || [];
  const stores = [];

  for (const floor of floors) {
    const floorId = floor.id || floor.label;
    const floorLabel = floor.label || floorId;
    const floorStores = floor.stores || [];

    for (const store of floorStores) {
      stores.push({
        ...store,
        floorId,
        floorLabel,
      });
    }
  }

  let batch = db.batch();
  let batchCount = 0;
  let totalStores = 0;
  const commitBatch = async () => {
    if (batchCount === 0) return;
    await batch.commit();
    batch = db.batch();
    batchCount = 0;
  };

  for (const floor of floors) {
    const floorId = floor.id || floor.label;
    if (!floorId) continue;
    const floorRef = mallRef.collection('floors').doc(floorId);
    const floorPayload = sanitize({
      label: floor.label || floorId,
      name: floor.name || '',
      order: Number.isFinite(floor.order) ? floor.order : 0,
      mallId: mallSlug,
      _mallId: mallSlug,
      updatedAt: now,
      createdAt: now,
    });
    batch.set(floorRef, floorPayload, { merge: true });
    batchCount += 1;

    if (batchCount >= batchSize) {
      await commitBatch();
    }
  }

  const seenIds = new Set();
  for (const store of stores) {
    if (!store.name) continue;
    const baseSlug = toSlug(store.name);
    let storeId = store.id || `${baseSlug}-${store.floorId}`;
    let counter = 1;
    while (seenIds.has(storeId)) {
      counter += 1;
      storeId = `${baseSlug}-${store.floorId}-${counter}`;
    }
    seenIds.add(storeId);

    const sourceList = [];
    if (Array.isArray(store.sources)) sourceList.push(...store.sources);
    if (payload.source && sourceList.length === 0) sourceList.push(payload.source);

    const payloadStore = sanitize({
      name: store.name,
      nameLower: store.name.toLowerCase(),
      brandSlug: store.brandSlug || baseSlug,
      category: store.category || normalizeCategory(store.categoryLabel || store.categoryRaw || ''),
      floorId: store.floorId,
      floorLabel: store.floorLabel,
      unit: store.unit || '',
      phone: store.phone || null,
      hours: store.hours || null,
      status: store.status || 'Active',
      mallId: mallSlug,
      mallSlug,
      mallName: mall.displayName || mallSlug,
      mallCoords: mall.lat && mall.lng ? { lat: mall.lat, lng: mall.lng } : undefined,
      sources: sourceList,
      createdAt: now,
      updatedAt: now,
    });

    const storeRef = mallRef.collection('stores').doc(storeId);
    batch.set(storeRef, payloadStore, { merge: true });
    batchCount += 1;
    totalStores += 1;

    if (batchCount >= batchSize) {
      await commitBatch();
    }
  }

  await commitBatch();

  if (updateCounts) {
    await mallRef.set(
      {
        floorCount: floors.length,
        storeCount: totalStores,
        updatedAt: now,
      },
      { merge: true },
    );
  }

  console.log(`✅ Imported ${totalStores} stores for ${mallSlug}`);
};

main().catch((error) => {
  console.error('❌ Import failed:', error);
  process.exit(1);
});
