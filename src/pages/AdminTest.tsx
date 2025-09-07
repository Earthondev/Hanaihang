import React from 'react';
import { Link } from 'react-router-dom';

const AdminTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Admin Test Page
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Navigation Tests</h2>
          <div className="space-y-4">
            <Link
              to="/admin"
              className="block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 text-center"
            >
              Go to Admin Panel
            </Link>
            <Link
              to="/login"
              className="block bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 text-center"
            >
              Go to Login Page
            </Link>
            <Link
              to="/auth-debug"
              className="block bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 text-center"
            >
              Go to Auth Debug
            </Link>
            <Link
              to="/"
              className="block bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 text-center"
            >
              Go to Home
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <div className="space-y-2">
            <p>
              <strong>URL:</strong> {window.location.href}
            </p>
            <p>
              <strong>Timestamp:</strong> {new Date().toISOString()}
            </p>
            <p>
              <strong>User Agent:</strong> {navigator.userAgent}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTest;
