// Mock API service for admin panel
// ในอนาคตจะเชื่อมต่อกับ backend API จริง

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  lastLogin: string;
  createdAt: string;
}

export interface Store {
  id: string;
  name: string;
  nameEN: string;
  _mallId: string;
  floor: string;
  unit: string;
  category: string;
  hours: string;
  phone: string;
  website: string;
  facebook: string;
  instagram: string;
  tags: string[];
  description: string;
  shortDesc: string;
  features: string[];
  priceRange: string;
  status: 'active' | 'inactive' | 'maintenance';
  badges: string[];
  hashtags: string[];
  order: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Floor {
  id: string;
  _mallId: string;
  name: string;
  floorCode: string;
  description: string;
  imageUrl: string;
  storeCount: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Promotion {
  id: string;
  title: string;
  subtitle: string;
  _mallId: string;
  scope: 'mall' | 'store' | 'event';
  floors: string[];
  startDate: string;
  endDate: string;
  timeNote: string;
  status: 'draft' | 'scheduled' | 'active' | 'ended';
  short: string;
  description: string;
  hashtags: string[];
  tags: string[];
  perks: string[];
  cta: {
    label: string;
    href: string;
  };
  images: Array<{
    alt: string;
    src: string;
  }>;
  theme: {
    bg: string;
    badgeColor: string;
  };
  location: {
    floor: string;
    zone: string;
  };
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// Mock data
const mockUsers: AdminUser[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@haanaihang.com',
    role: 'admin',
    lastLogin: new Date().toISOString(),
    createdAt: '2024-01-01T00:00:00Z'
  }
];

const mockStores: Store[] = [
  {
    id: '1',
    name: 'Zara',
    nameEN: 'Zara',
    _mallId: 'central-rama-3',
    floor: '2',
    unit: '2-22',
    category: 'Fashion',
    hours: '10:00 - 22:00',
    phone: '02-123-4567',
    website: 'https://zara.com',
    facebook: 'https://facebook.com/zara',
    instagram: 'https://instagram.com/zara',
    tags: ['fashion', 'clothing', 'trendy'],
    description: 'Zara - Fashion store',
    shortDesc: 'Zara',
    features: ['Fashion'],
    priceRange: '฿฿',
    status: 'active',
    badges: ['Popular'],
    hashtags: ['#Zara', '#Fashion'],
    order: 1,
    published: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'H&M',
    nameEN: 'H&M',
    _mallId: 'central-rama-3',
    floor: '2',
    unit: '2-15',
    category: 'Fashion',
    hours: '10:00 - 22:00',
    phone: '02-123-4568',
    website: 'https://hm.com',
    facebook: 'https://facebook.com/hm',
    instagram: 'https://instagram.com/hm',
    tags: ['fashion', 'clothing', 'affordable'],
    description: 'H&M - Fashion store',
    shortDesc: 'H&M',
    features: ['Fashion'],
    priceRange: '฿฿',
    status: 'active',
    badges: ['Popular'],
    hashtags: ['#HM', '#Fashion'],
    order: 2,
    published: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Sephora',
    nameEN: 'Sephora',
    _mallId: 'central-rama-3',
    floor: '2',
    unit: '2-08',
    category: 'Beauty',
    hours: '10:00 - 22:00',
    phone: '02-123-4569',
    website: 'https://sephora.com',
    facebook: 'https://facebook.com/sephora',
    instagram: 'https://instagram.com/sephora',
    tags: ['beauty', 'cosmetics', 'skincare'],
    description: 'Sephora - Beauty store',
    shortDesc: 'Sephora',
    features: ['Beauty'],
    priceRange: '฿฿฿',
    status: 'maintenance',
    badges: ['Premium'],
    hashtags: ['#Sephora', '#Beauty'],
    order: 3,
    published: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

// API functions
export const adminApi = {
  // Authentication
  async login(username: string, password: string): Promise<{ success: boolean; user?: AdminUser; token?: string; error?: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user = mockUsers.find(u => u.username === username);
    if (user && password === 'admin123') {
      return {
        success: true,
        user,
        token: 'mock-jwt-token-' + Date.now()
      };
    }
    
    return {
      success: false,
      error: 'Invalid credentials'
    };
  },

  async logout(): Promise<{ success: boolean }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  },

  async getCurrentUser(): Promise<AdminUser | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockUsers[0];
  },

  // Stores
  async getStores(mallId?: string): Promise<Store[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (mallId) {
      return mockStores.filter(store => store.mallId === mallId);
    }
    return mockStores;
  },

  async getStore(id: string): Promise<Store | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockStores.find(store => store.id === id) || null;
  },

  async createStore(storeData: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>): Promise<Store> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newStore: Store = {
      ...storeData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockStores.push(newStore);
    return newStore;
  },

  async updateStore(id: string, storeData: Partial<Store>): Promise<Store | null> {
    await new Promise(resolve => setTimeout(resolve, 800));
    const index = mockStores.findIndex(store => store.id === id);
    if (index !== -1) {
      mockStores[index] = {
        ...mockStores[index],
        ...storeData,
        updatedAt: new Date().toISOString()
      };
      return mockStores[index];
    }
    return null;
  },

  async deleteStore(id: string): Promise<{ success: boolean }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = mockStores.findIndex(store => store.id === id);
    if (index !== -1) {
      mockStores.splice(index, 1);
      return { success: true };
    }
    return { success: false };
  },

