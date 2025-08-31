import { z } from "zod";

import { StoreCategory, StoreStatus } from "../../types/mall-system";

export const storeSchema = z.object({
  mallId: z.string().min(1, "กรุณาเลือกห้าง"),
  name: z.string().min(2, "กรุณากรอกชื่อร้านอย่างน้อย 2 ตัวอักษร"),
  category: z.enum(['Fashion', 'Beauty', 'Electronics', 'Food & Beverage', 'Sports', 'Books', 'Home & Garden', 'Health & Pharmacy', 'Entertainment', 'Services'] as const),
  floorId: z.string().min(1, "กรุณาเลือกชั้น"),
  unit: z.string().optional(),
  phone: z.string().optional().refine(
    (v) => !v || /^\+?\d{8,15}$/.test(v),
    "รูปแบบเบอร์โทรไม่ถูกต้อง"
  ),
  hours: z.string().optional(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  status: z.enum(['Active', 'Maintenance', 'Closed'] as const)
});

export type StoreInput = z.infer<typeof storeSchema>;
