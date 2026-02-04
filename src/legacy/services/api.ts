// ============ [MALL METADATA] ============
// ข้อมูลห้างสรรพสินค้า

export const MALLS_META = {
  "central-rama-3": {
    id: "central-rama-3",
    nameTH: "เซ็นทรัล พระราม 3",
    nameEN: "Central Rama 3",
    description: "ห้างสรรพสินค้าชั้นนำในย่านพระราม 3 ใกล้ BTS พระราม 9 และ MRT พระราม 9",
    address: "123/1 Rama 3 Road, Yan Nawa, Bangkok 10120",
    phone: "02-123-4567",
    website: "https://www.central.co.th/rama3",
    hours: "10:00 - 22:00",
    floors: ["B", "G", "1", "2", "3", "4", "5", "6"],
    coordinates: {
      lat: 13.6891,
      lng: 100.5131
    },
    image: "/src/assets/logo-horizontal.svg",
    features: ["parking", "wifi", "atm", "restroom", "food-court", "cinema"],
    published: true,
    order: 1
  },
  "siam-paragon": {
    id: "siam-paragon",
    nameTH: "สยามพารากอน",
    nameEN: "Siam Paragon",
    description: "ห้างสรรพสินค้าลักซ์ชัวรี่ชั้นนำของไทย",
    address: "991 Rama 1 Road, Pathumwan, Bangkok 10330",
    phone: "02-610-8000",
    website: "https://www.siamparagon.co.th",
    hours: "10:00 - 22:00",
    floors: ["B", "G", "1", "2", "3", "4", "5"],
    coordinates: {
      lat: 13.7466,
      lng: 100.5347
    },
    image: "/src/assets/logo-horizontal.svg",
    features: ["parking", "wifi", "atm", "restroom", "cinema"],
    published: true,
    order: 2
  },
  "terminal-21": {
    id: "terminal-21",
    nameTH: "เทอร์มินอล 21",
    nameEN: "Terminal 21",
    description: "ห้างสรรพสินค้าแนวสนามบินนานาชาติ",
    address: "88 Sukhumvit 19, Khlong Toei Nuea, Bangkok 10110",
    phone: "02-108-0888",
    website: "https://www.terminal21.co.th",
    hours: "10:00 - 22:00",
    floors: ["LG", "G", "1", "2", "3", "4", "5", "6"],
    coordinates: {
      lat: 13.7388,
      lng: 100.5603
    },
    image: "/src/assets/logo-horizontal.svg",
    features: ["parking", "wifi", "atm", "restroom"],
    published: true,
    order: 3
  },
  "tm-bangkapi": {
    id: "tm-bangkapi",
    nameTH: "The Mall Lifestore Bangkapi",
    nameEN: "The Mall Lifestore Bangkapi",
    description: "ศูนย์การค้าไลฟ์สไตล์ที่แยกลำสาลี",
    address: "แยกลำสาลี เขตบางกะปิ, Bangkok",
    phone: "02-234-5678",
    website: "https://themalllifestore.com/branch/bangkapi",
    hours: "10:00 - 22:00",
    floors: ["G", "M", "1", "2", "3"],
    coordinates: {
      lat: 13.7563,
      lng: 100.5018
    },
    image: "/src/assets/logo-horizontal.svg",
    features: ["parking", "wifi", "atm", "restroom", "cinema", "fitness"],
    published: true,
    order: 4
  }
};

// ============ [STORES BY MALL] ============
// ร้านค้าในแต่ละห้าง

