import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Form from '../ui/form/Form';
import TextField from '../ui/form/fields/TextField';
import SelectField from '../ui/form/fields/SelectField';
import PhoneField from '../ui/form/fields/PhoneField';
import UrlField from '../ui/form/fields/UrlField';
import FormActions from '../ui/form/FormActions';
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
  const [districts] = useState([
    { label: "ปทุมวัน", value: "ปทุมวัน" },
    { label: "บางกะปิ", value: "บางกะปิ" },
    { label: "ห้วยขวาง", value: "ห้วยขวาง" },
    { label: "ดินแดง", value: "ดินแดง" },
    { label: "วัฒนา", value: "วัฒนา" },
    { label: "คลองเตย", value: "คลองเตย" },
    { label: "สวนหลวง", value: "สวนหลวง" },
    { label: "พระโขนง", value: "พระโขนง" },
    { label: "อื่นๆ", value: "อื่นๆ" }
  ]);

  const form = useForm<MallInput>({
    resolver: zodResolver(mallSchema),
    defaultValues: {
      displayName: "",
      name: "",
      district: "",
      address: "",
      contact: {
        phone: "",
        website: "",
        social: ""
      },
      hours: {
        open: "10:00",
        close: "22:00"
      },
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
      form.setValue("name", toSlug(displayName));
    }
  }, [displayName, form, mode]);

  const handleSubmit = async (values: MallInput) => {
    // Analytics tracking for field changes summary
    if (typeof window !== 'undefined' && (window as any).gtag) {
      const changedFields = Object.keys(form.formState.dirtyFields || {});
      (window as any).gtag('event', 'form_field_change_summary', {
        event_category: 'form_actions',
        event_label: 'field_change_summary',
        custom_parameter: {
          form: `mall_${mode}`,
          changed_fields_count: changedFields.length
        }
      });
    }

    await run(async () => {
      if (mode === "create") {
        await createMall({
          ...values,
          name: toSlug(values.displayName)
        });
      } else {
        // For edit mode, you would need to pass the mall ID
        // await updateMall(mallId, values);
        console.log("Edit mode not implemented yet");
      }
      onSuccess?.();
    });
  };

  return (
    <Form form={form} onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextField
          name="displayName"
          label="ชื่อห้างสรรพสินค้า"
          placeholder="เช่น Central Rama 9"
          required
          helper="ชื่อที่แสดงให้ผู้ใช้เห็น"
        />
        
        <SelectField
          name="district"
          label="เขต/อำเภอ"
          options={districts}
          required
          helper="เลือกเขตที่ตั้งของห้างสรรพสินค้า"
        />
        
        <TextField
          name="address"
          label="ที่อยู่"
          placeholder="เลขที่/ถนน/แขวง/เขต/จังหวัด"
          required
          className="md:col-span-2"
          helper="ที่อยู่เต็มของห้างสรรพสินค้า"
        />
        
        <PhoneField
          name="contact.phone"
          label="เบอร์โทร"
          placeholder="+66 81 234 5678"
          helper="เบอร์โทรติดต่อห้างสรรพสินค้า"
        />
        
        <UrlField
          name="contact.website"
          label="เว็บไซต์"
          placeholder="https://central.co.th"
          helper="เว็บไซต์อย่างเป็นทางการ"
        />
        
        <TextField
          name="contact.social"
          label="โซเชียลมีเดีย"
          placeholder="Facebook, Instagram, Line"
          helper="บัญชีโซเชียลมีเดีย"
        />
        
        <TextField
          name="hours.open"
          label="เวลาเปิด"
          type="time"
          required
          helper="เวลาเปิดทำการ"
        />
        
        <TextField
          name="hours.close"
          label="เวลาปิด"
          type="time"
          required
          helper="เวลาปิดทำการ"
        />
      </div>

      <FormActions
        submitLabel={mode === "create" ? "สร้างห้าง" : "บันทึกการแก้ไข"}
        onCancel={onCancel}
        loading={isLoading}
      />
    </Form>
  );
}
