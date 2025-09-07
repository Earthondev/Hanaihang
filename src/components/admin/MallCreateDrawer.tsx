import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { SlideOver } from '../ui/SlideOver';
import TextField from '../ui/form/fields/TextField';
import PhoneField from '../ui/form/fields/PhoneField';
import UrlField from '../ui/form/fields/UrlField';
import MapPicker from '../ui/form/fields/MapPicker';
import TimeField from '../ui/form/fields/TimeField';
import Switch from '../ui/Switch';
import { mallSchema, MallInput } from '../../validation/mall.schema';
import { useSafeSubmit } from '../../hooks/useSafeSubmit';
import { createMall } from '../../lib/firestore';
import { toSlug } from '../../lib/firestore';

interface MallCreateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MallCreateDrawer({ open, onOpenChange }: MallCreateDrawerProps) {
  const [isEveryday, setIsEveryday] = useState(true);
  const { isLoading, run } = useSafeSubmit({
    formName: 'mall_create',
    successMessage: "สร้างห้างสรรพสินค้าสำเร็จ 🎉",
    errorMessage: "ไม่สามารถสร้างห้างสรรพสินค้าได้"
  });

  const form = useForm<MallInput>({
    resolver: zodResolver(mallSchema),
    defaultValues: {
      displayName: '',
      name: '',
      address: '',
      district: '',
      phone: '',
      website: '',
      social: '',
      openTime: '10:00',
      closeTime: '22:00',
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
      };

      const _newMall = await createMall(mallData);
      
      // Note: Logo upload will be handled in the edit form after mall creation
      // This is because we need the mall ID to upload the logo
      
      onOpenChange(false);
      form.reset();
    });
  };

  const _handleWebsiteBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
      form.setValue('website', `https://${value}`);
    }
  };

  return (
    <SlideOver
      open={open}
      onOpenChange={onOpenChange}
      title="เพิ่มห้างใหม่"
      description="กรอกข้อมูลห้างสรรพสินค้าให้ครบถ้วน"
      className="w-full sm:max-w-lg"
    >
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" data-testid="mall-form">
          <TextField
            name="displayName"
            label="ชื่อห้างสรรพสินค้า"
            placeholder="เช่น Central Rama 3, Siam Paragon"
            helper="ชื่อที่แสดงในแอปพลิเคชัน"
            required
            data-testid="mall-name"
          />

          <TextField
            name="name"
            label="Slug (ชื่อไฟล์)"
            placeholder="central-rama-3"
            helper="ชื่อไฟล์สำหรับ URL (ถ้าไม่กรอกจะสร้างอัตโนมัติ)"
            data-testid="mall-slug"
          />

          <TextField
            name="address"
            label="ที่อยู่"
            placeholder="79 Sathupradit Rd, Chong Nonsi, Yan Nawa, Bangkok"
            helper="ที่อยู่เต็มของห้าง"
            required
            data-testid="mall-address"
          />

          <TextField
            name="district"
            label="เขต/อำเภอ"
            placeholder="Yan Nawa"
            helper="เขตหรืออำเภอที่ตั้ง"
            required
            data-testid="mall-district"
          />

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

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-white pt-4 border-t mt-6 flex gap-3">
            <button
              type="submit"
              disabled={isLoading}
              data-testid="submit-mall"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              aria-busy={isLoading}
            >
              {isLoading ? 'กำลังสร้าง...' : 'เพิ่มห้าง'}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </FormProvider>
    </SlideOver>
  );
}
