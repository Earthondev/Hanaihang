import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../config/firebase';

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

export const firebaseAuth = {
  // Sign in with email and password
  async signIn(email: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      console.log('firebaseAuth.signIn: Attempting sign in for:', email);
      
      // Check if it's a mock admin user (for development)
      const mockUser = ADMIN_USERS.find(u => u.email === email && u.password === password);
      
      if (mockUser) {
        console.log('firebaseAuth.signIn: Mock user found:', mockUser);
        
        // Create a mock Firebase user for development
        const mockFirebaseUser: AuthUser = {
          uid: `mock-${Date.now()}`,
          email: mockUser.email,
          displayName: mockUser.displayName,
          photoURL: null,
          role: mockUser.role,
          lastLogin: new Date().toISOString()
        };
        
        console.log('firebaseAuth.signIn: Created mock user:', mockFirebaseUser);
        
        // Store in localStorage for development
        localStorage.setItem('firebaseUser', JSON.stringify(mockFirebaseUser));
        localStorage.setItem('firebaseToken', `mock-token-${Date.now()}`);
        
        console.log('firebaseAuth.signIn: Stored user in localStorage');
        
        return {
          success: true,
          user: mockFirebaseUser
        };
      }
      
      // Real Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user role from Firestore (you'll need to implement this)
      const userData: AuthUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'admin', // Default role, should be fetched from Firestore
        lastLogin: new Date().toISOString()
      };
      
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
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'ไม่พบผู้ใช้นี้';
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
      console.log('firebaseAuth.getCurrentUser: Checking localStorage');
      const userData = localStorage.getItem('firebaseUser');
      console.log('firebaseAuth.getCurrentUser: Raw userData:', userData);
      
      if (userData) {
        const parsedUser = JSON.parse(userData);
        console.log('firebaseAuth.getCurrentUser: Parsed user:', parsedUser);
        return parsedUser;
      }
      console.log('firebaseAuth.getCurrentUser: No user data found');
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
        // Get user role from Firestore (you'll need to implement this)
        const userData: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          role: 'admin', // Default role, should be fetched from Firestore
          lastLogin: new Date().toISOString()
        };
        
        // Store user data
        localStorage.setItem('firebaseUser', JSON.stringify(userData));
        callback(userData);
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
