import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '@/config/contexts/AuthContext';

const AdminLayout: React.FC = () => {
    const { user, isLoading } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    if (isLoading) return null; // Or skeleton

    if (!user || user.role !== 'admin') {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex font-prompt">
            {/* Sidebar for Desktop */}
            <Sidebar />

            {/* Mobile Sidebar Overlay would go here (omitted for v1 simplicity) */}

            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                <Topbar onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
