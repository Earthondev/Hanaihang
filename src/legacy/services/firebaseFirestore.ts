import { 
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

import { db } from '@/services/firebase/firebase';

export interface FirestoreStore {
  id?: string;
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
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirestoreFloor {
  id?: string;
  _mallId: string;
  name: string;
  floorCode: string;
  description: string;
  imageUrl: string;
  storeCount: number;
  anchors?: any[];
  published: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirestorePromotion {
  id?: string;
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
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirestoreMall {
  id?: string;
  name: string;
  nameEN: string;
  address: string;
  district: string;
  province: string;
  postcode: string;
  coords: { lat: number; lng: number };
  hours: { open: string; close: string };
  phone: string;
  website: string;
  weight: number;
  published: boolean;
  order: number;
  featured: boolean;
  investment: string;
  area: string;
  parking: string;
  shops: string;
  anchors: string[];
  contact: {
    phone: string;
    email: string;
    website: string;
  };
  socials: {
    facebook: string;
    instagram: string;
    line: string;
  };
  about: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirestoreEvent {
  id?: string;
  title: string;
  subtitle: string;
  _mallId: string;
  startDate: string;
  endDate: string;
  timeNote: string;
  status: 'draft' | 'scheduled' | 'active' | 'ended';
  description: string;
  hashtags: string[];
  tags: string[];
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
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const firebaseFirestore = {
  // Malls
  async getMalls(): Promise<FirestoreMall[]> {
    try {
      console.log('🔍 กำลังดึงข้อมูล malls จาก Firestore...');
      const q = query(collection(db, 'malls'), where('published', '==', true), orderBy('order'));
      const querySnapshot = await getDocs(q);
      console.log('📊 Firestore response:', querySnapshot.docs.length, 'documents');
      
      const malls = querySnapshot.docs.map(doc => {
        const data = doc.data() as any;
        return Object.assign({ id: doc.id }, data) as FirestoreMall;
      });
      
      console.log('✅ ดึงข้อมูล malls สำเร็จ:', malls);
      return malls;
    } catch (error) {
      console.error('❌ Error getting malls:', error);
      return [];
    }
  },

  async getMallById(id: string): Promise<FirestoreMall | null> {
    try {
      const docRef = doc(db, 'malls', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as FirestoreMall;
      }
      return null;
    } catch (error) {
      console.error('Error getting mall:', error);
      return null;
    }
  },

  async createMall(mall: Omit<FirestoreMall, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'malls'), {
        ...mall,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating mall:', error);
      throw error;
    }
  },

  // Stores
  async getStores(mallId?: string): Promise<FirestoreStore[]> {
    try {
      let q: any = collection(db, 'stores');
      
      if (mallId) {
        q = query(q, where('mallId', '==', mallId));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data() as any;
        return Object.assign({ id: doc.id }, data) as FirestoreStore;
      });
    } catch (error) {
      console.error('Error getting stores:', error);
      return [];
    }
  },

  // Search stores by brand name
  async searchStoresByBrand(brandName: string): Promise<FirestoreStore[]> {
    try {
      const q: any = collection(db, 'stores');
      const querySnapshot = await getDocs(q);
      
      const stores = querySnapshot.docs.map(doc => {
        const data = doc.data() as any;
        return Object.assign({ id: doc.id }, data) as FirestoreStore;
      });
      
      // Filter by brand name (case insensitive)
      return stores.filter(store => 
        store.name.toLowerCase().includes(brandName.toLowerCase()) ||
        store.nameEN.toLowerCase().includes(brandName.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching stores by brand:', error);
      return [];
    }
  },

  // Get stores with mall information
  async getStoresWithMallInfo(mallId?: string): Promise<any[]> {
    try {
      const stores = await this.getStores(mallId);
      const malls = await this.getMalls();
      
      return stores.map(store => {
        const mall = malls.find(m => m.id === store.mallId);
        return {
          ...store,
          mallName: mall?.name || 'Unknown Mall',
          mallAddress: mall?.address || '',
          mallCoords: mall?.coords || null
        };
      });
    } catch (error) {
      console.error('Error getting stores with mall info:', error);
      return [];
    }
  },

  async getStore(id: string): Promise<FirestoreStore | null> {
    try {
      const docRef = doc(db, 'stores', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as FirestoreStore;
      }
      return null;
    } catch (error) {
      console.error('Error getting store:', error);
      return null;
    }
  },

  async createStore(store: Omit<FirestoreStore, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'stores'), {
        ...store,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating store:', error);
      throw error;
    }
  },

  async updateStore(id: string, store: Partial<FirestoreStore>): Promise<void> {
    try {
      const docRef = doc(db, 'stores', id);
      await updateDoc(docRef, {
        ...store,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating store:', error);
      throw error;
    }
  },

  async deleteStore(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'stores', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting store:', error);
      throw error;
    }
  },

  // Floors
  async getFloors(mallId?: string): Promise<FirestoreFloor[]> {
    try {
      let q: any = collection(db, 'floors');
      
      if (mallId) {
        q = query(q, where('mallId', '==', mallId), where('published', '==', true));
      } else {
        q = query(q, where('published', '==', true));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as FirestoreFloor[];
    } catch (error) {
      console.error('Error getting floors:', error);
      return [];
    }
  },

  async createFloor(floor: Omit<FirestoreFloor, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'floors'), {
        ...floor,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating floor:', error);
      throw error;
    }
  },

  async updateFloor(id: string, floor: Partial<FirestoreFloor>): Promise<void> {
    try {
      const docRef = doc(db, 'floors', id);
      await updateDoc(docRef, {
        ...floor,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating floor:', error);
      throw error;
    }
  },

  async deleteFloor(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'floors', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting floor:', error);
      throw error;
    }
  },

  // Promotions
  async getPromotions(mallId?: string): Promise<FirestorePromotion[]> {
    try {
      let q: any = collection(db, 'promotions');
      
      if (mallId) {
        q = query(q, where('mallId', '==', mallId), where('published', '==', true));
      } else {
        q = query(q, where('published', '==', true));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as FirestorePromotion[];
    } catch (error) {
      console.error('Error getting promotions:', error);
      return [];
    }
  },

  async createPromotion(promotion: Omit<FirestorePromotion, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'promotions'), {
        ...promotion,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating promotion:', error);
      throw error;
    }
  },

  async updatePromotion(id: string, promotion: Partial<FirestorePromotion>): Promise<void> {
    try {
      const docRef = doc(db, 'promotions', id);
      await updateDoc(docRef, {
        ...promotion,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating promotion:', error);
      throw error;
    }
  },

  async deletePromotion(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'promotions', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting promotion:', error);
      throw error;
    }
  },

  // Events
  async getEvents(mallId?: string): Promise<FirestoreEvent[]> {
    try {
      let q: any = collection(db, 'events');
      
      if (mallId) {
        q = query(q, where('mallId', '==', mallId), where('published', '==', true));
      } else {
        q = query(q, where('published', '==', true));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as FirestoreEvent[];
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  },

  // Analytics
  async getAnalytics(): Promise<any> {
    try {
      // This would typically connect to Firebase Analytics
      // For now, return mock data
      return {
        totalUsers: 1000,
        activeUsers: 500,
        popularStores: ['Zara', 'H&M', 'Sephora'],
        popularMalls: ['Central Rama 3', 'Siam Paragon']
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      return {};
    }
  }
};
