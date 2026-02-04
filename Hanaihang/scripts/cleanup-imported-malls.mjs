import dotenv from 'dotenv';
import admin from 'firebase-admin';
import fs from 'node:fs/promises';

dotenv.config();

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

const hasPhotonSource = (sources) =>
  Array.isArray(sources) && sources.some((s) => String(s?.name || '').includes('Photon'));

const hasOsmSource = (sources) =>
  Array.isArray(sources) && sources.some((s) => String(s?.name || '').includes('OpenStreetMap'));

const main = async () => {
  await initFirebase();
  const db = admin.firestore();

  const snap = await db.collection('malls').get();
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
    const data = doc.data();
    if (data.osm || hasPhotonSource(data.sources) || hasOsmSource(data.sources)) {
      batch.delete(doc.ref);
      batchCount += 1;
      deleted += 1;
      if (batchCount >= 400) {
        await commitBatch();
      }
    }
  }

  await commitBatch();
  console.log(`✅ Deleted ${deleted} OSM/Photon-imported malls`);
};

main().catch((error) => {
  console.error('❌ Cleanup failed:', error);
  process.exit(1);
});
