import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';

import { useAuth } from '@/config/contexts/AuthContext';

interface TopbarProps {
    onMenuClick?: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
    const { user } = useAuth();

    return (
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-10 font-prompt">
            <div className="h-full px-4 sm:px-6 flex items-center justify-between">
                <div className="flex items-center">
                    <button
                        onClick={onMenuClick}
                        className="p-2 -ml-2 mr-2 text-gray-500 hover:text-gray-700 lg:hidden rounded-lg hover:bg-gray-100"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    {/* Breadcrumbs or Page Title could go here */}
                    <div className="hidden md:block text-sm text-gray-500">
                        แดชบอร์ดผู้ดูแลระบบ
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    {/* Simple Search - Visual only for now */}
                    <div className="hidden md:flex items-center relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3" />
                        <input
                            type="text"
                            placeholder="ค้นหา..."
                            className="pl-9 pr-4 py-1.5 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary-100 w-64 transition-all"
                        />
                    </div>

                    <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

                    {/* User Profile */}
                    <div className="flex items-center space-x-3">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-medium text-gray-900">{user?.displayName || 'Admin'}</div>
                            <div className="text-xs text-gray-500 capitalize">{user?.role || 'User'}</div>
                        </div>
                        <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                            <span className="text-primary-700 font-semibold text-sm">
                                {user?.displayName?.charAt(0).toUpperCase() || 'A'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Topbar;
