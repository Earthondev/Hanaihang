import { X, Search } from "lucide-react";

interface FilterBarProps {
  children: React.ReactNode;
  onClear?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  placeholder?: string;
}

export default function FilterBar({
  children, 
  onClear,
  searchValue = "",
  onSearchChange,
  placeholder = "ค้นหา…"
}: FilterBarProps) {
  return (
    <div className="sticky top-0 z-10 -mt-2 mb-4 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60
                    border-b border-gray-200 px-4 py-3 rounded-t-xl">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={placeholder}
            className="h-11 w-full pl-10 pr-10 rounded-xl border border-gray-300 bg-white
                      focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                      transition-all duration-200"
            aria-label="ค้นหา"
          />
          {onClear && searchValue && (
            <button 
              type="button"
              onClick={onClear} 
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 transition-colors"
              aria-label="ล้างการค้นหา"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