export const STORES_BY_MALL = {
  "central-rama-3": [
    {
      id: "zara-central-rama3",
      name: "Zara",
      nameEN: "Zara",
      floor: "2",
      unit: "2-22",
      category: "แฟชั่น",
      hours: "10:00 - 22:00",
      phone: "02-123-4567",
      website: "https://www.zara.com/th",
      facebook: "https://facebook.com/zara",
      instagram: "https://instagram.com/zara",
      tags: ["clothing", "fashion", "New Collection", "Sale"],
      description: "แบรนด์แฟชั่นสเปนชั้นนำ เน้นสไตล์ทันสมัยและคุณภาพดี",
      shortDesc: "แบรนด์แฟชั่นสเปนชั้นนำ",
      features: ["fitting-room", "alteration"],
      published: true,
      order: 1
    },
    {
      id: "uniqlo-central-rama3",
      name: "Uniqlo",
      nameEN: "Uniqlo",
      floor: "2",
      unit: "2-15",
      category: "แฟชั่น",
      hours: "10:00 - 22:00",
      phone: "02-123-4568",
      website: "https://www.uniqlo.co.th",
      facebook: "https://facebook.com/uniqlothailand",
      instagram: "https://instagram.com/uniqlothailand",
      tags: ["clothing", "japanese", "casual", "basic"],
      description: "แบรนด์แฟชั่นญี่ปุ่นเน้นเสื้อผ้าพื้นฐานคุณภาพดี",
      shortDesc: "แบรนด์แฟชั่นญี่ปุ่นคุณภาพดี",
      features: ["fitting-room", "alteration"],
      published: true,
      order: 2
    },
    {
      id: "hm-central-rama3",
      name: "H&M",
      nameEN: "H&M",
      floor: "2",
      unit: "2-18",
      category: "แฟชั่น",
      hours: "10:00 - 22:00",
      phone: "02-123-4569",
      website: "https://www.hm.com/th",
      facebook: "https://facebook.com/hm",
      instagram: "https://instagram.com/hm",
      tags: ["clothing", "fashion", "Fast Fashion", "Sustainable"],
      description: "แฟชั่นราคาประหยัดคุณภาพดี เน้นความยั่งยืน",
      shortDesc: "แฟชั่นราคาประหยัดคุณภาพดี",
      features: ["fitting-room", "recycling"],
      published: true,
      order: 3
    },
    {
      id: "starbucks-central-rama3",
      name: "Starbucks",
      nameEN: "Starbucks",
      floor: "1",
      unit: "1-05",
      category: "คาเฟ่",
      hours: "07:00 - 22:00",
      phone: "02-123-4569",
      website: "https://www.starbucks.co.th",
      facebook: "https://facebook.com/starbucksthailand",
      instagram: "https://instagram.com/starbucksthailand",
      tags: ["coffee", "cafe", "WiFi"],
      description: "กาแฟสัญชาติอเมริกัน เน้นคุณภาพและประสบการณ์การดื่มกาแฟ",
      shortDesc: "กาแฟสัญชาติอเมริกัน",
      features: ["wifi", "outdoor-seating"],
      published: true,
      order: 4
    },
    {
      id: "mk-restaurant-central-rama3",
      name: "MK Restaurant",
      nameEN: "MK Restaurant",
      floor: "6",
      unit: "6-01",
      category: "ร้านอาหาร",
      hours: "10:00 - 22:00",
      phone: "02-123-4570",
      website: "https://www.mkrestaurant.com",
      facebook: "https://facebook.com/mkrestaurant",
      instagram: "https://instagram.com/mkrestaurant",
      tags: ["suki", "hotpot", "thai", "family"],
      description: "ร้านสุกี้ในตำนาน น้ำจิ้มสูตรลับ เน้นคุณภาพและรสชาติ",
      shortDesc: "ร้านสุกี้ในตำนาน",
      features: ["family-friendly", "private-room"],
      published: true,
      order: 5
    },
    {
      id: "shabushi-central-rama3",
      name: "Shabushi",
      nameEN: "Shabushi",
      floor: "6",
      unit: "6-02",
      category: "ร้านอาหาร",
      hours: "10:00 - 21:00",
      phone: "02-123-4571",
      website: "https://www.shabushi.co.th",
      facebook: "https://facebook.com/shabushi",
      instagram: "https://instagram.com/shabushi",
      tags: ["shabu", "sushi", "buffet", "japanese"],
      description: "บุฟเฟ่ต์สายพาน ซูชิ+ชาบู วัตถุดิบคุณภาพ",
      shortDesc: "บุฟเฟ่ต์สายพาน ซูชิ+ชาบู",
      features: ["buffet", "conveyor-belt"],
      published: true,
      order: 6
    },
    {
      id: "mo-mo-paradise-central-rama3",
      name: "Mo-Mo-Paradise",
      nameEN: "Mo-Mo-Paradise",
      floor: "6",
      unit: "6-03",
      category: "ร้านอาหาร",
      hours: "11:00 - 21:00",
      phone: "02-123-4572",
      website: "https://www.momoparadise.co.th",
      facebook: "https://facebook.com/momoparadise",
      instagram: "https://instagram.com/momoparadise",
      tags: ["shabu", "japanese", "buffet", "premium"],
      description: "วัตถุดิบคุณภาพ เนื้อวัวออสเตรเลีย/วากิว",
      shortDesc: "ชาบูคุณภาพสูง",
      features: ["buffet", "premium-meat"],
      published: true,
      order: 7
    },
    {
      id: "swensens-central-rama3",
      name: "Swensen's",
      nameEN: "Swensen's",
      floor: "1",
      unit: "1-12",
      category: "ร้านของหวาน",
      hours: "10:00 - 21:00",
      phone: "02-123-4573",
      website: "https://www.swensens.co.th",
      facebook: "https://facebook.com/swensensthailand",
      instagram: "https://instagram.com/swensensthailand",
      tags: ["ice-cream", "dessert", "Ice Cream", "Dessert"],
      description: "ร้านไอศกรีมยอดนิยม เน้นรสชาติและคุณภาพ",
      shortDesc: "ร้านไอศกรีมยอดนิยม",
      features: ["takeaway", "dine-in"],
      published: true,
      order: 8
    },
    {
      id: "boots-central-rama3",
      name: "Boots",
      nameEN: "Boots",
      floor: "1",
      unit: "1-08",
      category: "เครื่องสำอาง",
      hours: "10:00 - 22:00",
      phone: "02-123-4574",
      website: "https://www.boots.co.th",
      facebook: "https://facebook.com/bootsthailand",
      instagram: "https://instagram.com/bootsthailand",
      tags: ["beauty", "pharmacy", "Beauty", "Pharmacy"],
      description: "ร้านขายยาและเครื่องสำอาง เน้นคุณภาพและความปลอดภัย",
      shortDesc: "ร้านขายยาและเครื่องสำอาง",
      features: ["pharmacy", "beauty-consultation"],
      published: true,
      order: 9
    },
    {
      id: "aiiz-central-rama3",
      name: "AIIZ",
      nameEN: "AIIZ",
      floor: "1",
      unit: "1-10",
      category: "แฟชั่น",
      hours: "10:00 - 22:00",
      phone: "02-123-4575",
      website: "https://www.aiiz.com",
      facebook: "https://www.facebook.com/AIIZThailand",
      instagram: "https://www.instagram.com/aiiz_official/",
      tags: ["fashion", "clothing", "fleur collection", "Fashion", "FLEUR COLLECTION"],
      description: "สายเกาถูกใจสิ่งนี้! 3 สไตล์คิ้วท์ ๆ จาก FLEUR COLLECTION — ชอปคอลเลกชันใหม่ได้แล้ววันนี้ที่ร้าน AIIZ ชั้น 1 เซ็นทรัล พระราม 3",
      shortDesc: "แบรนด์แฟชั่นสไตล์คิ้วท์",
      features: ["fitting-room", "new-collection"],
      published: true,
      order: 10
    },
    {
      id: "mikimaki-central-rama3",
      name: "MIKIMAKI",
      nameEN: "MIKIMAKI",
      floor: "6",
      unit: "6-04",
      category: "ร้านอาหาร",
      hours: "10:00 - 22:00",
      phone: "02-123-4576",
      website: "https://www.mikimaki.com",
      facebook: "https://facebook.com/mikimaki",
      instagram: "https://instagram.com/mikimaki",
      tags: ["sushi", "japanese", "food patio", "premium-on-budget"],
      description: "🍣 เปิดแล้ว! MIKIMAKI ซูชิคุณภาพพรีเมียมในราคาสบายกระเป๋า เริ่มต้นเพียง 15 บาท อร่อยพรีเมียมแบบเข้าถึงได้ เจแปนฟู้ดเลิฟเวอร์ต้องห้ามพลาด 😋🇯🇵 — ชั้น 6 โซน Food Patio เซ็นทรัล พระราม 3",
      shortDesc: "ซูชิคุณภาพพรีเมียม ในราคาสบายกระเป๋าเริ่มต้น 15 บาท",
      features: ["takeaway", "premium-quality"],
      priceRange: "เริ่มต้น 15 บาท",
      status: "Open now",
      badges: ["เปิดใหม่", "คุ้มค่า"],
      hashtags: ["#CentralRama3", "#เซ็นทรัลพระราม3", "#FoodPatio", "#MIKIMAKI", "#ซูชิ"],
      zone: "Food Patio",
      published: true,
      order: 11
    }
  ],
  "siam-paragon": [
    {
      id: "gucci-siam-paragon",
      name: "Gucci",
      nameEN: "Gucci",
      floor: "1",
      unit: "1-01",
      category: "แฟชั่น",
      hours: "10:00 - 22:00",
      phone: "02-610-8001",
      website: "https://www.gucci.com",
      facebook: "https://facebook.com/gucci",
      instagram: "https://instagram.com/gucci",
      tags: ["luxury", "designer", "Luxury", "Designer"],
      description: "แบรนด์ลักซ์ชัวรี่ชั้นนำจากอิตาลี",
      shortDesc: "แบรนด์ลักซ์ชัวรี่ชั้นนำจากอิตาลี",
      features: ["personal-shopper", "alteration"],
      published: true,
      order: 1
    },
    {
      id: "louis-vuitton-siam-paragon",
      name: "Louis Vuitton",
      nameEN: "Louis Vuitton",
      floor: "1",
      unit: "1-02",
      category: "แฟชั่น",
      hours: "10:00 - 22:00",
      phone: "02-610-8002",
      website: "https://www.louisvuitton.com",
      facebook: "https://facebook.com/louisvuitton",
      instagram: "https://instagram.com/louisvuitton",
      tags: ["luxury", "leather", "Luxury", "Leather"],
      description: "แบรนด์กระเป๋าลักซ์ชัวรี่ชั้นนำ",
      shortDesc: "แบรนด์กระเป๋าลักซ์ชัวรี่ชั้นนำ",
      features: ["personal-shopper", "monogramming"],
      published: true,
      order: 2
    }
  ],
  "terminal-21": [
    {
      id: "uniqlo-terminal21",
      name: "Uniqlo",
      nameEN: "Uniqlo",
      floor: "2",
      unit: "2-01",
      category: "แฟชั่น",
      hours: "10:00 - 22:00",
      phone: "02-108-0881",
      website: "https://www.uniqlo.co.th",
      facebook: "https://facebook.com/uniqlothailand",
      instagram: "https://instagram.com/uniqlothailand",
      tags: ["clothing", "japanese", "Japanese", "Casual"],
      description: "แบรนด์แฟชั่นญี่ปุ่นคุณภาพดี",
      shortDesc: "แบรนด์แฟชั่นญี่ปุ่นคุณภาพดี",
      features: ["fitting-room", "alteration"],
      published: true,
      order: 1
    },
    {
      id: "muji-terminal21",
      name: "MUJI",
      nameEN: "MUJI",
      floor: "3",
      unit: "3-05",
      category: "ไลฟ์สไตล์",
      hours: "10:00 - 22:00",
      phone: "02-108-0882",
      website: "https://www.muji.com/th",
      facebook: "https://facebook.com/mujithailand",
      instagram: "https://instagram.com/mujithailand",
      tags: ["lifestyle", "japanese", "Japanese", "Minimalist"],
      description: "สินค้าไลฟ์สไตล์แนวมินิมอล",
      shortDesc: "สินค้าไลฟ์สไตล์แนวมินิมอล",
      features: ["cafe", "stationery"],
      published: true,
      order: 2
    }
  ],
  "tm-bangkapi": [
    // Anchor stores from floors
    {
      id: "g-gourmet-eats",
      name: "Gourmet Eats",
      nameEN: "Gourmet Eats",
      floor: "G",
      unit: "G-01",
      category: "Dining",
      hours: "10:00 - 22:00",
      phone: "",
      website: "",
      facebook: "",
      instagram: "",
      tags: ["dining", "food", "Anchor"],
      description: "Gourmet Eats - Dining",
      shortDesc: "Gourmet Eats",
      features: ["Dining"],
      published: true,
      order: 1
    },
    {
      id: "g-gourmet-market",
      name: "Gourmet Market",
      nameEN: "Gourmet Market",
      floor: "G",
      unit: "G-02",
      category: "Supermarket",
      hours: "10:00 - 22:00",
      phone: "",
      website: "",
      facebook: "",
      instagram: "",
      tags: ["supermarket", "food", "Anchor"],
      description: "Gourmet Market - Supermarket",
      shortDesc: "Gourmet Market",
      features: ["Supermarket"],
      published: true,
      order: 2
    },
    {
      id: "g-take-home-zone",
      name: "Take Home Zone",
      nameEN: "Take Home Zone",
      floor: "G",
      unit: "G-03",
      category: "Dining",
      hours: "10:00 - 22:00",
      phone: "",
      website: "",
      facebook: "",
      instagram: "",
      tags: ["dining", "food", "Anchor"],
      description: "Take Home Zone - Dining",
      shortDesc: "Take Home Zone",
      features: ["Dining"],
      published: true,
      order: 3
    },
    {
      id: "g-aiiz",
      name: "AIIZ",
      nameEN: "AIIZ",
      floor: "G",
      unit: "G-04",
      category: "Fashion",
      hours: "10:00 - 22:00",
      phone: "",
      website: "",
      facebook: "",
      instagram: "",
      tags: ["fashion", "clothing", "Anchor"],
      description: "AIIZ - Fashion",
      shortDesc: "AIIZ",
      features: ["Fashion"],
      published: true,
      order: 4
    },
    {
      id: "m-muji",
      name: "MUJI",
      nameEN: "MUJI",
      floor: "M",
      unit: "M-01",
      category: "Lifestyle",
      hours: "10:00 - 22:00",
      phone: "",
      website: "",
      facebook: "",
      instagram: "",
      tags: ["lifestyle", "japanese", "Anchor"],
      description: "MUJI - Lifestyle",
      shortDesc: "MUJI",
      features: ["Lifestyle"],
      published: true,
      order: 5
    },
    {
      id: "m-hm",
      name: "H&M",
      nameEN: "H&M",
      floor: "M",
      unit: "M-02",
      category: "Fashion",
      hours: "10:00 - 22:00",
      phone: "",
      website: "",
      facebook: "",
      instagram: "",
      tags: ["fashion", "clothing", "Anchor"],
      description: "H&M - Fashion",
      shortDesc: "H&M",
      features: ["Fashion"],
      published: true,
      order: 6
    },
    {
      id: "m-uniqlo",
      name: "UNIQLO",
      nameEN: "UNIQLO",
      floor: "M",
      unit: "M-03",
      category: "Fashion",
      hours: "10:00 - 22:00",
      phone: "",
      website: "",
      facebook: "",
      instagram: "",
      tags: ["fashion", "clothing", "Anchor"],
      description: "UNIQLO - Fashion",
      shortDesc: "UNIQLO",
      features: ["Fashion"],
      published: true,
      order: 7
    },
    {
      id: "m-watch-optical-galleria",
      name: "Watch/Optical Galleria",
      nameEN: "Watch/Optical Galleria",
      floor: "M",
      unit: "M-04",
      category: "Optical",
      hours: "10:00 - 22:00",
      phone: "",
      website: "",
      facebook: "",
      instagram: "",
      tags: ["optical", "watches", "Anchor"],
      description: "Watch/Optical Galleria - Optical",
      shortDesc: "Watch/Optical Galleria",
      features: ["Optical"],
      published: true,
      order: 8
    },
    {
      id: "m-lingerie-zone",
      name: "Lingerie Zone",
      nameEN: "Lingerie Zone",
      floor: "M",
      unit: "M-05",
      category: "Fashion",
      hours: "10:00 - 22:00",
      phone: "",
      website: "",
      facebook: "",
      instagram: "",
      tags: ["fashion", "lingerie", "Anchor"],
      description: "Lingerie Zone - Fashion",
      shortDesc: "Lingerie Zone",
      features: ["Fashion"],
      published: true,
      order: 9
    },
    {
      id: "1-sports-mall",
      name: "Sports Mall",
      nameEN: "Sports Mall",
      floor: "1",
      unit: "1-01",
      category: "Sport",
      hours: "10:00 - 22:00",
      phone: "",
      website: "",
      facebook: "",
      instagram: "",
      tags: ["sport", "fitness", "Anchor"],
      description: "Sports Mall - Sport",
      shortDesc: "Sports Mall",
      features: ["Sport"],
      published: true,
      order: 10
    },
    {
      id: "1-betrend",
      name: "Betrend",
      nameEN: "Betrend",
      floor: "1",
      unit: "1-02",
      category: "Lifestyle",
      hours: "10:00 - 22:00",
      phone: "",
      website: "",
      facebook: "",
      instagram: "",
      tags: ["lifestyle", "trendy", "Anchor"],
      description: "Betrend - Lifestyle",
      shortDesc: "Betrend",
      features: ["Lifestyle"],
      published: true,
      order: 11
    },
    {
      id: "1-mens-fashion-zone",
      name: "Men's Fashion Zone",
      nameEN: "Men's Fashion Zone",
      floor: "1",
      unit: "1-03",
      category: "Fashion",
      hours: "10:00 - 22:00",
      phone: "",
      website: "",
      facebook: "",
      instagram: "",
      tags: ["fashion", "mens", "Anchor"],
      description: "Men's Fashion Zone - Fashion",
      shortDesc: "Men's Fashion Zone",
      features: ["Fashion"],
      published: true,
      order: 12
    },
    {
      id: "2-power-mall",
      name: "Power Mall",
      nameEN: "Power Mall",
      floor: "2",
      unit: "2-01",
      category: "Electronics",
      hours: "10:00 - 22:00",
      phone: "",
      website: "",
      facebook: "",
      instagram: "",
      tags: ["electronics", "technology", "Anchor"],
      description: "Power Mall - Electronics",
      shortDesc: "Power Mall",
      features: ["Electronics"],
      published: true,
      order: 13
    },
    {
      id: "2-the-living",
      name: "The Living",
      nameEN: "The Living",
      floor: "2",
      unit: "2-02",
      category: "Home & Living",
      hours: "10:00 - 22:00",
      phone: "",
      website: "",
      facebook: "",
      instagram: "",
      tags: ["home", "living", "Anchor"],
      description: "The Living - Home & Living",
      shortDesc: "The Living",
      features: ["Home & Living"],
      published: true,
      order: 14
    },
    {
      id: "3-sf-cinema",
      name: "SF Cinema",
      nameEN: "SF Cinema",
      floor: "3",
      unit: "3-01",
      category: "Entertainment",
      hours: "10:00 - 22:00",
      phone: "",
      website: "",
      facebook: "",
      instagram: "",
      tags: ["entertainment", "cinema", "Anchor"],
      description: "SF Cinema - Entertainment",
      shortDesc: "SF Cinema",
      features: ["Entertainment"],
      published: true,
      order: 15
    },
    {
      id: "3-harborland",
      name: "HarborLand",
      nameEN: "HarborLand",
      floor: "3",
      unit: "3-02",
      category: "Kids & Edutainment",
      hours: "10:00 - 22:00",
      phone: "",
      website: "",
      facebook: "",
      instagram: "",
      tags: ["kids", "edutainment", "Anchor"],
      description: "HarborLand - Kids & Edutainment",
      shortDesc: "HarborLand",
      features: ["Kids & Edutainment"],
      published: true,
      order: 16
    },
    {
      id: "3-fitness-first",
      name: "Fitness First",
      nameEN: "Fitness First",
      floor: "3",
      unit: "3-03",
      category: "Fitness",
      hours: "10:00 - 22:00",
      phone: "",
      website: "",
      facebook: "",
      instagram: "",
      tags: ["fitness", "gym", "Anchor"],
      description: "Fitness First - Fitness",
      shortDesc: "Fitness First",
      features: ["Fitness"],
      published: true,
      order: 17
    }
  ]
};

