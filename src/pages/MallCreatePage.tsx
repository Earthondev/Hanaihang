import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  Phone,
  Users,
} from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { createMall } from '../services/firebase/firestore';
import { mallSchemaInput } from '../legacy/validation/mall.schema';
import { useSafeSubmit } from '../legacy/hooks/useSafeSubmit';
import TextField from '../components/ui/form/fields/TextField';
// 
import PhoneField from '../components/ui/form/fields/PhoneField';
import UrlField from '../components/ui/form/fields/UrlField';
import MapPicker from '../components/ui/form/fields/MapPicker';
import TimeField from '../components/ui/form/fields/TimeField';
import Switch from '../components/ui/Switch';
import LogoUpload from '../components/ui/LogoUpload';
import { BaseButton } from '../components/ui/BaseButton';

const MallCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [isEveryday, setIsEveryday] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const { isLoading, run } = useSafeSubmit({
    formName: 'mall_create',
    successMessage: 'สร้างห้างสรรพสินค้าสำเร็จ 🎉',
    errorMessage: 'ไม่สามารถสร้างห้างสรรพสินค้าได้',
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
      location: { lat: 0, lng: 0 },
      openTime: '10:00',
      closeTime: '22:00',
    },
  });

  const handleSubmit = async (values: any) => {
    await run(async () => {
      const mallData = {
        displayName: values.displayName,
        name: values.name || toSlug(values.displayName),
        address: values.address,
        district: values.district,
        phone: values.phone,
        website: values.website,
        social: values.social,
        location: values.location,
        openTime: values.openTime,
        closeTime: values.closeTime,
        logoUrl: logoUrl,
      };

      await createMall(mallData);
      navigate('/admin?tab=malls');
    });
  };

  // Helper function to create slug
  const toSlug = (displayName: string): string => {
    return displayName
      .toLowerCase()
      .replace(/[^\u0E00-\u0E7Fa-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin?tab=malls')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  สร้างห้างสรรพสินค้าใหม่
                </h1>
                <p className="text-sm text-gray-600">
                  เพิ่มห้างสรรพสินค้าใหม่เข้าสู่ระบบ
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8"
            aria-busy={isLoading ? 'true' : 'false'}
          >
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Building2 className="w-6 h-6 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  ข้อมูลพื้นฐาน
                </h2>
              </div>

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
            </div>

            {/* Location Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <MapPin className="w-6 h-6 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  ข้อมูลที่ตั้ง
                </h2>
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

              <div className="mt-6">
                <MapPicker
                  name="location"
                  label="ตำแหน่งบนแผนที่"
                  helper="คลิกบนแผนที่เพื่อกำหนดตำแหน่งที่ตั้ง"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Phone className="w-6 h-6 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  ข้อมูลการติดต่อ
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PhoneField
                  name="phone"
                  label="เบอร์โทรศัพท์"
                  placeholder="+66 2 123 4567"
                  helper="เบอร์โทรศัพท์ติดต่อห้าง"
                />

                <UrlField
                  name="website"
                  label="เว็บไซต์"
                  placeholder="https://www.central.co.th"
                  helper="เว็บไซต์ของห้าง"
                />
              </div>

              <div className="mt-6">
                <TextField
                  name="social"
                  label="โซเชียลมีเดีย"
                  placeholder="Facebook, Instagram, Line ID"
                  helper="บัญชีโซเชียลมีเดียของห้าง"
                />
              </div>
            </div>

            {/* Operating Hours */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Clock className="w-6 h-6 text-orange-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  เวลาเปิด-ปิดทำการ
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={isEveryday}
                    onCheckedChange={setIsEveryday}
                    label="เปิดทุกวัน"
                  />
                </div>

                {isEveryday ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <TimeField
                      name="openTime"
                      label="เวลาเปิด"
                      helper="เวลาที่ห้างเปิดทำการ"
                    />

                    <TimeField
                      name="closeTime"
                      label="เวลาปิด"
                      helper="เวลาที่ห้างปิดทำการ"
                    />
                  </div>
                ) : (
                  <TextField
                    name="hours"
                    label="เวลาทำการ"
                    placeholder="จ-ศ: 10:00-22:00, ส-อา: 10:00-23:00"
                    helper="ระบุเวลาทำการแบบละเอียด"
                  />
                )}
              </div>
            </div>

            {/* Logo Upload */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Users className="w-6 h-6 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  โลโก้ห้างสรรพสินค้า
                </h2>
              </div>

              <LogoUpload
                mallId="new"
                currentLogoUrl={logoUrl}
                onLogoChange={setLogoUrl}
              />
            </div>

            {/* Form Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-end space-x-4">
                <BaseButton
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin?tab=malls')}
                  disabled={isLoading}
                  data-testid="cancel-button"
                >
                  ยกเลิก
                </BaseButton>
                <BaseButton
                  type="submit"
                  variant="primary"
                  loading={isLoading}
                  disabled={isLoading}
                  data-testid="submit-mall-button"
                >
                  {isLoading ? 'กำลังสร้าง...' : 'สร้างห้างสรรพสินค้า'}
                </BaseButton>
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default MallCreatePage;
