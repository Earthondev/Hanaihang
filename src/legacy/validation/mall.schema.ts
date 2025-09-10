import { z } from "zod";

export const mallSchema = z.object({
  displayName: z.string().min(1, "กรุณากรอกชื่อห้าง").trim(),
  name: z.string().optional(),
  address: z.string().min(1, "กรอกที่อยู่ให้ครบถ้วน").trim(),
  district: z.string().min(1, "เลือกเขต/อำเภอ").trim(),
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
  social: z.string().optional().transform(v => v?.trim() || ""),
  // Schema v2: lat/lng เป็น top-level fields
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  // Support nested location fields from form
  'location.lat': z.union([z.string(), z.number()]).optional().transform(val => {
    if (val === '' || val === undefined || val === null) return undefined;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? undefined : num;
  }).refine(val => val === undefined || (val >= -90 && val <= 90), "ละติจูดต้องอยู่ระหว่าง -90 ถึง 90"),
  'location.lng': z.union([z.string(), z.number()]).optional().transform(val => {
    if (val === '' || val === undefined || val === null) return undefined;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? undefined : num;
  }).refine(val => val === undefined || (val >= -180 && val <= 180), "ลองจิจูดต้องอยู่ระหว่าง -180 ถึง 180"),
  openTime: z.string().regex(/^\d{2}:\d{2}$/, "รูปแบบเวลาต้องเป็น HH:mm").optional(),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/, "รูปแบบเวลาต้องเป็น HH:mm").optional(),
  // Support hours field for non-everyday schedules
  hours: z.string().optional().transform(v => v?.trim() || ""),
}).refine(
  (data) => {
    // Must have either openTime/closeTime OR hours
    const hasTimeFields = data.openTime && data.closeTime;
    const hasHours = data.hours && data.hours.length > 0;
    return hasTimeFields || hasHours;
  },
  { message: "ต้องระบุเวลาเปิด/ปิด หรือรูปแบบเวลาทำการ" }
);

export type MallInput = z.infer<typeof mallSchema>;