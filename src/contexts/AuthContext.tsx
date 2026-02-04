import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

import { firebaseAuth, AuthUser } from '../services/firebaseAuth';

interface User extends AuthUser { }

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      console.log('Login attempt:', username);
      const response = await firebaseAuth.signIn(username, password);

      console.log('Login response:', response);

      if (response.success && response.user) {
        setUser(response.user);
        console.log('User set successfully:', response.user);
        return { success: true, user: response.user };
      }
      return { success: false, error: response.error };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const register = async (email: string, password: string, displayName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await firebaseAuth.createUser(email, password, displayName, 'viewer');
      if (response.success && response.user) {
        setUser(response.user);
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await firebaseAuth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  useEffect(() => {
    console.log('AuthProvider: Initializing auth state');

    // Check for existing user in localStorage first (for development)
    const existingUser = firebaseAuth.getCurrentUser();
    console.log('AuthProvider: Existing user from localStorage:', existingUser);

    if (existingUser) {
      setUser(existingUser);
      setIsLoading(false);
      console.log('AuthProvider: Set existing user, loading complete');
      return;
    }

    // Use Firebase auth state listener
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      console.log('AuthProvider: Auth state changed:', user);
      setUser(user);
      setIsLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
