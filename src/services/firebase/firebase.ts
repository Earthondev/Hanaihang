import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration for hanaihang-fe9ec project
// ข้อมูลจาก Firebase Console
const firebaseConfig = {
  apiKey: 'AIzaSyBxHxm6viYLXpifkewwj_JR0w9DVzQjuIs',
  authDomain: 'hanaihang-fe9ec.firebaseapp.com',
  projectId: 'hanaihang-fe9ec',
  storageBucket: 'hanaihang-fe9ec.firebasestorage.app',
  messagingSenderId: '373432002291',
  appId: '1:373432002291:web:87186fbe0b9e24edfbf986',
  measurementId: 'G-FPBPXYFFWT',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;
