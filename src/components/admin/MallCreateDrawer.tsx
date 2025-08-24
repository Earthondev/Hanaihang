import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SlideOver } from '../ui/SlideOver';
import TextField from '../ui/form/fields/TextField';
import SelectField from '../ui/form/fields/SelectField';
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
  onCreated?: () => void;
}

export function MallCreateDrawer({
  open,
  onOpenChange,
  onCreated,
}: MallCreateDrawerProps) {
  const [isEveryday, setIsEveryday] = React.useState(true);

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
    },
    mode: "onSubmit"
  });

  const { run, isLoading } = useSafeSubmit({
    formName: 'mall_create',
    successMessage: "สร้างห้างสรรพสินค้าสำเร็จ 🎉",
    errorMessage: "ไม่สามารถสร้างห้างสรรพสินค้าได้"
  });

  // Auto-generate slug from displayName
  const displayName = form.watch("displayName");
  React.useEffect(() => {
    if (displayName) {
      form.setValue("slug", toSlug(displayName));
    }
  }, [displayName, form]);

  // Auto-https for website
  const handleWebsiteBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    if (value && !/^https?:\/\//.test(value)) {
      form.setValue("website", "https://" + value);
    }
  };

  const handleSubmit = async (values: MallInput) => {
    await run(async () => {
      await createMall({
        ...values,
        slug: toSlug(values.displayName)
      });
      onCreated?.();
      onOpenChange(false);
    });
  };

  return (
    <SlideOver
      open={open}
      onOpenChange={onOpenChange}
      title="เพิ่มห้างใหม่"
      description="กรอกข้อมูลห้างสรรพสินค้าให้ครบถ้วน"
      className="w-full sm:max-w-lg"
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
        
        <div className="space-y-3">
          <Switch
            checked={isEveryday}
            onCheckedChange={setIsEveryday}
            label="ใช้เวลาเดียวกันทุกวัน"
          />
          
          {isEveryday ? (
            <div className="grid grid-cols-2 gap-3">
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
          multiline
          rows={2}
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

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white pt-4 border-t mt-6 flex gap-3">
          <button
            type="submit"
            disabled={isLoading}
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
    </SlideOver>
  );
}
