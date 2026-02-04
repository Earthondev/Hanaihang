import dotenv from 'dotenv';
import admin from 'firebase-admin';
import fs from 'node:fs/promises';

dotenv.config();

const argMap = new Map();
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i += 1) {
  const arg = argv[i];
  if (!arg.startsWith('--')) continue;
  const key = arg.slice(2);
  const next = argv[i + 1];
  if (next && !next.startsWith('--')) {
    argMap.set(key, next);
    i += 1;
  } else {
    argMap.set(key, true);
  }
}

const mallId = argMap.get('mall');
const name = argMap.get('name');
const floorId = argMap.get('floor');
const unit = argMap.get('unit') || '';
const category = argMap.get('category') || 'Food & Beverage';
const sourceNote = argMap.get('note') || 'Manual entry from user-provided info.';
const keywordArg = argMap.get('keywords') || '';
const extraKeywords = keywordArg
  ? String(keywordArg)
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
  : [];

if (!mallId || !name || !floorId) {
  console.error('Usage: node scripts/add-manual-store.mjs --mall <mallId> --name <name> --floor <floorId> [--unit <unit>] [--category <category>] [--note <note>]');
  process.exit(1);
}

const toSlug = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[\u200b\u200c\u200d]/g, '')
    .replace(/[^\p{L}\p{N}\s-]+/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const normalizeText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase();

const splitKeywords = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) return [];
  const tokens = normalized
    .replace(/[\u200b\u200c\u200d]/g, '')
    .replace(/[^\p{L}\p{N}\s-]+/gu, ' ')
    .split(/[\s\-]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  return Array.from(new Set(tokens));
};

const buildKeywords = (...values) => {
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
};

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
  const mallRef = db.collection('malls').doc(mallId);
  const mallSnap = await mallRef.get();
  if (!mallSnap.exists) throw new Error(`Mall not found: ${mallId}`);
  const mall = mallSnap.data();

  const baseSlug = toSlug(name);
  const storeId = `${baseSlug}-${floorId}`;
  const storesRef = mallRef.collection('stores');

  const now = admin.firestore.FieldValue.serverTimestamp();
  const payload = {
    name,
    nameLower: normalizeText(name),
    brandSlug: baseSlug,
    category,
    floorId,
    floorLabel: floorId,
    unit,
    status: 'Active',
    mallId,
    mallSlug: mallId,
    mallName: mall?.displayName || mallId,
    mallCoords: mall?.lat && mall?.lng ? { lat: mall.lat, lng: mall.lng } : undefined,
    searchKeywords: buildKeywords(
      name,
      baseSlug,
      category,
      floorId,
      unit,
      mall?.displayName,
      mallId,
      ...extraKeywords,
    ),
    sources: [
      {
        name: 'User Provided',
        retrievedAt: new Date().toISOString().slice(0, 10),
        note: sourceNote,
      },
    ],
    updatedAt: now,
  };

  const candidateRef = storesRef.doc(storeId);
  const candidateSnap = await candidateRef.get();
  if (!candidateSnap.exists) {
    payload.createdAt = now;
    await candidateRef.set(payload, { merge: true });
    console.log(`✅ Added store ${storeId} to ${mallId}`);
  } else {
    await candidateRef.set(payload, { merge: true });
    console.log(`✅ Updated store ${storeId} in ${mallId}`);
  }
};

main().catch((error) => {
  console.error('❌ Add store failed:', error);
  process.exit(1);
});
