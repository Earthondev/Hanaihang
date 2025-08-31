// Debug utility for authentication issues
export const debugAuth = {
  // Check localStorage
  checkLocalStorage() {
    console.log('=== Debug: LocalStorage Check ===');
    const firebaseUser = localStorage.getItem('firebaseUser');
    const firebaseToken = localStorage.getItem('firebaseToken');
    
    console.log('firebaseUser:', firebaseUser);
    console.log('firebaseToken:', firebaseToken);
    
    if (firebaseUser) {
      try {
        const parsed = JSON.parse(firebaseUser);
        console.log('Parsed user:', parsed);
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  },

  // Clear all auth data
  clearAuthData() {
    console.log('=== Debug: Clearing Auth Data ===');
    localStorage.removeItem('firebaseUser');
    localStorage.removeItem('firebaseToken');
    console.log('Auth data cleared');
  },

  // Test mock login
  testMockLogin() {
    console.log('=== Debug: Testing Mock Login ===');
    const mockUser = {
      uid: `mock-${Date.now()}`,
      email: 'admin@haanaihang.com',
      displayName: 'Admin',
      photoURL: null,
      role: 'admin' as const,
      lastLogin: new Date().toISOString()
    };
    
    localStorage.setItem('firebaseUser', JSON.stringify(mockUser));
    localStorage.setItem('firebaseToken', `mock-token-${Date.now()}`);
    
    console.log('Mock user stored:', mockUser);
  }
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugAuth;
}
