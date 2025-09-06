// Test script to check if search is working
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, startAt, endAt, limit } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBxHxm6viYLXpifkewwj_JR0w9DVzQjuIs",
  authDomain: "hanaihang-fe9ec.firebaseapp.com",
  databaseURL: "https://hanaihang-fe9ec-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hanaihang-fe9ec",
  storageBucket: "hanaihang-fe9ec.firebasestorage.app",
  messagingSenderId: "373432002291",
  appId: "1:373432002291:web:87186fbe0b9e24edfbf986",
  measurementId: "G-FPBPXYFFWT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testSearch() {
  try {
    console.log('🔍 Testing search functionality...');
    
    // Test 1: Get all malls
    console.log('\n1. Getting all malls...');
    const mallsSnapshot = await getDocs(collection(db, 'malls'));
    console.log(`Found ${mallsSnapshot.size} malls`);
    
    if (mallsSnapshot.size > 0) {
      const firstMall = mallsSnapshot.docs[0].data();
      console.log('First mall:', firstMall.displayName || firstMall.name);
    }
    
    // Test 2: Search for "Central"
    console.log('\n2. Searching for "Central"...');
    const searchKey = 'central';
    const searchQuery = query(
      collection(db, 'malls'),
      orderBy('nameLower'),
      startAt(searchKey),
      endAt(searchKey + '\uf8ff'),
      limit(5)
    );
    
    try {
      const searchSnapshot = await getDocs(searchQuery);
      console.log(`Found ${searchSnapshot.size} malls matching "Central"`);
      searchSnapshot.forEach(doc => {
        console.log('-', doc.data().displayName || doc.data().name);
      });
    } catch (error) {
      console.log('❌ Search failed:', error.message);
      console.log('This might be because the index is not ready yet.');
    }
    
    // Test 3: Get stores
    console.log('\n3. Getting stores...');
    const storesSnapshot = await getDocs(collection(db, 'stores'));
    console.log(`Found ${storesSnapshot.size} stores`);
    
    console.log('\n✅ Search test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSearch();