  // Floors
  async getFloors(_mallId: string): Promise<Floor[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      {
        id: '1',
        mallId: _mallId,
        name: 'ชั้น G',
        floorCode: 'G',
        description: 'ชั้นล่าง - ร้านอาหาร, ซูเปอร์มาร์เก็ต',
        imageUrl: '/images/floors/g.jpg',
        storeCount: 15,
        published: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        mallId: _mallId,
        name: 'ชั้น 1',
        floorCode: '1',
        description: 'ชั้น 1 - แฟชั่น, เสื้อผ้า',
        imageUrl: '/images/floors/1.jpg',
        storeCount: 25,
        published: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '3',
        mallId: _mallId,
        name: 'ชั้น 2',
        floorCode: '2',
        description: 'ชั้น 2 - เครื่องสำอาง, ของใช้ส่วนตัว',
        imageUrl: '/images/floors/2.jpg',
        storeCount: 20,
        published: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ];
  },

  // Promotions
  async getPromotions(_mallId?: string): Promise<Promotion[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      {
        id: '1',
        title: 'My Mom, My Shopping Mate',
        subtitle: 'โปรโมชั่นวันแม่',
        _mallId: 'central-rama-3',
        scope: 'mall',
        floors: ['G', '1', '2', '3'],
        startDate: '2025-08-01',
        endDate: '2025-08-31',
        timeNote: '1 ส.ค. 68 – 31 ส.ค. 68',
        status: 'scheduled',
        short: 'โปรโมชั่นวันแม่ รับส่วนลดสูงสุด 50%',
        description: 'โปรโมชั่นวันแม่ รับส่วนลดสูงสุด 50% พร้อมสิทธิพิเศษมากมาย',
        hashtags: ['#MyMomMyShoppingMate', '#CentralRama3'],
        tags: ['โปรโมชั่น', 'วันแม่'],
        perks: ['ส่วนลดสูงสุด 50%', 'รับคูปองเงินสด 500 บาท'],
        cta: {
          label: 'ดูรายละเอียดโปรโมชั่น',
          href: '/mall/central-rama-3/promotions/mom-shopping-mate'
        },
        images: [
          { alt: 'Mom Shopping Mate', src: '/images/promotions/mom-shopping-mate.jpg' }
        ],
        theme: {
          bg: 'from-pink-50 to-red-50',
          badgeColor: 'pink'
        },
        location: {
          floor: 'all',
          zone: 'All Floors'
        },
        published: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ];
  },

  // Analytics
  async getAnalytics(): Promise<{
    totalStores: number;
    totalMalls: number;
    totalPromotions: number;
    activeUsers: number;
    recentActivity: Array<{
      id: string;
      type: 'store_added' | 'store_updated' | 'promotion_created';
      description: string;
      timestamp: string;
    }>;
  }> {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      totalStores: mockStores.length,
      totalMalls: 3,
      totalPromotions: 1,
      activeUsers: 1250,
      recentActivity: [
        {
          id: '1',
          type: 'store_added',
          description: 'เพิ่มร้านค้าใหม่: Zara',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
        },
        {
          id: '2',
          type: 'promotion_created',
          description: 'สร้างโปรโมชั่น: My Mom, My Shopping Mate',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
        },
        {
          id: '3',
          type: 'store_updated',
          description: 'อัปเดตร้านค้า: H&M',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() // 4 hours ago
        }
      ]
    };
  }
};
