/**
 * ตัวอย่างการใช้งาน Mall Schema v2
 * แสดงวิธีการใช้ schema ที่ normalize แล้ว
 */

import { mallSchema, MallInput } from '../validation/mall.schema';

// ตัวอย่างการใช้งานในฟอร์ม
export function exampleFormUsage() {
  // ข้อมูลดิบจากฟอร์ม (ก่อน normalize)
  const rawFormData = {
    displayName: 'Central Rama 3',
    name: '', // จะ auto-generate เป็น 'central-rama-3'
    address: '123 Rama III Road, Bang Phong Phang, Yan Nawa, Bangkok 10120',
    district: 'Yan Nawa',
    phone: '02-123-4567',
    website: 'central.co.th', // จะ auto-add https://
    social: 'https://facebook.com/centralrama3',
    location: {
      lat: 13.6891,
      lng: 100.5441
    },
    openTime: '10:00',
    closeTime: '22:00'
  };

  try {
    // Schema จะ normalize ข้อมูลให้อัตโนมัติ
    const normalizedData: MallInput = mallSchema.parse(rawFormData);
    
    console.log('📝 Normalized data:', normalizedData);
    // ผลลัพธ์:
    // {
    //   displayName: 'Central Rama 3',
    //   name: 'central-rama-3',           // auto-generated slug
    //   address: '123 Rama III Road, Bang Phong Phang, Yan Nawa, Bangkok 10120',
    //   district: 'Yan Nawa',
    //   phone: '02-123-4567',
    //   website: 'https://central.co.th', // auto-added https://
    //   social: 'https://facebook.com/centralrama3',
    //   lat: 13.6891,                    // merged from location
    //   lng: 100.5441,                   // merged from location
    //   openTime: '10:00',
    //   closeTime: '22:00'
    // }

    // ใช้ข้อมูลที่ normalize แล้วได้เลย
    return normalizedData;
  } catch (error) {
    console.error('❌ Validation error:', error);
    throw error;
  }
}

// ตัวอย่างการใช้งานใน updateMall
export function exampleUpdateUsage() {
  // ข้อมูลบางส่วนสำหรับอัปเดต
  const partialData = {
    displayName: 'Central Rama 3 (Updated)',
    openTime: '09:00',
    closeTime: '23:00'
  };

  try {
    // ใช้ partial() สำหรับอัปเดต
    const updateData = mallSchema.partial().parse(partialData);
    
    console.log('📝 Update data:', updateData);
    // ผลลัพธ์:
    // {
    //   displayName: 'Central Rama 3 (Updated)',
    //   openTime: '09:00',
    //   closeTime: '23:00'
    // }

    return updateData;
  } catch (error) {
    console.error('❌ Validation error:', error);
    throw error;
  }
}

// ตัวอย่างการจัดการ edge cases
export function exampleEdgeCases() {
  const testCases = [
    // Case 1: เว้นว่าง website
    {
      displayName: 'Test Mall 1',
      address: '123 Test Road',
      district: 'Test District',
      website: '', // จะเป็น undefined
      openTime: '10:00',
      closeTime: '22:00'
    },
    
    // Case 2: เบอร์โทรแบบต่าง ๆ
    {
      displayName: 'Test Mall 2',
      address: '456 Test Road',
      district: 'Test District',
      phone: '0812345678', // 0XXXXXXXXX
      openTime: '10:00',
      closeTime: '22:00'
    },
    
    // Case 3: เบอร์โทรแบบ +66
    {
      displayName: 'Test Mall 3',
      address: '789 Test Road',
      district: 'Test District',
      phone: '+66 81 234 5678', // +66 format
      openTime: '10:00',
      closeTime: '22:00'
    },
    
    // Case 4: ไม่มีพิกัด
    {
      displayName: 'Test Mall 4',
      address: '999 Test Road',
      district: 'Test District',
      openTime: '10:00',
      closeTime: '22:00'
    },
    
    // Case 5: เวลาข้ามเที่ยงคืน (ไม่บังคับ open < close)
    {
      displayName: 'Test Mall 5',
      address: '111 Test Road',
      district: 'Test District',
      openTime: '22:00',
      closeTime: '02:00' // ข้ามเที่ยงคืน
    }
  ];

  testCases.forEach((testCase, index) => {
    try {
      const result = mallSchema.parse(testCase);
      console.log(`✅ Test case ${index + 1} passed:`, result);
    } catch (error) {
      console.error(`❌ Test case ${index + 1} failed:`, error);
    }
  });
}

// ตัวอย่างการใช้งานใน service functions
export async function exampleServiceUsage() {
  const formData = {
    displayName: 'New Mall',
    address: 'New Address',
    district: 'New District',
    location: { lat: 13.7563, lng: 100.5018 },
    openTime: '10:00',
    closeTime: '22:00'
  };

  try {
    // Parse และ normalize ข้อมูล
    const mallData = mallSchema.parse(formData);
    
    // ใช้ข้อมูลที่ normalize แล้วได้เลย
    // await createMall(mallData);
    // หรือ
    // await updateMall(mallId, mallData);
    
    console.log('📝 Ready for Firestore:', mallData);
    return mallData;
  } catch (error) {
    console.error('❌ Validation failed:', error);
    throw error;
  }
}
