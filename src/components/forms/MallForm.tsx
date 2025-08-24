import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building, MapPin, Clock, Phone, Globe, Settings, Eye } from 'lucide-react';
import Form from '../ui/form/Form';
import TextField from '../ui/form/fields/TextField';
import SelectField from '../ui/form/fields/SelectField';
import PhoneField from '../ui/form/fields/PhoneField';
import UrlField from '../ui/form/fields/UrlField';
import MapPicker from '../ui/form/fields/MapPicker';
import TimeField from '../ui/form/fields/TimeField';
import Card from '../ui/Card';
import Switch from '../ui/Switch';
import { mallSchema, MallInput } from '../../validation/mall.schema';
import { useSafeSubmit } from '../../hooks/useSafeSubmit';
import { createMall, updateMall } from '../../lib/firestore';
import { toSlug } from '../../lib/firestore';

interface MallFormProps {
  defaultValues?: Partial<MallInput>;
  mode?: "create" | "edit";
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function MallForm({ 
  defaultValues, 
  mode = "create", 
  onSuccess,
  onCancel 
}: MallFormProps) {
  const [isEveryday, setIsEveryday] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const districts = [
    { label: "ปทุมวัน", value: "ปทุมวัน" },
    { label: "บางกะปิ", value: "บางกะปิ" },
    { label: "ห้วยขวาง", value: "ห้วยขวาง" },
    { label: "ดินแดง", value: "ดินแดง" },
    { label: "วัฒนา", value: "วัฒนา" },
    { label: "คลองเตย", value: "คลองเตย" },
    { label: "สวนหลวง", value: "สวนหลวง" },
    { label: "พระโขนง", value: "พระโขนง" },
    { label: "ยานนาวา", value: "ยานนาวา" },
    { label: "บางกะปิ", value: "บางกะปิ" },
    { label: "ลาดพร้าว", value: "ลาดพร้าว" },
    { label: "จตุจักร", value: "จตุจักร" },
    { label: "อื่นๆ", value: "อื่นๆ" }
  ];

  const categories = [
    { label: "ห้างสรรพสินค้า", value: "shopping_mall" },
    { label: "ชุมชนมอลล์", value: "community_mall" },
    { label: "ห้างสรรพสินค้า", value: "department_store" },
    { label: "อื่นๆ", value: "other" }
  ];

  const form = useForm<MallInput>({
    resolver: zodResolver(mallSchema),
    defaultValues: {
      displayName: "",
      slug: "",
      category: "shopping_mall",
      description: "",
      address: "",
      district: "",
      location: { lat: 0, lng: 0 },
      floors: undefined,
      hours: {
        mode: "everyday",
        open: "10:00",
        close: "22:00"
      },
      holidayNotice: "",
      phone: "",
      website: "",
      facebook: "",
      line: "",
      status: "open",
      source: "manual",
      ...defaultValues
    },
    mode: "onSubmit"
  });

  const { run, isLoading } = useSafeSubmit({
    formName: `mall_${mode}`,
    successMessage: mode === "create" ? "สร้างห้างสรรพสินค้าสำเร็จ 🎉" : "อัปเดตห้างสรรพสินค้าสำเร็จ 🎉",
    errorMessage: mode === "create" ? "ไม่สามารถสร้างห้างสรรพสินค้าได้" : "ไม่สามารถอัปเดตห้างสรรพสินค้าได้"
  });

  // Auto-generate slug from displayName
  const displayName = form.watch("displayName");
  useEffect(() => {
    if (displayName && mode === "create") {
      form.setValue("slug", toSlug(displayName));
    }
  }, [displayName, form, mode]);

  // Auto-https for website
  const handleWebsiteBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    if (value && !/^https?:\/\//.test(value)) {
      form.setValue("website", "https://" + value);
    }
  };

  const handleSubmit = async (values: MallInput) => {
    await run(async () => {
      if (mode === "create") {
        await createMall({
          ...values,
          slug: toSlug(values.displayName)
        });
      } else {
        console.log("Edit mode not implemented yet");
      }
      onSuccess?.();
    });
  };

  const formValues = form.watch();

  return (
    <div className="min-h-screen bg-gray-50">
      <Form form={form} onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* ข้อมูลหลัก */}
          <Card 
            title="ข้อมูลหลัก" 
            description="ข้อมูลพื้นฐานของห้างสรรพสินค้า"
            className="md:col-span-1"
          >
            <div className="space-y-4">
              <TextField
                name="displayName"
                label="ชื่อห้าง"
                placeholder="เช่น Central Rama 9"
                required
                helper="ชื่อที่แสดงให้ผู้ใช้เห็น"
              />
              
              <TextField
                name="slug"
                label="Slug"
                placeholder="central-rama-9"
                helper="URL-friendly name (auto-generated)"
                disabled
              />
              
              <SelectField
                name="category"
                label="หมวดหมู่"
                options={categories}
                helper="ประเภทของห้างสรรพสินค้า"
              />
              
