import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

import { useAuth } from '@/config/contexts/AuthContext';

interface AdminRouteProps {
    children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
    const { user, isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    useEffect(() => {
        // Debug info
        if (!isLoading) {
            console.log('[AdminRoute] Access Check:', {
                authenticated: isAuthenticated,
                role: user?.role,
                path: location.pathname
            });
        }
    }, [isAuthenticated, user, isLoading, location]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center font-prompt">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">กำลังตรวจสอบสิทธิ์...</p>
                </div>
            </div>
        );
    }

    // 1. Check Authentication
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. Check Role
    if (user.role !== 'admin') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-prompt">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl text-center border border-red-100">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
                    <p className="text-gray-500 mb-6">
                        บัญชีของคุณ ({user.email}) ไม่ได้รับอนุญาตให้เข้าถึงส่วนผู้ดูแลระบบ
                    </p>
                    <button
                        onClick={() => window.history.back()}
                        className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                    >
                        กลับไปหน้าก่อนหน้า
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default AdminRoute;
