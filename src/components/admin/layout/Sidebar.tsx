import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Store,
    ShoppingBag,
    Settings,
    LogOut,
    ChevronLeft,
    Grid
} from 'lucide-react';

import { useAuth } from '@/config/contexts/AuthContext';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const menuItems = [
        {
            label: 'ภาพรวม',
            path: '/admin',
            exact: true,
            icon: LayoutDashboard
        },
        {
            label: 'ห้างสรรพสินค้า',
            path: '/admin/malls',
            icon: Store
        },
        {
            label: 'ร้านค้า',
            path: '/admin/stores',
            icon: ShoppingBag
        },
        {
            label: 'หมวดหมู่',
            path: '/admin/categories',
            icon: Grid
        }
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-screen sticky top-0 font-prompt z-20 hidden lg:flex">
            {/* Brand */}
            <div className="h-16 flex items-center px-6 border-b border-gray-100">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                    <span className="text-white font-bold text-lg">H</span>
                </div>
                <span className="text-lg font-bold text-gray-900 font-kanit">
                    HaaNai<span className="text-primary-600">Hang</span>
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">
                    การจัดการ
                </div>
                {menuItems.map((item) => {
                    const isActive = item.exact
                        ? location.pathname === item.path
                        : location.pathname.startsWith(item.path);

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.exact}
                            className={({ isActive }) => `
                flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group
                ${isActive
                                    ? 'bg-primary-50 text-primary-700 font-medium shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
              `}
                        >
                            <item.icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                                }`} />
                            {item.label}
                        </NavLink>
                    );
                })}

                <div className="mt-8 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">
                    ระบบ
                </div>
                <NavLink
                    to="/admin/settings"
                    className={({ isActive }) => `
            flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group
            ${isActive
                            ? 'bg-primary-50 text-primary-700 font-medium shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
            `}
                >
                    <Settings className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-500" />
                    ตั้งค่า
                </NavLink>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors mb-1"
                >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    กลับไปหน้าแอพ
                </button>
                <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    ออกจากระบบ
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
