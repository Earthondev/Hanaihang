import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { firebaseAuth, AuthUser } from '../../legacy/services/firebaseAuth';

interface User extends AuthUser {}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
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



  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('Login attempt:', username);
      const response = await firebaseAuth.signIn(username, password);
      
      console.log('Login response:', response);
      
      if (response.success && response.user) {
        setUser(response.user);
        console.log('User set successfully:', response.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
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
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
