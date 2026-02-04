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
    floor?: string;
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
    priceRange: "฿฿฿",
    totalShops: 250,
    anchors: [
      { name: "Siam Paragon Department Store", notes: "Main Department Store" },
      { name: "Gourmet Market", floor: "G", notes: "Premium Supermarket" },
      { name: "SEA LIFE Bangkok Ocean World", floor: "B1-B2", notes: "Aquarium" },
      { name: "Paragon Cineplex", floor: "5", notes: "Cinema" },
      { name: "Kinokuniya", floor: "3", notes: "Bookstore" },
      { name: "Royal Paragon Hall", floor: "5", notes: "Exhibition Hall" }
    ],
    about: "ศูนย์การค้าระดับโลกใจกลางกรุงเทพฯ รวบรวมแบรนด์เนมชั้นนำ ร้านอาหารระดับมิชลิน และความบันเทิงครบวงจร ทั้ง Sea Life Bangkok Ocean World และ Paragon Cineplex",
    storesCount: 10,
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
    name: "เทอร์มินอล 21 อโศก",
    address: "88 Sukhumvit 19, Watthana",
    city: "Bangkok",
    postcode: "10110",
    floors: 9,
    hours: { open: "10:00", close: "22:00" },
    coords: { lat: 13.7373, lng: 100.5600 },
    priceRange: "฿฿",
    totalShops: 600,
    anchors: [
      { name: "Pier 21", floor: "5", notes: "Food Court" },
      { name: "SF Cinema City", floor: "6", notes: "Cinema" },
      { name: "Gourmet Market", floor: "LG", notes: "Supermarket" },
      { name: "Fitness First", floor: "6", notes: "Fitness" },
      { name: "H&M", floor: "M", notes: "Fashion" }
    ],
    about: "ศูนย์การค้าธีม world market street ที่จำลองบรรยากาศเมืองดังทั่วโลกมาไว้ในที่เดียว โดดเด่นด้วยบันไดเลื่อนที่ยาวที่สุด",
    storesCount: 10,
    featured: true
  },
  {
    id: "central-world",
    name: "เซ็นทรัลเวิลด์",
    address: "999/9 Rama I Rd, Pathum Wan",
    city: "Bangkok",
    postcode: "10330",
    floors: 8,
    hours: { open: "10:00", close: "22:00" },
    coords: { lat: 13.7469, lng: 100.5398 },
    priceRange: "฿฿฿",
    totalShops: 500,
    anchors: [
      { name: "Central Department Store", notes: "Department Store" },
      { name: "SF World Cinema", floor: "7", notes: "Cinema" },
      { name: "Tops Food Hall", floor: "7", notes: "Supermarket" },
      { name: "Apple Central World", floor: "1-2", notes: "Tech" },
      { name: "UNIQLO", floor: "3", notes: "Fashion" },
      { name: "Kinokuniya", floor: "6", notes: "Bookstore" }
    ],
    about: "ไลฟ์สไตล์เดสติเนชั่นระดับโลกที่รวบรวมแฟล็กชิพสโตร์ของแบรนด์ดังทั่วโลก ร้านอาหาร คาเฟ่ และพื้นที่กิจกรรมต่างๆ ไว้ในที่เดียว",
    storesCount: 10,
    featured: true
  },
  {
    id: "iconsiam",
    name: "ไอคอนสยาม",
    address: "299 Charoen Nakhon Rd",
    city: "Bangkok",
    postcode: "10600",
    floors: 8,
    hours: { open: "10:00", close: "22:00" },
    coords: { lat: 13.7267, lng: 100.5105 },
    priceRange: "฿฿฿฿",
    totalShops: 500,
    anchors: [
      { name: "Siam Takashimaya", floor: "G-4", notes: "Department Store" },
      { name: "Apple ICONSIAM", floor: "2", notes: "Tech" },
      { name: "ICONLUXE", floor: "M-1", notes: "Luxury" },
      { name: "SOOKSIAM", floor: "G", notes: "Thai Market" },
      { name: "Dear Tummy", floor: "G", notes: "Supermarket" }
    ],
    about: "แลนด์มาร์คระดับโลกริมแม่น้ำเจ้าพระยา ที่รวบรวมสิ่งที่ดีที่สุดของไทยและสิ่งที่ดีที่สุดของโลกเข้าไว้ด้วยกัน",
    storesCount: 10,
    featured: true
  },
  {
    id: "emquartier",
    name: "เอ็มควอเทียร์",
    address: "693 Sukhumvit Rd, Watthana",
    city: "Bangkok",
    postcode: "10110",
    floors: 9,
    hours: { open: "10:00", close: "22:00" },
    coords: { lat: 13.7315, lng: 100.5692 },
    priceRange: "฿฿฿฿",
    totalShops: 400,
    anchors: [
      { name: "The Glass Quartier", notes: "Luxury Brands" },
      { name: "The Helix Quartier", notes: "Dining" },
      { name: "The Waterfall Quartier", notes: "Fashion & Lifestyle" },
      { name: "Quartier CineArt", floor: "4", notes: "Cinema" },
      { name: "Gourmet Market", floor: "G", notes: "Supermarket" },
      { name: "Virgin Active", floor: "4-5", notes: "Fitness" }
    ],
    about: "ศูนย์การค้าไลฟ์สไตล์ระดับโลกใจกลางสุขุมวิท โดดเด่นด้วยดีไซน์สถาปัตยกรรมล้ำสมัยและสวนลอยฟ้า",
    storesCount: 10,
    featured: true
  },
  {
    id: "siam-center",
    name: "สยามเซ็นเตอร์",
    address: "979 Rama I Rd, Pathum Wan",
    city: "Bangkok",
    postcode: "10330",
    floors: 4,
    hours: { open: "10:00", close: "22:00" },
    coords: { lat: 13.7462, lng: 100.5326 },
    priceRange: "฿฿",
    totalShops: 200,
    anchors: [
      { name: "Sephora", floor: "1", notes: "Beauty" },
      { name: "Adidas Originals", floor: "G", notes: "Sportswear" },
      { name: "Nike Bangkok", floor: "G", notes: "Sportswear" },
      { name: "JD Sports", floor: "G", notes: "Sportswear" },
      { name: "Social Facebook", floor: "1", notes: "Tech" }
    ],
    about: "The Ideaopolis เมืองแห่งไอเดียที่ล้ำเทรนด์ ศูนย์รวมแบรนด์แฟชั่นและไลฟ์สไตล์ระดับโลก",
    storesCount: 10,
    featured: false
  },
  {
    id: "siam-discovery",
    name: "สยามดิสคัฟเวอรี่",
    address: "989 Rama I Rd, Pathum Wan",
    city: "Bangkok",
    postcode: "10330",
    floors: 5,
    hours: { open: "10:00", close: "22:00" },
    coords: { lat: 13.7467, lng: 100.5315 },
    priceRange: "฿฿฿",
    totalShops: 150,
    anchors: [
      { name: "Loft", floor: "2", notes: "Lifestyle" },
      { name: "Madame Tussauds", floor: "4-5", notes: "Museum" },
      { name: "Virgin Active", floor: "5", notes: "Fitness" },
      { name: "Ecotopia", floor: "3", notes: "Eco Zone" },
      { name: "Club 21", floor: "G", notes: "Fashion" }
    ],
    about: "The Exploratorium สนามทดลองพลังอำนาจแห่งความคิดสร้างสรรค์ มอบประสบการณ์แบบ Hybrid Retail",
    storesCount: 10,
    featured: false
  },
  {
    id: "central-embassy",
    name: "เซ็นทรัล เอ็มบาสซี",
    address: "1031 Phloen Chit Rd, Pathum Wan",
    city: "Bangkok",
    postcode: "10330",
    floors: 6,
    hours: { open: "10:00", close: "22:00" },
    coords: { lat: 13.7438, lng: 100.5464 },
    priceRange: "฿฿฿฿",
    totalShops: 200,
    anchors: [
      { name: "Eathai", floor: "LG", notes: "Thai Market" },
      { name: "Open House", floor: "6", notes: "Co-living Space" },
      { name: "Embassy Diplomat Screens", floor: "6", notes: "Cinema" },
      { name: "Siwilai City Club", floor: "5", notes: "Dining" },
      { name: "Park Hyatt Bangkok", notes: "Hotel" }
    ],
    about: "Ultra-Luxury Lifestyle Mall ที่โดดเด่นด้วยสถาปัตยกรรมระดับโลก รวบรวมแบรนด์หรูและร้านอาหารชั้นนำ",
    storesCount: 10,
    featured: true
  },
  {
    id: "central-chidlom",
    name: "เซ็นทรัล ชิดลม",
    address: "1027 Phloen Chit Rd, Pathum Wan",
    city: "Bangkok",
    postcode: "10330",
    floors: 7,
    hours: { open: "10:00", close: "22:00" },
    coords: { lat: 13.7445, lng: 100.5447 },
    priceRange: "฿฿฿",
    totalShops: 300,
    anchors: [
      { name: "Central Department Store", notes: "Flagship Store" },
      { name: "Tops Food Hall", floor: "G", notes: "Supermarket" },
      { name: "Lofter", floor: "7", notes: "Food Court" },
      { name: "Luxe Galerie", floor: "1", notes: "Luxury Zone" },
      { name: "Public Market", floor: "2", notes: "Food & Lifestyle" }
    ],
    about: "The Store of Bangkok ห้างสรรพสินค้าแฟล็กชิพของกลุ่มเซ็นทรัล ที่เป็นจุดหมายปลายทางของนักช้อปมายาวนาน",
    storesCount: 10,
    featured: true
  }
];
