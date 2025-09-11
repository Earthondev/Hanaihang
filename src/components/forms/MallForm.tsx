import React, { useState } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '../ui/Card';
import TextField from '../ui/form/fields/TextField';
import PhoneField from '../ui/form/fields/PhoneField';
import UrlField from '../ui/form/fields/UrlField';
import MapPicker from '../ui/form/fields/MapPicker';
import TimeField from '../ui/form/fields/TimeField';
import Switch from '../ui/Switch';
import LogoUpload from '../ui/LogoUpload';
import {
  rawMallSchema,
  mallSchema,
  MallRawInput,
} from '../../validation/mall.schema';
import { useSafeSubmit } from '../../hooks/useSafeSubmit';
import { createMall, updateMall } from '../../lib/firestore';
import { toSlug } from '../../lib/firestore';
import { Mall } from '../../types/mall-system';

interface MallFormProps {
  mode: 'create' | 'edit';
  mall?: Mall;
  onSuccess?: () => void;
}

export default function MallForm({ mode, mall, onSuccess }: MallFormProps) {
  // Initialize isEveryday - assume everyday mode for now since Mall type doesn't have individual day hours
  const [isEveryday, setIsEveryday] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(mall?.logoUrl || null);
  const { isLoading, run } = useSafeSubmit({
    formName: `mall_${mode}`,
    successMessage:
      mode === 'create'
        ? 'สร้างห้างสรรพสินค้าสำเร็จ 🎉'
        : 'อัปเดตห้างสรรพสินค้าสำเร็จ ✅',
    errorMessage:
      mode === 'create'
        ? 'ไม่สามารถสร้างห้างสรรพสินค้าได้'
        : 'ไม่สามารถอัปเดตห้างสรรพสินค้าได้',
  });

  const form = useForm({
    resolver: zodResolver(rawMallSchema),
    defaultValues: {
      displayName: mall?.displayName || '',
      name: mall?.name || '',
      address: mall?.address || '',
      district: mall?.district || '',
      phone: mall?.contact?.phone || '',
      website: mall?.contact?.website || '',
      social: mall?.contact?.social || '',
      facebook: (mall as any)?.facebook || '',
      line: (mall as any)?.line || '',
      lat: mall?.coords?.lat || mall?.lat,
      lng: mall?.coords?.lng || mall?.lng,
      openTime: mall?.hours?.open || mall?.openTime || '10:00',
      closeTime: mall?.hours?.close || mall?.closeTime || '22:00',
      // Individual day hours - empty for now since Mall type doesn't have them
      'hours.mon': '',
      'hours.tue': '',
      'hours.wed': '',
      'hours.thu': '',
      'hours.fri': '',
      'hours.sat': '',
      'hours.sun': '',
    },
  });

  // Handle toggle between everyday and individual hours
  const handleToggleEveryday = (next: boolean) => {
    setIsEveryday(next);
    if (next) {
      // Use everyday hours - clear individual day hours
      ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].forEach(d =>
        form.setValue(`hours.${d}` as any, '', { shouldDirty: true }),
      );
    } else {
      // Use individual hours - clear everyday hours
      form.setValue('openTime', '', { shouldDirty: true });
      form.setValue('closeTime', '', { shouldDirty: true });
    }
  };

  // Normalize website URL to add https if missing
  const normalizeWebsite = (url?: string) => {
    if (!url) return '';
    const v = url.trim();
    if (!v) return '';
    if (v.startsWith('http://') || v.startsWith('https://')) return v;
    return `https://${v}`;
  };

  const handleSubmit = async (values: MallRawInput) => {
    await run(async () => {
      // Generate slug if name is empty
      const name = values.name?.trim() || toSlug(values.displayName || '');

      // Auto-https for website
      const website = normalizeWebsite(values.website);

      // Prevent conflicting values between everyday and individual modes:
      // - If everyday: use open/close, clear individual days
      // - If individual: use individual days, clear open/close
      const nextValues: MallRawInput = {
        ...values,
        name,
        website,
      };
      if (isEveryday) {
        ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].forEach(d => {
          (nextValues as any)[`hours.${d}`] = '';
        });
      } else {
        nextValues.openTime = '';
        nextValues.closeTime = '';
      }

      // Transform the raw form data using the schema
      const transformedData = mallSchema.parse(nextValues);

      const mallData = {
        ...transformedData,
        logoUrl: logoUrl || undefined,
      };

      if (mode === 'create') {
        await createMall(mallData);
      } else if (mall?.id) {
        await updateMall(mall.id, mallData);
      }

      onSuccess?.();
    });
  };

  return (
    <Card>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Logo Upload Section */}
          {mode === 'edit' && mall?.id && (
            <LogoUpload
              _mallId={mall.id}
              currentLogoUrl={mall.logoUrl}
              onLogoChange={setLogoUrl}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextField
              name="displayName"
              label="ชื่อห้างสรรพสินค้า"
              placeholder="เช่น Central Embassy, MBK Center, Terminal 21, Siam Paragon"
              helper="ชื่อที่แสดงในแอปพลิเคชัน"
              required
            />

            <TextField
              name="name"
              label="Slug (ชื่อไฟล์)"
              placeholder="central-rama-3"
              helper="ชื่อไฟล์สำหรับ URL (ถ้าไม่กรอกจะสร้างอัตโนมัติ)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextField
              name="address"
              label="ที่อยู่"
              placeholder="79 Sathupradit Rd, Chong Nonsi, Yan Nawa, Bangkok"
              helper="ที่อยู่เต็มของห้าง"
              required
            />

            <TextField
              name="district"
              label="เขต/อำเภอ"
              placeholder="Yan Nawa"
              helper="เขตหรืออำเภอที่ตั้ง"
              required
            />
          </div>

          {/* Hidden fields for lat/lng */}
          <Controller
            name="lat"
            render={({ field }) => <input type="hidden" {...field} />}
          />
          <Controller
            name="lng"
            render={({ field }) => <input type="hidden" {...field} />}
          />

          <MapPicker
            name="location"
            label="ตำแหน่ง"
            helper="คลิกบนแผนที่เพื่อกำหนดตำแหน่ง"
          />

          <div className="space-y-3">
            <Switch
              checked={isEveryday}
              onCheckedChange={handleToggleEveryday}
              label="ใช้เวลาเดียวกันทุกวัน"
            />

            {isEveryday ? (
              <div className="grid grid-cols-2 gap-3">
                <TimeField
                  name="openTime"
                  label="เวลาเปิด"
                  required
                  helper="เวลาเปิดทำการ"
                />
                <TimeField
                  name="closeTime"
                  label="เวลาปิด"
                  required
                  helper="เวลาปิดทำการ"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <TimeField name="hours.mon" label="จันทร์" />
                <TimeField name="hours.tue" label="อังคาร" />
                <TimeField name="hours.wed" label="พุธ" />
                <TimeField name="hours.thu" label="พฤหัสบดี" />
                <TimeField name="hours.fri" label="ศุกร์" />
                <TimeField name="hours.sat" label="เสาร์" />
                <TimeField name="hours.sun" label="อาทิตย์" />
              </div>
            )}
          </div>

          <TextField
            name="holidayNotice"
            label="วันหยุดนักขัตฤกษ์/ปิดปรับปรุง"
            placeholder="ปิดทุกวันอาทิตย์ หรือ ปิดปรับปรุง 1-15 มกราคม"
            helper="ข้อมูลวันหยุดพิเศษ (ถ้ามี)"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PhoneField
              name="phone"
              label="เบอร์โทร"
              placeholder="02-xxx-xxxx หรือ +66 xx xxx xxxx"
              helper="เบอร์โทรติดต่อห้าง"
            />

            <UrlField
              name="website"
              label="เว็บไซต์"
              placeholder="central.co.th"
              helper="เว็บไซต์อย่างเป็นทางการ (auto-https)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextField
              name="facebook"
              label="Facebook"
              placeholder="facebook.com/centralplaza"
              helper="Facebook page ของห้าง"
            />

            <TextField
              name="line"
              label="Line"
              placeholder="@centralplaza"
              helper="Line Official Account"
            />
          </div>

          <TextField
            name="social"
            label="Social (อื่น ๆ)"
            placeholder="@xyz / tiktok.com/@..."
            helper="Social media อื่น ๆ"
          />

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              aria-busy={isLoading}
            >
              {isLoading
                ? 'กำลังบันทึก...'
                : mode === 'create'
                  ? 'สร้างห้าง'
                  : 'อัปเดตห้าง'}
            </button>
          </div>
        </form>
      </FormProvider>
    </Card>
  );
}
