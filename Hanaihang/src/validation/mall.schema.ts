import { z } from 'zod';

// สร้าง slug จาก displayName รองรับไทย/อังกฤษ
export function toSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^\u0E00-\u0E7Fa-z0-9\s-]/g, '') // ไทย อังกฤษ ตัวเลข เว้นวรรค ขีด
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// รูปแบบเวลา HH:MM (24 ชม.) - ใช้ใน superRefine
// const hhmm = z
//   .string()
//   .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "รูปแบบเวลาไม่ถูกต้อง (เช่น 10:00)");

// เบอร์ไทยแบบยืดหยุ่น: ว่าง, 0XXXXXXXXX (อย่างน้อย 7–15 ตัว), หรือ +66…
const phoneSchema = z
  .string()
  .transform(v => (v ?? '').trim())
  .refine(
    v =>
      v === '' || /^0[\d\s-]{6,14}$/.test(v) || /^\+66[\d\s-]{6,14}$/.test(v),
    'รูปแบบเบอร์ไม่ถูกต้อง',
  );

// เว็บไซต์: ว่าง หรือ http(s)://...
const websiteSchema = z
  .string()
  .transform(v => (v ?? '').trim())
  .refine(
    v => v === '' || /^https?:\/\/.+/.test(v),
    'ต้องขึ้นต้นด้วย http:// หรือ https://',
  )
  .transform(v => (v === '' ? undefined : v));

// พิกัด: รับทั้ง coerce number และ optional - ใช้ใน rawMallSchema
// const latSchema = z.coerce.number().min(-90).max(90);
// const lngSchema = z.coerce.number().min(-180).max(180);

// Raw lat/lng schemas for form input (before coercion)
const rawLatSchema = z.union([z.number(), z.string()]).optional();
const rawLngSchema = z.union([z.number(), z.string()]).optional();

// อินพุตดิบจากฟอร์ม (ก่อน normalize)
export const rawMallSchema = z.object({
  displayName: z.string().trim().min(2, 'กรุณากรอกชื่อห้าง'),
  name: z.string().trim().optional(), // slug (optional; auto-gen if missing)
  address: z.string().trim().min(6, 'กรอกที่อยู่ให้ครบถ้วน'),
  district: z.string().trim().min(2, 'เลือกเขต/อำเภอ'),
  phone: phoneSchema.optional(),
  website: websiteSchema.optional(),
  social: z
    .string()
    .transform(v => (v ?? '').trim())
    .optional(),
  facebook: z
    .string()
    .optional()
    .transform(v => v?.trim() || ''),
  line: z
    .string()
    .optional()
    .transform(v => v?.trim() || ''),

  // รับทั้ง location และ/หรือ lat,lng ตรง ๆ
  location: z
    .object({
      lat: rawLatSchema,
      lng: rawLngSchema,
    })
    .optional(),
  lat: rawLatSchema,
  lng: rawLngSchema,

  openTime: z
    .string()
    .transform(v => (v ?? '').trim())
    .optional(),
  closeTime: z
    .string()
    .transform(v => (v ?? '').trim())
    .optional(),

  // Individual day hours (for non-everyday schedules)
  'hours.mon': z
    .string()
    .transform(v => (v ?? '').trim())
    .optional(),
  'hours.tue': z
    .string()
    .transform(v => (v ?? '').trim())
    .optional(),
  'hours.wed': z
    .string()
    .transform(v => (v ?? '').trim())
    .optional(),
  'hours.thu': z
    .string()
    .transform(v => (v ?? '').trim())
    .optional(),
  'hours.fri': z
    .string()
    .transform(v => (v ?? '').trim())
    .optional(),
  'hours.sat': z
    .string()
    .transform(v => (v ?? '').trim())
    .optional(),
  'hours.sun': z
    .string()
    .transform(v => (v ?? '').trim())
    .optional(),
});

