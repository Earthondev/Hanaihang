import { z } from "zod";

export const mallSchema = z.object({
  displayName: z.string().min(2, "กรุณากรอกชื่อห้างอย่างน้อย 2 ตัวอักษร"),
  name: z.string().min(2, "กรุณากรอกชื่อห้างอย่างน้อย 2 ตัวอักษร"),
  district: z.string().min(1, "กรุณาเลือกเขต/อำเภอ"),
  address: z.string().min(5, "กรุณากรอกที่อยู่ให้ครบถ้วน"),
  contact: z.object({
    phone: z.string().optional().refine(
      (v) => !v || /^\+?\d{8,15}$/.test(v),
      "รูปแบบเบอร์โทรไม่ถูกต้อง"
    ),
    website: z.string().optional().refine(
      (v) => !v || /^https?:\/\/.+/i.test(v),
      "URL ต้องขึ้นต้นด้วย http(s)://"
    ),
    social: z.string().optional()
  }).optional(),
  hours: z.object({
    open: z.string().min(1, "กรุณากรอกเวลาเปิด"),
    close: z.string().min(1, "กรุณากรอกเวลาปิด")
  }).optional(),
  coords: z.object({
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional()
  }).optional()
});

export type MallInput = z.infer<typeof mallSchema>;
