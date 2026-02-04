import { RefreshCw, LogOut, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

interface AdminHeaderProps {
  user?: { email?: string };
  onRefresh: () => void;
  onLogout: () => void;
  dataUpdatedAt?: number;
  isRefreshing?: boolean;
}

export default function AdminHeader({ 
  user, 
  onRefresh, 
  onLogout, 
  dataUpdatedAt,
  isRefreshing = false 
}: AdminHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-green-100 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-green-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-gray-500">
            อัปเดตล่าสุด: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleString("th-TH") : "กำลังโหลด..."}
          </span>

          <button
            type="button"
            onClick={onRefresh}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 hover:shadow-sm transition-all duration-200 active:scale-[0.98]"
            title="รีเฟรชข้อมูล" 
            aria-label="รีเฟรชข้อมูล"
            disabled={isRefreshing}
          >
            <motion.span 
              animate={{ rotate: isRefreshing ? 360 : 0 }} 
              transition={{ duration: 0.6, repeat: isRefreshing ? Infinity : 0 }}
            >
              <RefreshCw className="w-5 h-5 text-gray-700" />
            </motion.span>
          </button>

          <div className="flex items-center gap-2 pl-3 border-l">
            <div className="w-8 h-8 rounded-full bg-gray-200 grid place-content-center">
              <span className="text-sm font-medium text-gray-700">
                {user?.email?.[0]?.toUpperCase()}
              </span>
            </div>
            <span className="hidden sm:block text-sm text-gray-700">{user?.email}</span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-all duration-200 active:scale-[0.98]"
            title="ออกจากระบบ" 
            aria-label="ออกจากระบบ"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
