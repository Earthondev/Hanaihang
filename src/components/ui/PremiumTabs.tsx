import { motion } from "framer-motion";

const tabs: Array<{ id: "malls"|"stores"|"logos"; label: string; count?: number }> = [
  { id: "malls",  label: "ห้างสรรพสินค้า" },
  { id: "stores", label: "ร้านค้า" },
  { id: "logos",  label: "🖼️ โลโก้ห้าง" },
];

interface PremiumTabsProps {
  active: "malls"|"stores"|"logos";
  onChange: (id: "malls"|"stores"|"logos") => void;
  counts?: Partial<Record<"malls"|"stores"|"logos", number>>;
}

export default function PremiumTabs({
  active, 
  onChange, 
  counts
}: PremiumTabsProps) {
  return (
    <div className="relative">
      <div className="flex gap-6">
        {tabs.map(t => {
          const isActive = active === t.id;
          const count = counts?.[t.id] ?? 0;
          
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={`relative pb-2 text-sm font-medium transition-colors
                ${isActive ? "text-gray-900" : "text-gray-500 hover:text-gray-800"}`}
              aria-label={`แท็บ ${t.label}`}
            >
              <span className="inline-flex items-center gap-2">
                {t.label}
                <span className={`inline-flex h-5 min-w-5 px-1 rounded-full text-[11px] justify-center items-center font-medium
                   ${isActive ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700"}`}>
                  {count}
                </span>
              </span>
              {isActive && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute left-0 -bottom-0.5 h-[3px] w-full rounded-full bg-green-600"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-2 border-b border-gray-200" />
    </div>
  );
}
