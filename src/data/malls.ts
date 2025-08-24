export type Mall = {
  id: string;
  name: string;
  address: string;
  city: string;
  postcode?: string;
  floors: number;             // จำนวนชั้นอาคาร (เหนือดิน)
  basements?: number;         // ชั้นใต้ดิน
  hours: { open: string; close: string };
  coords?: { lat: number; lng: number };

  // เพิ่ม field ด้านล่างเพื่อ "About / Facts"
  investmentTHB?: number;     // หน่วย: ล้านบาท
  siteAreaSqm?: number;       // พท.ทั้งโครงการ (ใส่ได้ถ้ามี)
  grossAreaSqm?: number;      // Gross area
  leasableAreaSqm?: number;   // Leasable area
  parkingSpaces?: number;     // ที่จอดรถ
  totalShops?: number;        // จำนวนร้านทั้งหมด (โดยประมาณ/ล่าสุด)
  anchors?: Array<{
    name: string;
    areaSqm?: number;
    notes?: string;
  }>;
  priceRange?: "฿" | "฿฿" | "฿฿฿" | "฿฿฿฿";

  // Contact / Social
  phone?: string;
  website?: string;
  socials?: {
    tiktok?: string;
    x?: string;            // Twitter/X
    instagram?: string;
    facebook?: string;
    line?: string;
    handle?: string;       // central_rama3
  };

  // คำอธิบายย่อ
  about?: string;
  
  // สำหรับการแสดงผล
  storesCount?: number;  // นับเฉพาะที่เรากรอกไว้ในเว็บ
  featured?: boolean;   // แนะนำ
};

export const malls: Mall[] = [
  // ----- Central Rama 3 (อัปเดตจากข้อมูลจริงที่คุณให้) -----
  {
    id: "central-rama-3",
    name: "เซ็นทรัล พระราม 3 (Central Rama 3)",
    address: "123/1 Rama 3 Road, Yan Nawa",
    city: "Bangkok",
    postcode: "10120",
    floors: 8,
    basements: 3,
    hours: { open: "10:00", close: "22:00" },
    coords: { lat: 13.6957, lng: 100.5362 },

    investmentTHB: 2500,            // ล้านบาท
    grossAreaSqm: 97772,            // จากข้อมูล: Gross Area 97,772 sq.m.
    leasableAreaSqm: 52777,         // Leasable area 52,777 sq.m.
    parkingSpaces: 2336,
    totalShops: 335,
    priceRange: "฿฿",

    anchors: [
      { name: "Central Department Store (CDS)", areaSqm: 32395 },
      { name: "Power Buy", areaSqm: 4270, notes: "ร่วมกับ Super Sports" },
      { name: "Super Sports", areaSqm: 4270, notes: "ร่วมกับ Power Buy" },
      { name: "Fitness First", areaSqm: 2340 },
      { name: "Tops Market" },
      { name: "Major Cineplex", notes: "9-screen + 38-lane Major Bowling" },
      { name: "IT City", areaSqm: 1030 },
      { name: "Siam Yamaha School", areaSqm: 1450 }
    ],

    phone: "02 103 5333",
    website: "http://www.centralrama3.com/",
    socials: {
      tiktok: "https://tiktok.com/@central.rama3",
      x: "https://x.com/Central_Rama3",
      handle: "central_rama3"
    },

    about:
      "ตั้งอยู่บนถนนรัชดาภิเษก ช่วงระหว่างแยกนางลิ้นจี่และแยกสาธุประดิษฐ์ รายล้อมด้วยออฟฟิศ คอนโด และธนาคาร โครงการลงทุน 2,500 ล้านบาท อาคาร 8 ชั้น + ใต้ดิน 3 ชั้น การเดินทางสะดวกจากสาทร สีลม สาธุประดิษฐ์ และสะพานหลัก (พระราม 9, กรุงเทพ, วงแหวนอุตสาหกรรม) รวมถึงทางด่วนของการทางพิเศษ",

    storesCount: 11,
    featured: true
  },

  {
    id: "siam-paragon",
    name: "สยามพารากอน",
    address: "991 Rama 1 Rd, Pathumwan",
    city: "Bangkok",
    postcode: "10330",
    floors: 7,
    hours: { open: "10:00", close: "22:00" },
    coords: { lat: 13.7466, lng: 100.5347 },
    storesCount: 2
  },

  // ----- The Mall Lifestore Bangkapi -----
  {
    id: "tm-bangkapi",
    name: "The Mall Lifestore Bangkapi",
    address: "แยกลำสาลี เขตบางกะปิ",
    city: "Bangkok",
    postcode: "10240",
    floors: 4,
    basements: 0,
    hours: { open: "10:00", close: "22:00" },
    coords: { lat: 13.7563, lng: 100.5018 },

    investmentTHB: 8000,
    grossAreaSqm: 80000,
    leasableAreaSqm: 40000,
    parkingSpaces: 800,
    totalShops: 80,
    priceRange: "฿฿",

    anchors: [
      { name: "MUJI", areaSqm: 2000, notes: "Lifestyle Store" },
      { name: "H&M", areaSqm: 1500, notes: "Fashion" },
      { name: "UNIQLO", areaSqm: 1500, notes: "Fashion" },
      { name: "SF Cinema", areaSqm: 3000, notes: "Movie Theater" },
      { name: "Fitness First", areaSqm: 2000, notes: "Fitness Center" }
    ],

    phone: "02-234-5678",
    website: "https://themalllifestore.com/branch/bangkapi",
    socials: {
      facebook: "https://facebook.com/themalllifestore",
      instagram: "https://instagram.com/themalllifestore",
      tiktok: "https://tiktok.com/@themalllifestore",
      x: "https://x.com/themalllifestore"
    },

    about: "The Mall Lifestore Bangkapi เป็นศูนย์การค้าไลฟ์สไตล์ที่ตั้งอยู่แยกลำสาลี เขตบางกะปิ เปิดให้บริการในปี 2560 มีพื้นที่รวมกว่า 80,000 ตารางเมตร ประกอบด้วยร้านค้าและบริการมากกว่า 80 ร้าน เน้นไลฟ์สไตล์และความสะดวกสบาย",

    storesCount: 17,
    featured: false
  },

  {
    id: "terminal-21-asok",
    name: "เทอร์มินอล 21",
    address: "88 Sukhumvit 19, Khlong Toei Nuea",
    city: "Bangkok",
    postcode: "10110",
    floors: 8,
    hours: { open: "10:00", close: "22:00" },
    coords: { lat: 13.7373, lng: 100.5600 },
    storesCount: 2
  }
];
