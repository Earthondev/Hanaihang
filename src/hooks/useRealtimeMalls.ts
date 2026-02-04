import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Mall } from '../types/mall-system';
import { isE2E } from '@/lib/e2e';
import { E2E_MALLS, getE2EMallById } from '@/lib/e2e-fixtures';

/**
 * Hook สำหรับดึงข้อมูลห้างแบบ real-time
 * ใช้ onSnapshot เพื่อ listen การเปลี่ยนแปลงข้อมูล
 */
export function useRealtimeMalls() {
  const [malls, setMalls] = useState<Mall[]>(() =>
    isE2E ? E2E_MALLS : [],
  );
  const [loading, setLoading] = useState(!isE2E);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isE2E) {
      setMalls(E2E_MALLS);
      setError(null);
      const timer = setTimeout(() => setLoading(false), 200);
      return () => clearTimeout(timer);
    }

    console.log('🔄 เริ่มต้น real-time listener สำหรับห้าง...');
    console.log('🔧 Firebase config projectId:', db.app.options.projectId);
    
    const q = query(collection(db, 'malls'), orderBy('displayName'));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('📡 ข้อมูลห้างเปลี่ยนแปลง:', snapshot.size, 'ห้าง');
        console.log('📋 รายการห้าง:', snapshot.docs.map(doc => doc.data().displayName).join(', '));
        
        const mallsData: Mall[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          mallsData.push({
            id: doc.id,
            ...data,
            // Convert timestamps
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
          } as Mall);
        });
        
        console.log('🔄 กำลังอัปเดต state ด้วยข้อมูล:', mallsData.length, 'ห้าง');
        setMalls(mallsData);
        setLoading(false);
        setError(null);
        
        console.log('✅ อัปเดตข้อมูลห้างสำเร็จ:', mallsData.length, 'ห้าง');
      },
      (error) => {
        console.error('❌ เกิดข้อผิดพลาดในการ listen ข้อมูลห้าง:', error);
        console.error('❌ Error details:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => {
      console.log('🧹 ปิด real-time listener สำหรับห้าง');
      unsubscribe();
    };
  }, []);

  return { malls, loading, error };
}

/**
 * Hook สำหรับดึงข้อมูลห้างเดียวแบบ real-time
 */
export function useRealtimeMall(mallId: string) {
  const [mall, setMall] = useState<Mall | null>(() =>
    isE2E && mallId ? (getE2EMallById(mallId) as Mall | null) : null,
  );
  const [loading, setLoading] = useState(!isE2E);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mallId) {
      setMall(null);
      setLoading(false);
      return;
    }

    if (isE2E) {
      const found = getE2EMallById(mallId) || null;
      setMall(found as Mall | null);
      setLoading(false);
      setError(found ? null : 'ไม่พบข้อมูลห้าง');
      return () => undefined;
    }

    console.log('🔄 เริ่มต้น real-time listener สำหรับห้าง:', mallId);
    
    const q = query(collection(db, 'malls'), orderBy('displayName'));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const mallDoc = snapshot.docs.find(doc => doc.id === mallId);
        
        if (mallDoc) {
          const data = mallDoc.data();
          setMall({
            id: mallDoc.id,
            ...data,
            // Convert timestamps
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
          } as Mall);
          setError(null);
        } else {
          setMall(null);
          setError('ไม่พบข้อมูลห้าง');
        }
        
        setLoading(false);
        console.log('✅ อัปเดตข้อมูลห้างสำเร็จ:', mallId);
      },
      (error) => {
        console.error('❌ เกิดข้อผิดพลาดในการ listen ข้อมูลห้าง:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => {
      console.log('🧹 ปิด real-time listener สำหรับห้าง:', mallId);
      unsubscribe();
    };
  }, [mallId]);

  return { mall, loading, error };
}
