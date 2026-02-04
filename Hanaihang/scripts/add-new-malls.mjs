import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxHxm6viYLXpifkewwj_JR0w9DVzQjuIs",
  authDomain: "hanaihang-fe9ec.firebaseapp.com",
  projectId: "hanaihang-fe9ec",
  storageBucket: "hanaihang-fe9ec.firebasestorage.app",
  messagingSenderId: "373432002291",
  appId: "1:373432002291:web:87186fbe0b9e24edfbf986",
  measurementId: "G-FPBPXYFFWT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper function to create slug from display name
function toSlug(displayName) {
  return displayName
    .toLowerCase()
    .replace(/[^\u0E00-\u0E7Fa-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Mall data
const malls = [
  {
    displayName: "Central Plaza Rama 4",
    name: "central-plaza-rama-4",
    address: "1219 ถนนพระรามที่ 4 แขวงทุ่งมหาเมฆ เขตสาทร กรุงเทพมหานคร 10120",
    district: "สาทร",
    phone: "02-123-4567",
    website: "https://www.central.co.th/th/store/central-rama-4",
    social: "",
    facebook: "",
    line: "",
    lat: 13.72225,
    lng: 100.55169,
    openTime: "10:00",
    closeTime: "22:00",
    category: "shopping-center",
    categoryLabel: "ศูนย์การค้า",
    status: "Active",
    floorCount: 6,
    storeCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    displayName: "Central Plaza Phra Pradaeng",
    name: "central-plaza-phra-pradaeng",
    address: "ถนนสุขสวัสดิ์ ตำบลบางจาก อำเภอพระประแดง จังหวัดสมุทรปราการ 10130",
    district: "พระประแดง, สมุทรปราการ",
    phone: "02-123-4567",
    website: "https://www.central.co.th/th/store/central-phra-pradaeng",
    social: "",
    facebook: "",
    line: "",
    lat: 13.63914,
    lng: 100.53589,
    openTime: "10:00",
    closeTime: "22:00",
    category: "shopping-center",
    categoryLabel: "ศูนย์การค้า",
    status: "Active",
    floorCount: 5,
    storeCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    displayName: "Central Village",
    name: "central-village",
    address: "98, 98/1, 98/2 หมู่ 5 ถนนสุวรรณภูมิ 3 ตำบลบางโฉลง อำเภอบางพลี จังหวัดสมุทรปราการ 10540",
    district: "บางพลี, สมุทรปราการ",
    phone: "02-172-7600",
    website: "https://www.centralvillagebangkok.com/",
    social: "https://www.facebook.com/centralvillagebangkok",
    facebook: "https://www.facebook.com/centralvillagebangkok",
    line: "@centralvillage",
    lat: 13.6872,
    lng: 100.7513,
    openTime: "11:00",
    closeTime: "22:00",
    category: "outlet",
    categoryLabel: "เอาท์เล็ต",
    status: "Active",
    floorCount: 1,
    storeCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    displayName: "Big C Rajdamri",
    name: "big-c-rajdamri",
    address: "97/11 ถนนราชดำริ แขวงลุมพินี เขตปทุมวัน กรุงเทพมหานคร 10330",
    district: "ปทุมวัน",
    phone: "02-250-4888",
    website: "https://www.bigc.co.th/branch/big-c-rajdamri",
    social: "",
    facebook: "",
    line: "",
    lat: 13.7482,
    lng: 100.5404,
    openTime: "09:00",
    closeTime: "23:00",
    category: "department-store",
    categoryLabel: "ห้างสรรพสินค้า",
    status: "Active",
    floorCount: 6,
    storeCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    displayName: "Big C Extra Ratchadaphisek",
    name: "big-c-extra-ratchadaphisek",
    address: "125 ถนนรัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพมหานคร 10400",
    district: "ดินแดง",
    phone: "02-645-1200",
    website: "https://www.bigc.co.th/branch/big-c-extra-ratchadaphisek",
    social: "",
    facebook: "",
    line: "",
    lat: 13.78443,
    lng: 100.56931,
    openTime: "09:00",
    closeTime: "24:00",
    category: "department-store",
    categoryLabel: "ห้างสรรพสินค้า",
    status: "Active",
    floorCount: 6,
    storeCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    displayName: "Lotus's Rama 4",
    name: "lotus-rama-4",
    address: "517 ถนนพระรามที่ 4 แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110",
    district: "คลองเตย",
    phone: "02-663-8888",
    website: "https://www.lotuss.com/branch/rama-4",
    social: "",
    facebook: "",
    line: "",
    lat: 13.7226,
    lng: 100.5644,
    openTime: "09:00",
    closeTime: "22:00",
    category: "department-store",
    categoryLabel: "ห้างสรรพสินค้า",
    status: "Active",
    floorCount: 7,
    storeCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    displayName: "Makro Sathorn",
    name: "makro-sathorn",
    address: "189 ถนนสาทรใต้ แขวงทุ่งมหาเมฆ เขตสาทร กรุงเทพมหานคร 10120",
    district: "สาทร",
    phone: "02-671-5050",
    website: "https://www.siammakro.co.th/",
    social: "https://www.facebook.com/MakroSathorn",
    facebook: "https://www.facebook.com/MakroSathorn",
    line: "",
    lat: 13.7225,
    lng: 100.5487,
    openTime: "06:00",
    closeTime: "22:00",
    category: "department-store",
    categoryLabel: "ห้างสรรพสินค้า",
    status: "Active",
    floorCount: 2,
    storeCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    displayName: "Esplanade Ratchada",
    name: "esplanade-ratchada",
    address: "99 ถนนรัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพมหานคร 10400",
    district: "ดินแดง",
    phone: "02-660-9000",
    website: "https://www.esplanade.co.th/",
    social: "https://www.facebook.com/EsplanadeRatchada",
    facebook: "https://www.facebook.com/EsplanadeRatchada",
    line: "",
    lat: 13.78016,
    lng: 100.56847,
    openTime: "10:00",
    closeTime: "22:00",
    category: "shopping-center",
    categoryLabel: "ศูนย์การค้า",
    status: "Active",
    floorCount: 5,
    storeCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    displayName: "Show DC Mall",
    name: "show-dc-mall",
    address: "99/6-9 ถนนพระราม 9 แขวงบางกะปิ เขตห้วยขวาง กรุงเทพมหานคร 10310",
    district: "ห้วยขวาง",
    phone: "02-111-5555",
    website: "http://www.showdc.co.th/",
    social: "https://www.facebook.com/showdc.co.th",
    facebook: "https://www.facebook.com/showdc.co.th",
    line: "",
    lat: 13.74837,
    lng: 100.56617,
    openTime: "10:00",
    closeTime: "22:00",
    category: "shopping-center",
    categoryLabel: "ศูนย์การค้า",
    status: "Active",
    floorCount: 5,
    storeCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    displayName: "Samyan Mitrtown",
    name: "samyan-mitrtown",
    address: "944 ถนนพระราม 4 แขวงวังใหม่ เขตปทุมวัน กรุงเทพมหานคร 10330",
    district: "ปทุมวัน",
    phone: "02-123-4567",
    website: "https://www.samyan-mitrtown.com/",
    social: "https://www.facebook.com/SamyanMitrtown",
    facebook: "https://www.facebook.com/SamyanMitrtown",
    line: "@samyanmitrtown",
    lat: 13.73359,
    lng: 100.53127,
    openTime: "10:00",
    closeTime: "22:00",
    category: "community-mall",
    categoryLabel: "คอมมูนิตี้มอลล์",
    status: "Active",
    floorCount: 6,
    storeCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
];

async function addMalls() {
  try {
    console.log('🚀 เริ่มเพิ่มข้อมูลห้างสรรพสินค้า...');
    
    for (const mall of malls) {
      console.log(`📝 เพิ่มข้อมูล: ${mall.displayName}`);
      
      const docRef = await addDoc(collection(db, 'malls'), mall);
      console.log(`✅ เพิ่มสำเร็จ: ${mall.displayName} (ID: ${docRef.id})`);
    }
    
    console.log('🎉 เพิ่มข้อมูลห้างสรรพสินค้าทั้งหมดสำเร็จ!');
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  }
}

// Run the function
addMalls();
