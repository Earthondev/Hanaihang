import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

type MallDoc = {
  displayName: string;
  slug: string;
  address?: string;
  district?: string;
  location: { lat: number; lng: number } | null;
  phone?: string;
  website?: string;
  source?: string;
};

// Init firebase-admin using GOOGLE_APPLICATION_CREDENTIALS
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

async function run() {
  const seedPath = path.resolve(process.argv[2] || 'scripts/malls-seed.json');
  const raw = fs.readFileSync(seedPath, 'utf-8');
  const malls: MallDoc[] = JSON.parse(raw);

  const batch = db.batch();
  for (const m of malls) {
    if (!m.slug || !m.location) continue;
    const ref = db.collection('malls').doc(m.slug);
    batch.set(ref, {
      ...m,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }
  await batch.commit();
  console.log(`Upserted ${malls.length} malls ✅`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
