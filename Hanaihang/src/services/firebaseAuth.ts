import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

import { auth, db } from '../config/firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'admin' | 'editor' | 'viewer';
  lastLogin: string;
}

// Mock admin users for development (fallback)
const ADMIN_USERS = [
  {
    email: 'earthlikemwbb@gmail.com',
    password: '!Tonfern@5126',
    displayName: 'Admin',
    role: 'admin' as const
  },
  {
    email: 'admin@haanaihang.com',
    password: 'admin123',
    displayName: 'Admin',
    role: 'admin' as const
  },
  {
    email: 'editor@haanaihang.com',
    password: 'editor123',
    displayName: 'Editor',
    role: 'editor' as const
  }
];

// Helper to get or create user in Firestore
async function getOrCreateUserInFirestore(user: any): Promise<AuthUser> {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  let role: AuthUser['role'] = 'viewer';

  if (userSnap.exists()) {
    const data = userSnap.data();
    role = data.role || 'viewer';

    // Update last login
    await setDoc(userRef, {
      lastLogin: serverTimestamp(),
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    }, { merge: true });

  } else {
    // Check if email matches hardcoded admins for auto-provisioning
    const mockMatch = ADMIN_USERS.find(u => u.email === user.email);
    if (mockMatch) {
      role = mockMatch.role;
    }

    // Create new user document
    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    });
  }

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    role,
    lastLogin: new Date().toISOString()
  };
}

export const firebaseAuth = {
  // Sign in with email and password
  async signIn(email: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      console.log('firebaseAuth.signIn: Attempting sign in for:', email);

      // Check if it's a mock admin user (for development - purely local)
      // Note: This bypasses Firebase Auth completely! Only use if Firebase Auth is not set up.
      /*
      const mockUser = ADMIN_USERS.find(u => u.email === email && u.password === password);
      if (mockUser) {
        // ... (Mock user logic skipped for production readiness)
      }
      */

      // Real Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user role from Firestore
      const userData = await getOrCreateUserInFirestore(user);

      // Store user data
      localStorage.setItem('firebaseUser', JSON.stringify(userData));

      return {
        success: true,
        user: userData
      };
    } catch (error: any) {
      console.error('Sign in error:', error);

      // Handle specific Firebase auth errors
      let errorMessage = 'Failed to sign in';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        errorMessage = 'ไม่พบผู้ใช้นี้ หรือรหัสผ่านไม่ถูกต้อง';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'รหัสผ่านไม่ถูกต้อง';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'อีเมลไม่ถูกต้อง';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'ลองเข้าสู่ระบบมากเกินไป กรุณารอสักครู่';
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  },

  // Sign out
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      await signOut(auth);
      localStorage.removeItem('firebaseUser');
      localStorage.removeItem('firebaseToken');
      return { success: true };
    } catch (error: any) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign out'
      };
    }
  },

  // Get current user
  getCurrentUser(): AuthUser | null {
    try {
      const userData = localStorage.getItem('firebaseUser');
      if (userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    // Use real Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user role from Firestore
          const userData = await getOrCreateUserInFirestore(firebaseUser);

          // Store user data
          localStorage.setItem('firebaseUser', JSON.stringify(userData));
          callback(userData);
        } catch (err) {
          console.error('Error fetching user profile:', err);
          // Fallback if Firestore fails
          const fallbackUser: AuthUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            role: 'viewer',
            lastLogin: new Date().toISOString()
          };
          callback(fallbackUser);
        }
      } else {
        // User is signed out
        localStorage.removeItem('firebaseUser');
        localStorage.removeItem('firebaseToken');
        callback(null);
      }
    });

    return unsubscribe;
  },

  // Create new user (for admin management)
  async createUser(email: string, password: string, displayName: string, role: 'admin' | 'editor' | 'viewer'): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile
      await updateProfile(user, {
        displayName
      });

      // Create user doc in Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        email: user.email,
        displayName,
        photoURL: user.photoURL,
        role,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });

      const userData: AuthUser = {
        uid: user.uid,
        email: user.email,
        displayName,
        photoURL: user.photoURL,
        role,
        lastLogin: new Date().toISOString()
      };

      return {
        success: true,
        user: userData
      };
    } catch (error: any) {
      console.error('Create user error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create user'
      };
    }
  },

  // Reset password
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: error.message || 'Failed to reset password'
      };
    }
  }
};
