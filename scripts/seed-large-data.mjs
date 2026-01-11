
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

// Firebase configuration (Same as existing)
const firebaseConfig = {
    apiKey: "AIzaSyBxHxm6viYLXpifkewwj_JR0w9DVzQjuIs",
    authDomain: "hanaihang-fe9ec.firebaseapp.com",
    projectId: "hanaihang-fe9ec",
    storageBucket: "hanaihang-fe9ec.firebasestorage.app",
    messagingSenderId: "373432002291",
    appId: "1:373432002291:web:87186fbe0b9e24edfbf986",
    measurementId: "G-FPBPXYFFWT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const MALLS = [
    {
        id: 'siam-paragon',
        displayName: 'Siam Paragon',
        name: 'siam-paragon',
        address: '991 Rama I Rd, Pathum Wan, Bangkok 10330',
        lat: 13.7469,
        lng: 100.5349,
        category: 'high-end',
        categoryLabel: 'ห้างสรรพสินค้าลักชูรี',
        floorCount: 6,
        openTime: '10:00',
        closeTime: '22:00'
    },
    {
        id: 'central-world',
        displayName: 'Central World',
        name: 'central-world',
        address: '999/9 Rama I Rd, Pathum Wan, Bangkok 10330',
        lat: 13.7466,
        lng: 100.5393,
        category: 'shopping-center',
        categoryLabel: 'ศูนย์การค้า',
        floorCount: 8,
        openTime: '10:00',
        closeTime: '22:00'
    },
    {
        id: 'iconsiam',
        displayName: 'ICONSIAM',
        name: 'iconsiam',
        address: '299 Charoen Nakhon Rd, Khlong Ton Sai, Khlong San, Bangkok 10600',
        lat: 13.7267,
        lng: 100.5105,
        category: 'high-end',
        categoryLabel: 'ริมแม่น้ำเจ้าพระยา',
        floorCount: 8,
        openTime: '10:00',
        closeTime: '22:00'
    },
    {
        id: 'emquartier',
        displayName: 'EmQuartier',
        name: 'emquartier',
        address: '693 Sukhumvit Rd, Khlong Tan Nuea, Watthana, Bangkok 10110',
        lat: 13.7319,
        lng: 100.5696,
        category: 'high-end',
        categoryLabel: 'ไลฟ์สไตล์มอลล์',
        floorCount: 5,
        openTime: '10:00',
        closeTime: '22:00'
    },
    {
        id: 'central-embassy',
        displayName: 'Central Embassy',
        name: 'central-embassy',
        address: '1031 Phloen Chit Rd, Lumphini, Pathum Wan, Bangkok 10330',
        lat: 13.7438,
        lng: 100.5471,
        category: 'high-end',
        categoryLabel: 'ลักชูรี ไลฟ์สไตล์',
        floorCount: 6,
        openTime: '10:00',
        closeTime: '22:00'
    }
];

const FLOORS = [
    { id: 'G', label: 'G', name: 'Ground Floor', order: 0 },
    { id: 'M', label: 'M', name: 'Main Floor', order: 1 },
    { id: '1', label: '1', name: '1st Floor', order: 2 },
    { id: '2', label: '2', name: '2nd Floor', order: 3 },
    { id: '3', label: '3', name: '3rd Floor', order: 4 },
    { id: '4', label: '4', name: '4th Floor', order: 5 },
    { id: '5', label: '5', name: '5th Floor', order: 6 },
    { id: '6', label: '6', name: '6th Floor', order: 7 }
];

const CATEGORIES = [
    { id: 'Fashion', labels: ['Fashion', 'Clothing', 'Accessories'], icons: ['Zara', 'H&M', 'Uniqlo', 'Gucci', 'Prada', 'Nike', 'Adidas', 'Gentlewoman', 'Pomelo'] },
    { id: 'Food & Beverage', labels: ['Food', 'Cafe', 'Restaurant'], icons: ['Starbucks', 'After You', 'MK Restaurants', 'Bonchon', 'Koi Thé', 'Fuji', 'Yayoi', 'KFC', 'Burger King'] },
    { id: 'Electronics', labels: ['Tech', 'Gadgets'], icons: ['iStudio', 'Samsung', 'Sony', 'Banana IT', 'JIB', 'Big Camera'] },
    { id: 'Beauty', labels: ['Beauty', 'Cosmetics'], icons: ['Sephora', 'Eveandboy', 'Watsons', 'Boots', 'M.A.C', 'Dior Beauty'] }
];

const statuses = ['Active', 'Active', 'Active', 'Closed', 'Maintenance'];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function seedData() {
    console.log('🌱 Starting large data seed...');
    let totalStores = 0;

    for (const mall of MALLS) {
        console.log(`\n🏢 Processing Mall: ${mall.displayName}`);

        // 1. Create/Update Mall
        const mallRef = doc(db, 'malls', mall.id);
        await setDoc(mallRef, {
            ...mall,
            status: 'Active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }, { merge: true });

        // 2. Create Floors
        const floorLimit = Math.min(mall.floorCount, FLOORS.length);
        for (let i = 0; i < floorLimit; i++) {
            const floor = FLOORS[i];
            const floorRef = doc(collection(db, 'malls', mall.id, 'floors'), floor.id);
            await setDoc(floorRef, { ...floor, mallId: mall.id });
        }

        // 3. Create Stores (Batch per floor to avoid limits)
        for (let i = 0; i < floorLimit; i++) {
            const floor = FLOORS[i];
            const batch = writeBatch(db);
            const storeCount = Math.floor(Math.random() * 8) + 5; // 5-12 stores per floor

            for (let j = 0; j < storeCount; j++) {
                const category = getRandomItem(CATEGORIES);
                const brand = getRandomItem(category.icons);
                const storeName = `${brand} ${j > 0 ? '#' + j : ''}`; // Simple unique name
                const storeId = `${brand.toLowerCase().replace(/\s+/g, '-')}-${mall.id}-${floor.id}-${j}`;

                // Root path (stores/{id})
                const rootStoreRef = doc(db, 'stores', storeId);
                // Nested path (malls/{id}/stores/{id})
                const nestedStoreRef = doc(db, 'malls', mall.id, 'stores', storeId);

                const storeData = {
                    name: storeName,
                    name_normalized: storeName.toLowerCase(),
                    category: category.id,
                    mallId: mall.id,
                    mallSlug: mall.name,
                    mallName: mall.displayName, // Denormalized
                    mallCoords: { lat: mall.lat, lng: mall.lng }, // Denormalized
                    floorId: floor.id,
                    floorLabel: floor.name, // Denormalized full name
                    unit: `${floor.id}-${100 + j}`,
                    status: getRandomItem(statuses),
                    hours: `${mall.openTime}-${mall.closeTime}`,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };

                // Write to both paths for current compatibility
                batch.set(rootStoreRef, storeData);
                batch.set(nestedStoreRef, storeData);
                totalStores++;
            }

            await batch.commit();
            console.log(`   - Floor ${floor.id}: Added ${storeCount} stores`);
        }
    }

    console.log(`\n✨ Seeding completed! Added ~${totalStores} stores across ${MALLS.length} malls.`);
    process.exit(0);
}

seedData().catch(console.error);
