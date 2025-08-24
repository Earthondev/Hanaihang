import { z } from "zod";

export const mallSchema = z.object({
  displayName: z.string().min(2, "กรุณากรอกชื่อห้าง"),
  slug: z.string().min(1),
  category: z.enum(["shopping_mall", "community_mall", "department_store", "other"]).default("shopping_mall"),
  description: z.string().optional(),
  address: z.string().min(6, "กรอกที่อยู่ให้ครบถ้วน"),
  district: z.string().min(2, "เลือกเขต/อำเภอ"),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  floors: z.number().optional(),
  hours: z
    .union([
      z.object({ 
        mode: z.literal("everyday"), 
        open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "รูปแบบเวลาไม่ถูกต้อง"), 
        close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "รูปแบบเวลาไม่ถูกต้อง") 
      }),
      z.object({
        mode: z.literal("byDay"),
        mon: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "รูปแบบเวลาไม่ถูกต้อง"),
        tue: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "รูปแบบเวลาไม่ถูกต้อง"),
        wed: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "รูปแบบเวลาไม่ถูกต้อง"),
        thu: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "รูปแบบเวลาไม่ถูกต้อง"),
        fri: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "รูปแบบเวลาไม่ถูกต้อง"),
        sat: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "รูปแบบเวลาไม่ถูกต้อง"),
        sun: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "รูปแบบเวลาไม่ถูกต้อง"),
      }),
    ])
    .optional(),
  holidayNotice: z.string().optional(),
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
  facebook: z.string().optional(),
  line: z.string().optional(),
  status: z.enum(["open", "temp_closed"]).default("open"),
  source: z.string().default("manual"),
});

export type MallInput = z.infer<typeof mallSchema>;
