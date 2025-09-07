/**
 * Seed Test Data for E2E Testing
 * Creates sample malls and stores for testing
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';

// Firebase config (use your actual config)
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample test data
const testMalls = [
  {
    id: 'central-rama-3',
    displayName: 'Central Rama 3',
    name: 'central-rama-3',
    address: '123 Rama III Road, Bang Phong Phang, Yan Nawa, Bangkok 10120',
    district: 'Yan Nawa',
    coords: { lat: 13.6891, lng: 100.5441 },
    hours: { open: '10:00', close: '22:00' },
    phone: '02-123-4567',
    website: 'https://central.co.th',
    social: 'https://facebook.com/centralrama3',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'siam-paragon',
    displayName: 'Siam Paragon',
    name: 'siam-paragon',
    address: '991 Rama I Road, Pathum Wan, Bangkok 10330',
    district: 'Pathum Wan',
    coords: { lat: 13.7466, lng: 100.5347 },
    hours: { open: '10:00', close: '22:00' },
    phone: '02-610-8000',
    website: 'https://siamparagon.co.th',
    social: 'https://facebook.com/siamparagon',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'central-world',
    displayName: 'Central World',
    name: 'central-world',
    address: '999/9 Rama I Road, Pathum Wan, Bangkok 10330',
    district: 'Pathum Wan',
    coords: { lat: 13.7478, lng: 100.5395 },
    hours: { open: '10:00', close: '22:00' },
    phone: '02-640-7000',
    website: 'https://centralworld.co.th',
    social: 'https://facebook.com/centralworld',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const testStores = [
  {
    id: 'hm-central-rama-3',
    name: 'H&M',
    category: 'Fashion',
    mallId: 'central-rama-3',
    floorId: 'G',
    unit: 'G-101',
    phone: '02-123-4567',
    hours: '10:00-22:00',
    status: 'Active',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'starbucks-central-rama-3',
    name: 'Starbucks',
    category: 'Food & Beverage',
    mallId: 'central-rama-3',
    floorId: 'G',
    unit: 'G-102',
    phone: '02-123-4568',
    hours: '06:00-22:00',
    status: 'Active',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'uniqlo-siam-paragon',
    name: 'Uniqlo',
    category: 'Fashion',
    mallId: 'siam-paragon',
    floorId: 'G',
    unit: 'G-201',
    phone: '02-610-8001',
    hours: '10:00-22:00',
    status: 'Active',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'mcdonalds-central-world',
    name: "McDonald's",
    category: 'Food & Beverage',
    mallId: 'central-world',
    floorId: 'G',
    unit: 'G-301',
    phone: '02-640-7001',
    hours: '06:00-24:00',
    status: 'Active',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'zara-central-world',
    name: 'Zara',
    category: 'Fashion',
    mallId: 'central-world',
    floorId: 'G',
    unit: 'G-302',
    phone: '02-640-7002',
    hours: '10:00-22:00',
    status: 'Active',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function seedTestData() {
  try {
    console.log('🌱 Starting to seed test data...');

    // Add malls
    for (const mall of testMalls) {
      await setDoc(doc(db, 'malls', mall.id), mall);
      console.log(`✅ Added mall: ${mall.displayName}`);
    }

    // Add stores to subcollections
    for (const store of testStores) {
      await setDoc(doc(db, 'malls', store.mallId, 'stores', store.id), store);
      console.log(`✅ Added store: ${store.name} to ${store.mallId}`);
    }

    console.log('🎉 Test data seeding completed successfully!');
    console.log(`📊 Added ${testMalls.length} malls and ${testStores.length} stores`);
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTestData();
}

export { seedTestData };
