import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

import { db } from '../config/firebase';
import { Store } from '../types/mall-system';

/**
 * Hook สำหรับดึงข้อมูลร้านแบบ real-time
 */
export function useRealtimeStores(mallId: string) {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mallId) {
      setStores([]);
      setLoading(false);
      return;
    }

    console.log('🔄 เริ่มต้น real-time listener สำหรับร้านในห้าง:', mallId);
    
    const q = query(
      collection(db, 'malls', mallId, 'stores'),
      orderBy('name')
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('📡 ข้อมูลร้านเปลี่ยนแปลง:', snapshot.size, 'ร้าน');
        
        const storesData: Store[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          storesData.push({
            id: doc.id,
            ...data,
            // Convert timestamps
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
          } as Store);
        });
        
        setStores(storesData);
        setLoading(false);
        setError(null);
        
        console.log('✅ อัปเดตข้อมูลร้านสำเร็จ:', storesData.length, 'ร้าน');
      },
      (error) => {
        console.error('❌ เกิดข้อผิดพลาดในการ listen ข้อมูลร้าน:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => {
      console.log('🧹 ปิด real-time listener สำหรับร้านในห้าง:', mallId);
      unsubscribe();
    };
  }, [mallId]);

  return { stores, loading, error };
}

/**
 * Hook สำหรับดึงข้อมูลร้านทั้งหมดแบบ real-time
 */
export function useRealtimeAllStores() {
  const [stores, setStores] = useState<{ store: Store; mallId: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 เริ่มต้น real-time listener สำหรับร้านทั้งหมด...');
    
    // ใช้ collectionGroup เพื่อดึงร้านจากทุกห้าง
    const q = query(collection(db, 'stores'), orderBy('name'));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('📡 ข้อมูลร้านทั้งหมดเปลี่ยนแปลง:', snapshot.size, 'ร้าน');
        
        const storesData: { store: Store; mallId: string }[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const storeWithId = {
            id: doc.id,
            ...data,
            // Convert timestamps
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
          } as Store;
          
          // Extract mallId from document path
          const pathParts = doc.ref.path.split('/');
          const mallId = pathParts[1]; // malls/{mallId}/stores/{storeId}
          
          if (mallId) {
            storesData.push({ store: storeWithId, mallId });
          }
        });
        
        setStores(storesData);
        setLoading(false);
        setError(null);
        
        console.log('✅ อัปเดตข้อมูลร้านทั้งหมดสำเร็จ:', storesData.length, 'ร้าน');
      },
      (error) => {
        console.error('❌ เกิดข้อผิดพลาดในการ listen ข้อมูลร้านทั้งหมด:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => {
      console.log('🧹 ปิด real-time listener สำหรับร้านทั้งหมด');
      unsubscribe();
    };
  }, []);

  return { stores, loading, error };
}
