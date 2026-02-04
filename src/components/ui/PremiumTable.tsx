import { Pencil, Trash2, Phone } from "lucide-react";

interface TableRow {
  key: string; // ใช้ store._path หรือ storeRowKey
  name: string;
  meta?: string;     // เบอร์/slug
  badge?: string;    // category
  mall?: string;     // mall name
  position?: string; // ชั้น/ยูนิต
}

interface PremiumTableProps {
  rows: TableRow[];
  onEdit?: (key: string) => void;
  onDelete?: (key: string) => void;
  deletingKey?: string | null;
  columns?: string[];
}

export function PremiumTable({
  rows, 
  onEdit, 
  onDelete,
  deletingKey,
  columns = ["ร้านค้า", "หมวดหมู่", "ห้าง", "ตำแหน่ง", "จัดการ"]
}: PremiumTableProps) {
  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map(h => (
              <th key={h} className="px-8 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {rows.map(r => {
            const isDeleting = deletingKey === r.key;
            
            return (
              <tr key={r.key} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-8 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 grid place-content-center">
                      <span className="text-sm font-semibold text-blue-700">
                        {r.name[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{r.name || '—'}</div>
                      <div className="text-xs text-gray-500 inline-flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" /> 
                        {r.meta || "ไม่มีเบอร์โทร"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {r.badge || "—"}
                  </span>
                </td>
                <td className="px-8 py-4 text-sm text-gray-900">{r.mall || "—"}</td>
                <td className="px-8 py-4 text-sm text-gray-900">{r.position || "—"}</td>
                <td className="px-8 py-4">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit?.(r.key)}
                      className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors duration-150 active:scale-[0.98]"
                      title="แก้ไข" 
                      aria-label="แก้ไข"
                      disabled={isDeleting}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete?.(r.key)}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-150 active:scale-[0.98] disabled:opacity-50"
                      title="ลบ" 
                      aria-label="ลบ"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" aria-hidden="true"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