// หลักการ normalize:
//  - ถ้ามี location ใช้มันก่อน; ถ้าไม่มีค่อยดู lat/lng ตรง ๆ
//  - lat/lng ต้องเป็น "คู่" หรือ "ว่างทั้งคู่"
//  - เวลา: ว่างได้ทั้งคู่ หรือถ้ามีอย่างน้อย 1 ตัว → ตรวจ HH:MM ทั้งคู่
export const mallSchema = rawMallSchema
  .superRefine((data, ctx) => {
    // รวมพิกัด - แปลงเป็น number ก่อน
    const locLat = data.location?.lat;
    const locLng = data.location?.lng;
    const topLat = data.lat;
    const topLng = data.lng;

    // แปลงเป็น number ถ้าเป็น string
    const parseCoord = (val: unknown): number | undefined => {
      if (val === undefined || val === null || val === '') return undefined;
      const num =
        typeof val === 'string'
          ? parseFloat(val)
          : typeof val === 'number'
            ? val
            : undefined;
      return num !== undefined && !isNaN(num) ? num : undefined;
    };

    const finalLat = parseCoord(locLat ?? topLat);
    const finalLng = parseCoord(locLng ?? topLng);

    // ต้องมาคู่กัน หรือไม่มาก็ทั้งคู่
    const bothEmpty = finalLat === undefined && finalLng === undefined;
    const bothPresent = finalLat !== undefined && finalLng !== undefined;
    if (!bothEmpty && !bothPresent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ต้องระบุพิกัดให้ครบทั้ง lat และ lng',
        path: ['location'],
      });
    }

    // เวลา: ถ้ามีตัวใดตัวหนึ่ง ต้องตรวจทั้งคู่และต้อง HH:MM
    const hasAnyTime = !!(data.openTime || data.closeTime);
    if (hasAnyTime) {
      if (!data.openTime || !data.closeTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'ต้องระบุเวลาเปิดและปิดให้ครบ',
          path: ['openTime'],
        });
      } else {
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(data.openTime)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'รูปแบบเวลาเปิดไม่ถูกต้อง (เช่น 10:00)',
            path: ['openTime'],
          });
        }
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(data.closeTime)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'รูปแบบเวลาปิดไม่ถูกต้อง (เช่น 22:00)',
            path: ['closeTime'],
          });
        }
      }
    }

    // ตรวจสอบ individual day hours ถ้ามี
    const dayHours = [
      { key: 'hours.mon', value: data['hours.mon'] },
      { key: 'hours.tue', value: data['hours.tue'] },
      { key: 'hours.wed', value: data['hours.wed'] },
      { key: 'hours.thu', value: data['hours.thu'] },
      { key: 'hours.fri', value: data['hours.fri'] },
      { key: 'hours.sat', value: data['hours.sat'] },
      { key: 'hours.sun', value: data['hours.sun'] },
    ];

    for (const dayHour of dayHours) {
      if (dayHour.value && dayHour.value.trim()) {
        // ตรวจสอบรูปแบบเวลา HH:MM-HH:MM หรือ HH:MM
        const timePattern =
          /^([01]\d|2[0-3]):[0-5]\d(-([01]\d|2[0-3]):[0-5]\d)?$/;
        if (!timePattern.test(dayHour.value)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `รูปแบบเวลา${dayHour.key}ไม่ถูกต้อง (เช่น 10:00-22:00 หรือ 10:00)`,
            path: [dayHour.key],
          });
        }
      }
    }
  })
  .transform(data => {
    // เลือกพิกัดสุดท้าย - แปลงเป็น number
    const parseCoord = (val: unknown): number | undefined => {
      if (val === undefined || val === null || val === '') return undefined;
      const num =
        typeof val === 'string'
          ? parseFloat(val)
          : typeof val === 'number'
            ? val
            : undefined;
      return num !== undefined && !isNaN(num) ? num : undefined;
    };

    const finalLat = parseCoord(data.location?.lat ?? data.lat);
    const finalLng = parseCoord(data.location?.lng ?? data.lng);

    // สร้าง slug ถ้าไม่มี
    const slug = (data.name && data.name.trim()) || toSlug(data.displayName);

    // ปรับค่าเวลาว่างให้เป็น "" (หรือจะให้ undefined ก็ได้แล้วแต่สคีมาฝั่ง DB)
    const openTime = data.openTime && data.openTime !== '' ? data.openTime : '';
    const closeTime =
      data.closeTime && data.closeTime !== '' ? data.closeTime : '';

    // คืนค่าที่พร้อมเขียน Firestore (สไตล์ v2)
    return {
      displayName: data.displayName.trim(),
      name: slug,
      address: data.address.trim(),
      district: data.district.trim(),
      phone: (data.phone ?? '').trim(),
      website: data.website, // undefined ถ้าเว้นว่าง
      social: (data.social ?? '').trim(),
      facebook: (data.facebook ?? '').trim(),
      line: (data.line ?? '').trim(),

      lat: finalLat ?? undefined,
      lng: finalLng ?? undefined,

      openTime,
      closeTime,

      // Individual day hours
      'hours.mon': (data['hours.mon'] ?? '').trim(),
      'hours.tue': (data['hours.tue'] ?? '').trim(),
      'hours.wed': (data['hours.wed'] ?? '').trim(),
      'hours.thu': (data['hours.thu'] ?? '').trim(),
      'hours.fri': (data['hours.fri'] ?? '').trim(),
      'hours.sat': (data['hours.sat'] ?? '').trim(),
      'hours.sun': (data['hours.sun'] ?? '').trim(),
    };
  });

// Raw input type for forms (before transformation)
export type MallRawInput = z.infer<typeof rawMallSchema>;

// Transformed output type (after schema processing)
export type MallInput = z.infer<typeof mallSchema>;