// ============ [FLOOR PINS] ============
// ตำแหน่งร้านบนผังชั้น

export const FLOOR_PINS = {
  "central-rama-3-2": {
    "zara-central-rama3": { cx: 300, cy: 180 },
    "uniqlo-central-rama3": { cx: 400, cy: 180 },
    "hm-central-rama3": { cx: 500, cy: 180 }
  },
  "central-rama-3-1": {
    "starbucks-central-rama3": { cx: 120, cy: 250 },
    "swensens-central-rama3": { cx: 180, cy: 250 },
    "boots-central-rama3": { cx: 220, cy: 200 },
    "aiiz-central-rama3": { cx: 220, cy: 150 }
  },
  "central-rama-3-6": {
    "mk-restaurant-central-rama3": { cx: 200, cy: 150 },
    "shabushi-central-rama3": { cx: 300, cy: 150 },
    "mo-mo-paradise-central-rama3": { cx: 400, cy: 150 },
    "mikimaki-central-rama3": { cx: 560, cy: 260 }
  },
  "siam-paragon-1": {
    "gucci-siam-paragon": { cx: 100, cy: 100 },
    "louis-vuitton-siam-paragon": { cx: 150, cy: 100 }
  },
  "terminal-21-2": {
    "uniqlo-terminal21": { cx: 200, cy: 150 }
  },
  "terminal-21-3": {
    "muji-terminal21": { cx: 250, cy: 200 }
  }
};

