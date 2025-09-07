import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, MapPin, Clock, Phone, Globe, Facebook, MessageCircle } from 'lucide-react';

import Card from '../../ui/Card';
import TextField from '../../ui/form/fields/TextField';
import PhoneField from '../../ui/form/fields/PhoneField';
import UrlField from '../../ui/form/fields/UrlField';
import MapPicker from '../../ui/form/fields/MapPicker';
import TimeField from '../../ui/form/fields/TimeField';
import Switch from '../../ui/Switch';
import { mallSchema, MallInput } from '../validation/mall.schema';
import { useSafeSubmit } from '../hooks/useSafeSubmit';
import { createMall, updateMall } from '../../services/firebase/firestore';
import { toSlug } from '../../services/firebase/firestore';
import { Mall } from '../../types/mall-system';

interface MallFormProps {
  mode: 'create' | 'edit';
  mall?: Mall;
  onSuccess?: () => void;
}

export default function MallForm({ mode, mall, onSuccess }: MallFormProps) {
  const [isEveryday, setIsEveryday] = useState(true);
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
      location: mall?.coords ? { lat: mall.coords.lat, lng: mall.coords.lng } : null,
      openTime: mall?.hours?.open || '10:00',
      closeTime: mall?.hours?.close || '22:00',
    }
  });

  // Debug: Log mall data
  console.log('🔍 MallForm received mall data:', mall);

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
        lat: values.location?.lat,
        lng: values.location?.lng,
        openTime: values.openTime,
        closeTime: values.closeTime,
      };

      if (mode === 'create') {
        await createMall(mallData);
      } else if (mall?.id) {
        await updateMall(mall.id, mallData);
      }
      
      onSuccess?.();
    });
  };

  const _handleWebsiteBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
      form.setValue('website', `https://${value}`);
    }
  };

  return (
    <div className="space-y-6">
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          
          {/* 🏢 ข้อมูลทั่วไป */}
          <Card>
            <div className="flex items-center space-x-2 mb-6">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">ข้อมูลทั่วไป</h2>
            </div>
            
            <div className="space-y-6">
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

              <div className="space-y-4">
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
            </div>
          </Card>

          {/* 🗺️ ตำแหน่ง & แผนที่ */}
          <Card>
            <div className="flex items-center space-x-2 mb-6">
              <MapPin className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">ตำแหน่ง & แผนที่</h2>
            </div>
            
            <MapPicker
              name="location"
              label="ตำแหน่ง"
              helper="คลิกบนแผนที่เพื่อกำหนดตำแหน่ง หรือใช้ปุ่ม 'ใช้ตำแหน่งปัจจุบัน'"
            />
          </Card>

          {/* 🕐 เวลาทำการ */}
          <Card>
            <div className="flex items-center space-x-2 mb-6">
              <Clock className="w-5 h-5 text-orange-600" />
              <h2 className="text-xl font-semibold text-gray-900">เวลาทำการ</h2>
            </div>
            
            <div className="space-y-4">
              <Switch
                checked={isEveryday}
                onCheckedChange={setIsEveryday}
                label="ใช้เวลาเดียวกันทุกวัน"
              />
              
              {isEveryday ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
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
                  <div className="mt-3 text-sm text-gray-600">
                    <p>🕐 เวลาทำการ: จันทร์ - อาทิตย์ {form.watch('openTime') || '10:00'} - {form.watch('closeTime') || '22:00'}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">เวลาทำการรายวัน</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-700 w-16">จันทร์-ศุกร์:</span>
                          <TimeField name="hours.mon" label="" className="flex-1" />
                          <span className="text-gray-500">ถึง</span>
                          <TimeField name="hours.mon" label="" className="flex-1" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-700 w-16">เสาร์-อาทิตย์:</span>
                          <TimeField name="hours.sat" label="" className="flex-1" />
                          <span className="text-gray-500">ถึง</span>
                          <TimeField name="hours.sat" label="" className="flex-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-4">
              <TextField
                name="holidayNotice"
                label="วันหยุดนักขัตฤกษ์/ปิดปรับปรุง"
                placeholder="ปิดทุกวันอาทิตย์ หรือ ปิดปรับปรุง 1-15 มกราคม"
                helper="ข้อมูลวันหยุดพิเศษ (ถ้ามี)"
              />
            </div>
          </Card>

          {/* Sticky Bottom Bar with CTA Buttons */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 -mx-6 mt-8">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {mode === 'edit' ? 'แก้ไขข้อมูลห้าง' : 'สร้างห้างใหม่'}
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors flex items-center space-x-2"
                  aria-busy={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <span>{mode === 'create' ? 'สร้างห้าง' : 'บันทึกการแก้ไข'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
