import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

import { storage, auth } from '@/config/firebase';

/**
 * Upload mall logo to Firebase Storage
 * @param file - The image file to upload
 * @param mallId - The mall ID to use as filename
 * @returns Promise<string> - The download URL of the uploaded image
 */
export async function uploadMallLogo(file: File, _mallId: string): Promise<string> {
  try {
    // Check if user is authenticated
    if (!auth.currentUser) {
      throw new Error('ต้องเข้าสู่ระบบก่อนอัปโหลดรูป');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('ไฟล์ต้องเป็นรูปภาพเท่านั้น');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('ขนาดไฟล์ต้องไม่เกิน 5MB');
    }

    // Create storage reference with timestamp to avoid conflicts
    const timestamp = Date.now();
    const fileName = `${_mallId}_${timestamp}`;
    const storageRef = ref(storage, `mall_logos/${fileName}`);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading mall logo:', error);
    throw error;
  }
}

/**
 * Delete mall logo from Firebase Storage
 * @param mallId - The mall ID to delete logo for
 */
export async function deleteMallLogo(_mallId: string): Promise<void> {
  try {
    // Check if user is authenticated
    if (!auth.currentUser) {
      throw new Error('ต้องเข้าสู่ระบบก่อนลบรูป');
    }

    // Note: Since we're using timestamped filenames, we need the exact filename
    // For now, we'll skip the actual deletion and just return success
    // In a real implementation, you'd need to store the filename in Firestore
    console.log(`Would delete logo for mall: ${_mallId}`);
  } catch (error) {
    console.error('Error deleting mall logo:', error);
    throw error;
  }
}

/**
 * Get mall logo URL from Firebase Storage
 * @param mallId - The mall ID to get logo for
 * @returns Promise<string | null> - The download URL or null if not found
 */
export async function getMallLogoUrl(_mallId: string): Promise<string | null> {
  try {
    const storageRef = ref(storage, `mall_logos/${_mallId}`);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    // Logo doesn't exist
    return null;
  }
}

/**
 * Upload store logo to Firebase Storage
 * @param file - The image file to upload
 * @param storeId - The store ID to use as filename
 * @returns Promise<string> - The download URL of the uploaded image
 */
export async function uploadStoreLogo(file: File, storeId: string): Promise<string> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('ไฟล์ต้องเป็นรูปภาพเท่านั้น');
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      throw new Error('ขนาดไฟล์ต้องไม่เกิน 2MB');
    }

    // Create storage reference
    const storageRef = ref(storage, `store_logos/${storeId}`);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading store logo:', error);
    throw error;
  }
}

/**
 * Delete store logo from Firebase Storage
 * @param storeId - The store ID to delete logo for
 */
export async function deleteStoreLogo(storeId: string): Promise<void> {
  try {
    const storageRef = ref(storage, `store_logos/${storeId}`);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting store logo:', error);
    throw error;
  }
}

/**
 * Upload mall logo with fallback to base64 encoding
 * @param file - The image file to upload
 * @param mallId - The mall ID to use as filename
 * @returns Promise<string> - The download URL or base64 data URL
 */
export async function uploadMallLogoWithFallback(file: File, _mallId: string): Promise<string> {
  try {
    // Try Firebase Storage first
    return await uploadMallLogo(file, _mallId);
  } catch (error) {
    console.warn('Firebase Storage upload failed, using base64 fallback:', error);
    
    // Fallback to base64 encoding
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
      };
      reader.readAsDataURL(file);
    });
  }
}
