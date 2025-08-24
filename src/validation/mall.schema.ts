import { z } from "zod";

export const mallSchema = z.object({
  displayName: z.string().min(2, "กรุณากรอกชื่อห้าง"),
  name: z.string().optional(),
  address: z.string().min(6, "กรอกที่อยู่ให้ครบถ้วน"),
  district: z.string().min(2, "เลือกเขต/อำเภอ"),
  phone: z
    .string()
    .optional()
    .transform(v => v?.trim() || "")
    .refine(v => v === "" || /^\+?\d[\d\s-]{6,}$/.test(v), "รูปแบบเบอร์ไม่ถูกต้อง"),
  website: z
    .string()
    .optional()
    .transform(v => v?.trim() || "")
    .refine(v => v === "" || /^https?:\/\/.+/.test(v), "ต้องขึ้นต้นด้วย http:// หรือ https://"),
  social: z.string().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
});

export type MallInput = z.infer<typeof mallSchema>;
