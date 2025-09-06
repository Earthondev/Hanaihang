import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Card from '../ui/Card';
import TextField from '../ui/form/fields/TextField';
import SelectField from '../ui/form/fields/SelectField';
import PhoneField from '../ui/form/fields/PhoneField';
import UrlField from '../ui/form/fields/UrlField';
import MapPicker from '../ui/form/fields/MapPicker';
import TimeField from '../ui/form/fields/TimeField';
import Switch from '../ui/Switch';
import LogoUpload from '../ui/LogoUpload';
import { mallSchema, MallInput } from '../../validation/mall.schema';
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
  const [isEveryday, setIsEveryday] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(mall?.logoUrl || null);
  const { isLoading, run } = useSafeSubmit({
    formName: `mall_${mode}`,
    successMessage: mode === 'create' ? "สร้างห้างสรรพสินค้าสำเร็จ 🎉" : "อัปเดตห้างสรรพสินค้าสำเร็จ ✅",
    errorMessage: mode === 'create' ? "ไม่สามารถสร้างห้างสรรพสินค้าได้" : "ไม่สามารถอัปเดตห้างสรรพสินค้าได้"
  });

  const form = useForm<MallInput>({
    resolver: zodResolver(mallSchema),
    defaultValues: {
      displayName: mall?.displayName || '',
      name: mall?.name || '',
      address: mall?.address || '',
      district: mall?.district || '',
      phone: mall?.contact?.phone || '',
      website: mall?.contact?.website || '',
      social: mall?.contact?.social || '',
      lat: mall?.coords?.lat,
      lng: mall?.coords?.lng,
      openTime: mall?.hours?.open || '10:00',
      closeTime: mall?.hours?.close || '22:00',
    }
  });

  const handleSubmit = async (values: MallInput) => {
    await run(async () => {
      const mallData = {
        displayName: values.displayName,
        name: values.name || toSlug(values.displayName),
        address: values.address,
        district: values.district,
        phone: values.phone,
        website: values.website,
        social: values.social,
        lat: values.lat,
        lng: values.lng,
        openTime: values.openTime,
        closeTime: values.closeTime,
        logoUrl: logoUrl,
      };

      if (mode === 'create') {
        await createMall(mallData);
      } else if (mall?.id) {
        await updateMall(mall.id, mallData);
      }
      
      onSuccess?.();
    });
  };

  const handleWebsiteBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
      form.setValue('website', `https://${value}`);
    }
  };

  return (
    <Card>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Logo Upload Section */}
          {mode === 'edit' && mall?.id && (
            <LogoUpload
              mallId={mall.id}
              currentLogoUrl={mall.logoUrl}
              onLogoChange={setLogoUrl}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextField
              name="displayName"
              label="ชื่อห้างสรรพสินค้า"
              placeholder="เช่น Central Rama 3, Siam Paragon"
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

          <MapPicker
            name="location"
            label="ตำแหน่ง"
            helper="คลิกบนแผนที่เพื่อกำหนดตำแหน่ง"
          />

          <div className="space-y-3">
            <Switch
              checked={isEveryday}
              onCheckedChange={setIsEveryday}
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

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              aria-busy={isLoading}
            >
              {isLoading ? 'กำลังบันทึก...' : mode === 'create' ? 'สร้างห้าง' : 'อัปเดตห้าง'}
            </button>
          </div>
        </form>
      </FormProvider>
    </Card>
  );
}
