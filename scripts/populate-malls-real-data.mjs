
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

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

// Helper function to create slug from name
// We will use the 'name' field from data as the slug ID.

const malls = [
    // --- SIAM GROUP ---
    {
        displayName: "Siam Paragon",
        name: "siam-paragon",
        address: "991 Rama I Rd, Pathum Wan, Bangkok 10330",
        district: "Pathum Wan",
        lat: 13.746389,
        lng: 100.535004,
        openTime: "10:00",
        closeTime: "22:00",
        category: "shopping-center",
        categoryLabel: "Shopping Center",
        status: "Active"
    },
    {
        displayName: "Siam Center",
        name: "siam-center",
        address: "979 Rama I Rd, Pathum Wan, Bangkok 10330",
        district: "Pathum Wan",
        lat: 13.7462,
        lng: 100.5326,
        openTime: "10:00",
        closeTime: "22:00",
        category: "shopping-center",
        categoryLabel: "Shopping Center",
        status: "Active"
    },
    {
        displayName: "Siam Discovery",
        name: "siam-discovery",
        address: "989 Rama I Rd, Pathum Wan, Bangkok 10330",
        district: "Pathum Wan",
        lat: 13.7467,
        lng: 100.5315,
        openTime: "10:00",
        closeTime: "22:00",
        category: "shopping-center",
        categoryLabel: "Shopping Center",
        status: "Active"
    },
    {
        displayName: "ICONSIAM",
        name: "iconsiam",
        address: "299 Charoen Nakhon Rd, Khlong Ton Sai, Khlong San, Bangkok 10600",
        district: "Khlong San",
        lat: 13.726694,
        lng: 100.510498,
        openTime: "10:00",
        closeTime: "22:00",
        category: "high-end",
        categoryLabel: "Luxury Mall",
        status: "Active"
    },
    {
        displayName: "ICS",
        name: "ics-mall",
        address: "Opposite ICONSIAM, Charoen Nakhon Rd, Bangkok",
        district: "Khlong San",
        lat: 13.7258,
        lng: 100.5090, // Approximate near IconSiam
        openTime: "10:00",
        closeTime: "22:00",
        category: "shopping-center",
        categoryLabel: "Shopping Center",
        status: "Active"
    },

    // --- CENTRAL GROUP (CBD) ---
    {
        displayName: "CentralWorld",
        name: "central-world",
        address: "999/9 Rama I Rd, Pathum Wan, Bangkok 10330",
        district: "Pathum Wan",
        lat: 13.746944,
        lng: 100.539719,
        openTime: "10:00",
        closeTime: "22:00",
        category: "shopping-center",
        categoryLabel: "Shopping Center",
        status: "Active"
    },
    {
        displayName: "Central Embassy",
        name: "central-embassy",
        address: "1031 Phloen Chit Rd, Lumphini, Pathum Wan, Bangkok 10330",
        district: "Pathum Wan",
        lat: 13.7438,
        lng: 100.5464,
        openTime: "10:00",
        closeTime: "22:00",
        category: "high-end",
        categoryLabel: "Luxury Mall",
        status: "Active"
    },
    {
        displayName: "Central Chidlom",
        name: "central-chidlom",
        address: "1027 Phloen Chit Rd, Lumphini, Pathum Wan, Bangkok 10330",
        district: "Pathum Wan",
        lat: 13.7445,
        lng: 100.5447,
        openTime: "10:00",
        closeTime: "22:00",
        category: "department-store",
        categoryLabel: "Department Store",
        status: "Active"
    },

    // --- EM DISTRICT ---
    {
        displayName: "Emporium",
        name: "emporium",
        address: "622 Sukhumvit Rd, Khlong Tan, Khlong Toei, Bangkok 10110",
        district: "Khlong Toei",
        lat: 13.7307,
        lng: 100.5689,
        openTime: "10:00",
        closeTime: "22:00",
        category: "high-end",
        categoryLabel: "Luxury Mall",
        status: "Active"
    },
    {
        displayName: "EmQuartier",
        name: "emquartier",
        address: "693, 695 Sukhumvit Rd, Khlong Tan Nuea, Watthana, Bangkok 10110",
        district: "Watthana",
        lat: 13.7315,
        lng: 100.5692,
        openTime: "10:00",
        closeTime: "22:00",
        category: "high-end",
        categoryLabel: "Luxury Mall",
        status: "Active"
    },
    {
        displayName: "Emsphere",
        name: "emsphere",
        address: "Sukhumvit Rd, Khlong Tan, Khlong Toei, Bangkok 10110",
        district: "Khlong Toei",
        lat: 13.7334,
        lng: 100.5667, // Approximate
        openTime: "10:00",
        closeTime: "22:00",
        category: "shopping-center",
        categoryLabel: "Shopping Center",
        status: "Active"
    },

    // --- TERMINAL 21 ---
    {
        displayName: "Terminal 21 Asok",
        name: "terminal-21-asok",
        address: "88 Soi Sukhumvit 19, Khlong Toei Nuea, Watthana, Bangkok 10110",
        district: "Watthana",
        lat: 13.7366,
        lng: 100.5606,
        openTime: "10:00",
        closeTime: "22:00",
        category: "shopping-center",
        categoryLabel: "Shopping Center",
        status: "Active"
    },
    {
        displayName: "Terminal 21 Rama 3",
        name: "terminal-21-rama-3",
        address: "356 Rama III Rd, Bang Khlo, Bang Kho Laem, Bangkok 10120",
        district: "Bang Kho Laem",
        lat: 13.6934,
        lng: 100.4907, // Approximate
        openTime: "10:00",
        closeTime: "22:00",
        category: "shopping-center",
        categoryLabel: "Shopping Center",
        status: "Active"
    },

    // --- MBK & OTHERS (CITY CENTER) ---
    {
        displayName: "MBK Center",
        name: "mbk-center",
        address: "444 Phaya Thai Rd, Wang Mai, Pathum Wan, Bangkok 10330",
        district: "Pathum Wan",
        lat: 13.7407,
        lng: 100.5247,
        openTime: "10:00",
        closeTime: "22:00",
        category: "shopping-center",
        categoryLabel: "Shopping Center",
        status: "Active"
    },
    {
        displayName: "Platinum Fashion Mall",
        name: "platinum-fashion-mall",
        address: "222 Phetchaburi Rd, Thanon Phaya Thai, Ratchathewi, Bangkok 10400",
        district: "Ratchathewi",
        lat: 13.7500,
        lng: 100.5370,
        openTime: "09:00",
        closeTime: "20:00",
        category: "shopping-center",
        categoryLabel: "Wholesale Mall",
        status: "Active"
    },
    {
        displayName: "Gaysorn Village",
        name: "gaysorn-village",
        address: "999 Phloen Chit Rd, Lumphini, Pathum Wan, Bangkok 10330",
        district: "Pathum Wan",
        lat: 13.7445,
        lng: 100.5413,
        openTime: "10:00",
        closeTime: "20:00",
        category: "high-end",
        categoryLabel: "Luxury Mall",
        status: "Active"
    },
    {
        displayName: "Samyan Mitrtown",
        name: "samyan-mitrtown",
        address: "944 Rama IV Rd, Wang Mai, Pathum Wan, Bangkok 10330",
        district: "Pathum Wan",
        lat: 13.7336,
        lng: 100.5313,
        openTime: "10:00",
        closeTime: "22:00",
        category: "community-mall",
        categoryLabel: "Community Mall",
        status: "Active"
    },
    {
        displayName: "Riverside Plaza",
        name: "riverside-plaza",
        address: "257 Charoen Nakhon Rd, Samre, Thon Buri, Bangkok 10600",
        district: "Thon Buri",
        lat: 13.7042,
        lng: 100.4908,
        openTime: "10:00",
        closeTime: "22:00",
        category: "community-mall",
        categoryLabel: "Community Mall",
        status: "Active"
    },

    // --- CENTRAL GROUP (SUBURBAN/OTHERS) ---
    {
        displayName: "Central Plaza Ladprao",
        name: "central-ladprao",
        address: "1693 Phahonyothin Rd, Chatuchak, Bangkok 10900",
        district: "Chatuchak",
        lat: 13.8168,
        lng: 100.5560,
        openTime: "10:00",
        closeTime: "22:00",
        category: "shopping-center",
        categoryLabel: "Shopping Center",
        status: "Active"
    },
    {
        displayName: "Central Plaza Grand Rama 9",
        name: "central-rama-9",
        address: "9/9 Rama IX Rd, Huai Khwang, Bangkok 10310",
        district: "Huai Khwang",
        lat: 13.7584,
        lng: 100.5661,
        openTime: "10:00",
        closeTime: "22:00",
        category: "shopping-center",
        categoryLabel: "Shopping Center",
        status: "Active"
    },
    {
        displayName: "Central Plaza Pinklao",
        name: "central-pinklao",
        address: "7/222 Borommaratchachonnani Rd, Arun Ammarin, Bangkok Noi, Bangkok 10700",
        district: "Bangkok Noi",
        lat: 13.7785,
        lng: 100.4766,
        openTime: "10:00",
        closeTime: "22:00",
        category: "shopping-center",
        categoryLabel: "Shopping Center",
        status: "Active"
    },
    {
        displayName: "Central Plaza Rama 2",
        name: "central-rama-2",
        address: "160 Rama II Rd, Samae Dam, Bang Khun Thian, Bangkok 10150",
        district: "Bang Khun Thian",
        lat: 13.6657,
        lng: 100.4377, // Updated real coords
        openTime: "11:00",
        closeTime: "21:30",
        category: "shopping-center",
        categoryLabel: "Shopping Center",
        status: "Active"
    },
    {
        displayName: "Central Plaza Rama 3",
        name: "central-rama-3",
        address: "79 Ratchadaphisek Rd, Chong Nonsi, Yan Nawa, Bangkok 10120",
        district: "Yan Nawa",
        lat: 13.6966,
        lng: 100.5414,
        openTime: "11:00",
        closeTime: "21:30",
        category: "shopping-center",
        categoryLabel: "Shopping Center",
        status: "Active"
    },
    {
        displayName: "Central Bangna",
        name: "central-bangna",
        address: "585 Bang Na-Trat Rd, Bang Na Nuea, Bang Na, Bangkok 10260",
        district: "Bang Na",
        lat: 13.6684,
        lng: 100.6344,
        openTime: "10:30",
        closeTime: "22:00",
        category: "shopping-center",
        categoryLabel: "Shopping Center",
        status: "Active"
    },
    {
        displayName: "Central Festival EastVille",
        name: "central-eastville",
        address: "69/3 Pradit Manutham Rd, Lat Phrao, Bangkok 10230",
        district: "Lat Phrao",
        lat: 13.8051,
        lng: 100.6136,
        openTime: "10:30",
        closeTime: "22:00",
        category: "shopping-center",
        categoryLabel: "Lifestyle Mall",
        status: "Active"
    },
    {
        displayName: "Central Plaza WestGate",
        name: "central-westgate",
        address: "199, 199/1, 199/2 Moo 6, Sao Thong Hin, Bang Yai, Nonthaburi 11140",
        district: "Nonthaburi", // Nearby
        lat: 13.8767,
        lng: 100.4105,
        openTime: "10:00",
        closeTime: "22:00",
        category: "shopping-center",
        categoryLabel: "Super Regional Mall",
        status: "Active"
    },

    // --- THE MALL GROUP (Others) ---
    {
        displayName: "The Mall Bangkapi",
        name: "the-mall-bangkapi",
        address: "3522 Lat Phrao Rd, Khlong Chan, Bang Kapi, Bangkok 10240",
        district: "Bang Kapi",
        lat: 13.7646,
        lng: 100.6434,
        openTime: "10:00",
        closeTime: "22:00",
        category: "shopping-center",
        categoryLabel: "Shopping Center",
        status: "Active"
    },
    {
        displayName: "The Mall Bangkae",
        name: "the-mall-bangkae",
        address: "518 Phet Kasem Rd, Bang Khae Nuea, Bang Khae, Bangkok 10160",
        district: "Bang Khae",
        lat: 13.7135,
        lng: 100.4074,
        openTime: "10:00",
        closeTime: "22:00",
        category: "shopping-center",
        categoryLabel: "Shopping Center",
        status: "Active"
    },
    {
        displayName: "The Mall Thapra",
        name: "the-mall-thapra",
        address: "129 Ratchadaphisek Rd, Bukkhalo, Thon Buri, Bangkok 10600",
        district: "Thon Buri",
        lat: 13.7144,
        lng: 100.4782,
        openTime: "10:00",
        closeTime: "22:00",
        category: "shopping-center",
        categoryLabel: "Shopping Center",
        status: "Active"
    },

    // --- OUTSKIRTS / OTHERS ---
    {
        displayName: "Mega Bangna",
        name: "mega-bangna",
        address: "39 Moo 6 Bang Na-Trat Rd, Bang Kaeo, Bang Phli, Samut Prakan 10540",
        district: "Samut Prakan",
        lat: 13.6465,
        lng: 100.6803,
        openTime: "10:00",
        closeTime: "22:00",
        category: "shopping-center",
        categoryLabel: "Shopping Center",
        status: "Active"
    },
    {
        displayName: "Seacon Square",
        name: "seacon-square",
        address: "55 Srinakarin Rd, Nong Bon, Prawet, Bangkok 10250",
        district: "Prawet",
        lat: 13.6932,
        lng: 100.6481,
        openTime: "10:30",
        closeTime: "21:30",
        category: "shopping-center",
        categoryLabel: "Shopping Center",
        status: "Active"
    },
    {
        displayName: "Paradise Park",
        name: "paradise-park",
        address: "61 Srinakarin Rd, Nong Bon, Prawet, Bangkok 10250",
        district: "Prawet",
        lat: 13.6874,
        lng: 100.6493,
        openTime: "10:30",
        closeTime: "21:30",
        category: "shopping-center",
        categoryLabel: "Shopping Center",
        status: "Active"
    },
    {
        displayName: "Fashion Island",
        name: "fashion-island",
        address: "587, 589 Ram Inthra Rd, Khan Na Yao, Bangkok 10230",
        district: "Khan Na Yao",
        lat: 13.8258,
        lng: 100.6791,
        openTime: "10:00",
        closeTime: "22:00",
        category: "shopping-center",
        categoryLabel: "Shopping Center",
        status: "Active"
    },
    {
        displayName: "The Promenade",
        name: "the-promenade",
        address: "587, 589 Ram Inthra Rd, Khan Na Yao, Bangkok 10230",
        district: "Khan Na Yao",
        lat: 13.8254,
        lng: 100.6766,
        openTime: "10:00",
        closeTime: "22:00",
        category: "shopping-center",
        categoryLabel: "Lifestyle Mall",
        status: "Active"
    },
    {
        displayName: "Union Mall",
        name: "union-mall",
        address: "54 Lat Phrao Rd, Chom Phon, Chatuchak, Bangkok 10900",
        district: "Chatuchak",
        lat: 13.8136,
        lng: 100.5618,
        openTime: "11:00",
        closeTime: "22:00",
        category: "shopping-center",
        categoryLabel: "Shopping Center",
        status: "Active"
    },
    {
        displayName: "Gateway Ekamai",
        name: "gateway-ekamai",
        address: "982/22 Sukhumvit Rd, Phra Khanong, Khlong Toei, Bangkok 10110",
        district: "Khlong Toei",
        lat: 13.7187,
        lng: 100.5853,
        openTime: "10:00",
        closeTime: "22:00",
        category: "shopping-center",
        categoryLabel: "Shopping Center",
        status: "Active"
    },
    {
        displayName: "Asiatique The Riverfront",
        name: "asiatique",
        address: "2194 Charoen Krung Rd, Wat Phraya Krai, Bang Kho Laem, Bangkok 10120",
        district: "Bang Kho Laem",
        lat: 13.7045,
        lng: 100.5031,
        openTime: "11:00",
        closeTime: "24:00",
        category: "community-mall",
        categoryLabel: "Open-Air Mall",
        status: "Active"
    }
];

async function updateMalls() {
    try {
        console.log('🚀 Updating malls database with real data...');

        let count = 0;
        for (const mall of malls) {
            console.log(`📝 Processing: ${mall.displayName}`);

            const mallRef = doc(db, "malls", mall.name);

            const payload = {
                ...mall,
                updatedAt: serverTimestamp(),
                // Use setDoc with merge: true to avoid overwriting existing fields like storeCount if they exist,
                // but since we want to enforce real data, maybe we should overwrite specific fields.
                // We ensure we have the structure.
            };

            // Ensure createdAt exists if new
            // We can't conditionally add createdAt in the object easily without reading first if we use set w/ merge.
            // But for simplicity, we'll just set it. Firestore handles serverTimestamp well.

            await setDoc(mallRef, payload, { merge: true });
            console.log(`✅ Updated/Created: ${mall.displayName}`);
            count++;
        }

        console.log(`🎉 Successfully updated ${count} malls!`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating malls:', error);
        process.exit(1);
    }
}

updateMalls();