              <TextField
                name="description"
                label="คำอธิบายสั้น"
                placeholder="ห้างสรรพสินค้าขนาดใหญ่ใจกลางกรุงเทพฯ"
                helper="คำอธิบายสั้นๆ เกี่ยวกับห้าง"
                multiline
                rows={3}
              />
            </div>
          </Card>

          {/* ที่ตั้ง */}
          <Card 
            title="ที่ตั้ง" 
            description="ข้อมูลที่ตั้งและพิกัด"
            className="md:col-span-1"
          >
            <div className="space-y-4">
              <TextField
                name="address"
                label="ที่อยู่"
                placeholder="991 Rama I Rd, Pathum Wan, Bangkok 10330"
                required
                helper="ที่อยู่เต็มของห้างสรรพสินค้า"
              />
              
              <SelectField
                name="district"
                label="เขต/จังหวัด"
                options={districts}
                required
                helper="เลือกเขตที่ตั้งของห้าง"
              />
              
              <MapPicker
                name="location"
                label="พิกัด"
                required
                helper="เลือกพิกัดบนแผนที่หรือใช้ตำแหน่งปัจจุบัน"
              />
              
              <TextField
                name="floors"
                label="ชั้น/อาคาร"
                type="number"
                placeholder="8"
                helper="จำนวนชั้นของห้าง (ถ้ามี)"
              />
            </div>
          </Card>

          {/* เวลาทำการ */}
          <Card 
            title="เวลาทำการ" 
            description="กำหนดเวลาทำการของห้าง"
            className="md:col-span-2"
          >
            <div className="space-y-4">
              <Switch
                checked={isEveryday}
                onCheckedChange={setIsEveryday}
                label="ใช้เวลาเดียวกันทุกวัน"
              />
              
              {isEveryday ? (
                <div className="grid grid-cols-2 gap-4">
                  <TimeField
                    name="hours.open"
                    label="เวลาเปิด"
                    required
                    helper="เวลาเปิดทำการ"
                  />
                  <TimeField
                    name="hours.close"
                    label="เวลาปิด"
                    required
                    helper="เวลาปิดทำการ"
                  />
                </div>
              ) : (
                <div className="grid md:grid-cols-4 gap-4">
                  <TimeField name="hours.mon" label="จันทร์" />
                  <TimeField name="hours.tue" label="อังคาร" />
                  <TimeField name="hours.wed" label="พุธ" />
                  <TimeField name="hours.thu" label="พฤหัสบดี" />
                  <TimeField name="hours.fri" label="ศุกร์" />
                  <TimeField name="hours.sat" label="เสาร์" />
                  <TimeField name="hours.sun" label="อาทิตย์" />
                </div>
              )}
              
              <TextField
                name="holidayNotice"
                label="วันหยุดนักขัตฤกษ์/ปิดปรับปรุง"
                placeholder="ปิดทุกวันอาทิตย์ หรือ ปิดปรับปรุง 1-15 มกราคม"
                helper="ข้อมูลวันหยุดพิเศษ (ถ้ามี)"
                multiline
                rows={2}
              />
            </div>
          </Card>

          {/* การติดต่อ */}
          <Card 
            title="การติดต่อ" 
            description="ข้อมูลการติดต่อห้างสรรพสินค้า"
            className="md:col-span-1"
          >
            <div className="space-y-4">
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
                onBlur={handleWebsiteBlur}
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
            </div>
          </Card>

          {/* เมตา/ระบบ */}
          <Card 
            title="เมตา/ระบบ" 
            description="ข้อมูลระบบและการจัดการ"
            className="md:col-span-1"
          >
            <div className="space-y-4">
              <SelectField
                name="status"
                label="สถานะ"
                options={[
                  { label: "เปิดทำการ", value: "open" },
                  { label: "ปิดชั่วคราว", value: "temp_closed" }
                ]}
                helper="สถานะการให้บริการ"
              />
              
              <TextField
                name="source"
                label="แหล่งข้อมูล"
                placeholder="manual"
                helper="แหล่งที่มาของข้อมูล"
                disabled
              />
              
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Eye className="w-4 h-4" />
                <span>พรีวิวบัตรห้าง</span>
              </button>
            </div>
          </Card>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              aria-busy={isLoading}
            >
              <Building className="w-4 h-4" />
              <span>{mode === "create" ? "เพิ่มห้าง" : "บันทึกการแก้ไข"}</span>
            </button>
          </div>
        </div>
      </Form>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">พรีวิวบัตรห้าง</h3>
            <div className="space-y-2 text-sm">
              <p><strong>ชื่อ:</strong> {formValues.displayName}</p>
              <p><strong>ที่อยู่:</strong> {formValues.address}</p>
              <p><strong>เขต:</strong> {formValues.district}</p>
              <p><strong>เบอร์โทร:</strong> {formValues.phone || '—'}</p>
              <p><strong>เว็บไซต์:</strong> {formValues.website || '—'}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
