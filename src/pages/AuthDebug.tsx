import React, { useState, useEffect } from 'react';

import { useAuth } from '@/config/contexts/AuthContext';
import { firebaseAuth } from '@/legacy/services/firebaseAuth';

const AuthDebug: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const gatherDebugInfo = async () => {
      const info = {
        localStorage: {
          firebaseUser: localStorage.getItem('firebaseUser'),
          firebaseToken: localStorage.getItem('firebaseToken'),
        },
        currentUser: firebaseAuth.getCurrentUser(),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };
      setDebugInfo(info);
    };

    gatherDebugInfo();
  }, []);

  const testLogin = async () => {
    try {
      const result = await firebaseAuth.signIn(
        'earthlikemwbb@gmail.com',
        '!Tonfern@5126',
      );
      console.log('Test login result:', result);
      setDebugInfo(prev => ({ ...prev, testLoginResult: result }));
    } catch (error) {
      console.error('Test login error:', error);
      setDebugInfo(prev => ({ ...prev, testLoginError: error }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Auth Debug Page
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Auth Context Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Auth Context Status</h2>
            <div className="space-y-2">
              <p>
                <strong>isLoading:</strong> {isLoading ? 'true' : 'false'}
              </p>
              <p>
                <strong>isAuthenticated:</strong>{' '}
                {isAuthenticated ? 'true' : 'false'}
              </p>
              <p>
                <strong>user:</strong>{' '}
                {user ? JSON.stringify(user, null, 2) : 'null'}
              </p>
            </div>
          </div>

          {/* Debug Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Debug Info</h2>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-64">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>

          {/* Test Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
            <div className="space-y-4">
              <button
                onClick={testLogin}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Test Login
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
              >
                Reload Page
              </button>
            </div>
          </div>

          {/* Firebase Config */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Firebase Config</h2>
            <div className="text-sm space-y-1">
              <p>
                <strong>Project ID:</strong> hanaihang-fe9ec
              </p>
              <p>
                <strong>Auth Domain:</strong> hanaihang-fe9ec.firebaseapp.com
              </p>
              <p>
                <strong>API Key:</strong>{' '}
                AIzaSyBxHxm6viYLXpifkewwj_JR0w9DVzQjuIs
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthDebug;