// ============ [UTILITY FUNCTIONS] ============

export function getMalls() {
  return Object.values(MALLS_META);
}

export function getMallById(_mallId: string) {
  return MALLS_META[mallId as keyof typeof MALLS_META];
}

export function getStores(_mallId: string, filters?: {
  category?: string;
  floor?: string;
  openNow?: boolean;
  search?: string;
}) {
  let stores = STORES_BY_MALL[mallId as keyof typeof STORES_BY_MALL] || [];
  
  if (filters) {
    if (filters.category) {
      stores = stores.filter(store => store.category === filters.category);
    }
    if (filters.floor) {
      stores = stores.filter(store => store.floor === filters.floor);
    }
    if (filters.openNow !== undefined) {
      // Simple open/close logic based on current time
      const now = new Date();
      const currentHour = now.getHours();
      stores = stores.filter(store => {
        const [openHour] = store.hours.split(' - ')[0].split(':').map(Number);
        const [closeHour] = store.hours.split(' - ')[1].split(':').map(Number);
        return currentHour >= openHour && currentHour < closeHour;
      });
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      stores = stores.filter(store => 
        store.name.toLowerCase().includes(searchLower) ||
        store.nameEN.toLowerCase().includes(searchLower) ||
        store.category.toLowerCase().includes(searchLower) ||
        store.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
  }
  
  return stores;
}

export function getStoreById(storeId: string) {
  for (const mallStores of Object.values(STORES_BY_MALL)) {
    const store = mallStores.find(s => s.id === storeId);
    if (store) return store;
  }
  return null;
}

export function getFloors(_mallId: string) {
  const mall = MALLS_META[mallId as keyof typeof MALLS_META];
  if (!mall) return [];
  
  return mall.floors.map(floor => ({
    id: floor,
    name: floor === "G" ? "Ground Floor" : floor === "B" ? "Basement" : `Floor ${floor}`,
    mall_id: mallId,
    image: `/src/assets/logo-horizontal.svg`,
    published: true,
    order: mall.floors.indexOf(floor)
  }));
}

export function getFloorPins(_mallId: string, floorId: string) {
  const key = `${mallId}-${floorId}`;
  return FLOOR_PINS[key as keyof typeof FLOOR_PINS] || {};
}

export function searchBrands(brandName: string) {
  const results: Array<{
    store: unknown;
    mall: unknown;
  }> = [];
  
  Object.entries(STORES_BY_MALL).forEach(([mallId, stores]) => {
    const mall = MALLS_META[mallId as keyof typeof MALLS_META];
    stores.forEach(store => {
      if (store.name.toLowerCase().includes(brandName.toLowerCase()) ||
          store.nameEN.toLowerCase().includes(brandName.toLowerCase())) {
        results.push({ store, mall });
      }
    });
  });
  
  return results;
}

export function getPromotions(_mallId: string) {
  return PROMOTIONS_BY_MALL[mallId as keyof typeof PROMOTIONS_BY_MALL] || [];
}

export function getActivePromotions(_mallId: string) {
  const promotions = getPromotions(mallId);
  const now = new Date();
  
  return promotions.filter(promo => {
    const startDate = new Date(promo.startDate);
    const endDate = new Date(promo.endDate);
    return promo.status !== "ended" && now >= startDate && now <= endDate;
  });
}

// ============ [MOCK API FUNCTIONS FOR COMPATIBILITY] ============

export const userApi = {
  getMalls: () => Promise.resolve(getMalls()),
  getMallById: (_mallId: string) => Promise.resolve(getMallById(mallId)),
  getStores: (_mallId: string, filters?: unknown) => Promise.resolve(getStores(mallId, filters)),
  getStoreById: (storeId: string) => Promise.resolve(getStoreById(storeId)),
  getFloors: (_mallId: string) => Promise.resolve(getFloors(mallId)),
  getFloorPins: (_mallId: string, floorId: string) => Promise.resolve(getFloorPins(mallId, floorId)),
  searchBrands: (brandName: string) => Promise.resolve(searchBrands(brandName)),
  getPromotions: () => Promise.resolve([]),
  addFavorite: () => Promise.resolve({ success: true }),
  removeFavorite: () => Promise.resolve({ success: true }),
  getFavorites: () => Promise.resolve([]),
  logEvent: () => Promise.resolve({ success: true })
};

// ============ [PROMOTIONS BY MALL] ============
// โปรโมชั่นของแต่ละห้าง

export const PROMOTIONS_BY_MALL = {
  "central-rama-3": [
    {
      id: "my-mom-my-shopping-mate-2025",
      title: "My Mom, My Shopping Mate",
      subtitle: "เพื่อนคู่ซี้ มามี้ชวนช้อป!",
      _mallId: "central-rama-3",
      scope: "mall",
      floors: [],
      startDate: "2025-08-01",
      endDate: "2025-08-31",
      timeNote: "วันแม่ทุกวัน • 1 ส.ค. 68 – 31 ส.ค. 68",
      status: "scheduled",
      short: "เพื่อนคู่ซี้ มามี้ชวนช้อป! ฉลองโมเมนต์แม่ลูกที่เซ็นทรัล พระราม 3 ทั้งเดือนสิงหา",
      description: "My Mom, My Shopping Mate — เพื่อนคู่ซี้ มามี้ชวนช้อป! เฉลิมฉลองวันแม่ทั้งเดือนที่เซ็นทรัล พระราม 3 พบดีล ร้านอาหาร และกิจกรรมสำหรับครอบครัวตลอด 1–31 ส.ค. 68",
      hashtags: [
        "#MyMomMyMate",
        "#โมเมนต์สุดซี้มามี้สุดเลิฟ",
        "#MothersDay2025",
        "#CentralPattana",
        "#วันแม่",
        "#เซ็นทรัลพระราม3",
        "#CentralRama3"
      ],
      tags: ["เทศกาล", "วันแม่", "แคมเปญทั้งห้าง"],
      perks: [],
      cta: {
        label: "ดูโปรโมชันทั้งหมด",
        href: "/mall/central-rama-3/promotions/my-mom-my-shopping-mate-2025"
      },
      images: [
        { alt: "Mother's Day Campaign", src: "/images/campaigns/mothers-day-2025/hero.jpg" }
      ],
      theme: {
        bg: "from-pink-50 to-blue-50",
        badgeColor: "pink"
      }
    }
  ],
  "tm-bangkapi": [
    {
      id: "event-power-mall-ai-2025",
      title: "POWER MALL ELECTRONICA SHOWCASE 2025",
      subtitle: "POWER OF A.I.",
      _mallId: "tm-bangkapi",
      scope: "event",
      floors: ["3"],
      startDate: "2025-08-12",
      endDate: "2025-08-20",
      timeNote: "12 ส.ค. 68 – 20 ส.ค. 68",
      status: "scheduled",
      short: "งานรวมโปรโมชั่นเครื่องใช้ไฟฟ้า มือถือ คอมพิวเตอร์ และ Gadget ภายใต้ธีม POWER OF A.I.",
      description: "งานรวมโปรโมชั่นเครื่องใช้ไฟฟ้า มือถือ คอมพิวเตอร์ และ Gadget ภายใต้ธีม POWER OF A.I. พบกับส่วนลดสูงสุด 70% และโปรสุดคุ้ม #ซื้อ1แถม1 #ซื้อ1แถม2 #ซื้อ1แถม3 พร้อมสิทธิพิเศษจากบัตรเครดิตและ M Card",
      hashtags: [
        "#PowerMall",
        "#PowerOfAI",
        "#ElectronicaShowcase",
        "#ElectronicaShowcase2025",
        "#TheMallLifestoreBangkapi",
        "#ชีวิตติดห้าง"
      ],
      tags: ["อีเวนต์", "อิเล็กทรอนิกส์", "AI"],
      perks: [
        "ลดสูงสุด 70%",
        "ซื้อ 1 แถม 1 / 2 / 3",
        "คูปองส่วนลดเงินสด 500 บาท",
        "คูปองเงินสดสูงสุด 15,000 บาท",
        "สมาชิก M CARD ลดเพิ่มสูงสุด 20%",
        "Bangkok Bank M Visa ลดเพิ่มทันที 3%",
        "ผ่อน 0% สูงสุด 24 เดือน",
        "แลกรับเครดิตเงินคืนสูงสุด 25%",
        "ซื้อครบ 5,000 บาท รับส่วนลดเพิ่ม 500 บาท"
      ],
      cta: {
        label: "ดูรายละเอียดอีเวนต์",
        href: "/mall/tm-bangkapi/events/power-mall-ai-2025"
      },
      images: [
        { alt: "Power Mall AI Event", src: "/images/events/power-mall-ai-2025/hero.jpg" }
      ],
      theme: {
        bg: "from-blue-50 to-purple-50",
        badgeColor: "blue"
      },
      location: {
        floor: "3",
        zone: "MCC HALL"
      }
    }
  ]
};

export const adminApi = {
  getMalls: () => Promise.resolve([]),
  createMall: () => Promise.resolve({ success: true }),
  updateMall: () => Promise.resolve({ success: true }),
  deleteMall: () => Promise.resolve({ success: true }),
  getStores: () => Promise.resolve([]),
  createStore: () => Promise.resolve({ success: true }),
  updateStore: () => Promise.resolve({ success: true }),
  deleteStore: () => Promise.resolve({ success: true })
};
