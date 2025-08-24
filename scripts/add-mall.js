const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Firebase config จาก src/config/firebase.ts
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ข้อมูลห้างใหม่ที่ต้องการเพิ่ม
const newMall = {
  name: "central-ladprao",
  displayName: "เซ็นทรัล ลาดพร้าว",
  address: "1693 Phahonyothin Road, Chatuchak",
  district: "Chatuchak",
  contact: {
    phone: "02 937 9999",
    website: "https://www.centralplaza.co.th/ladprao"
  },
  coords: {
    lat: 13.8133,
    lng: 100.5634
  },
  hours: {
    open: "10:00",
    close: "22:00"
  },
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
};

async function addMall() {
  try {
    console.log('🔄 กำลังเพิ่มห้างใหม่...');
    const docRef = await addDoc(collection(db, 'malls'), newMall);
    console.log('✅ เพิ่มห้างสำเร็จ! ID:', docRef.id);
    console.log('📍 ห้าง:', newMall.displayName);
    console.log('🌐 ดูได้ที่: http://localhost:5173/admin');
  } catch (error) {
    console.error('❌ Error adding mall:', error);
  }
}

// รันฟังก์ชัน
addMall();
