import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Form from '../ui/form/Form';
import TextField from '../ui/form/fields/TextField';
import PhoneField from '../ui/form/fields/PhoneField';
import FormActions from '../ui/form/FormActions';
import { storeSchemaInput } from '../../validation/store.schema';
import { useSafeSubmit } from '../../hooks/useSafeSubmit';
import { createStore, updateStore, listMalls, listFloors } from '../../lib/firestore';
import { Mall } from '../../types/mall-system';
import { getMall } from '../../lib/malls';

interface StoreFormProps {
  defaultValues?: Partial<StoreInput>;
  mode?: "create" | "edit";
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function StoreForm({ 
  defaultValues, 
  mode = "create", 
  onSuccess,
  onCancel 
}: StoreFormProps) {
  const [malls, setMalls] = useState<Mall[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { label: "แฟชั่น", value: "Fashion" },
    { label: "ความงาม", value: "Beauty" },
    { label: "อิเล็กทรอนิกส์", value: "Electronics" },
    { label: "อาหาร & เครื่องดื่ม", value: "Food & Beverage" },
    { label: "กีฬา", value: "Sports" },
    { label: "หนังสือ", value: "Books" },
    { label: "บ้าน & สวน", value: "Home & Garden" },
    { label: "สุขภาพ & ยา", value: "Health & Pharmacy" },
    { label: "ความบันเทิง", value: "Entertainment" },
    { label: "บริการ", value: "Services" }
  ];

  const statuses = [
    { label: "เปิดทำการ", value: "Active" },
    { label: "ปิดปรับปรุง", value: "Maintenance" },
    { label: "ปิดทำการ", value: "Closed" }
  ];

  const form = useForm<StoreInput>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      _mallId: "",
      name: "",
      category: "Fashion",
      floorId: "",
      unit: "",
      phone: "",
      hours: "",
      status: "Active",
      ...defaultValues
    },
    mode: "onSubmit"
  });

  const { run, isLoading } = useSafeSubmit({
    formName: `store_${mode}`,
    successMessage: mode === "create" ? "เพิ่มร้านค้าสำเร็จ 🎉" : "อัปเดตร้านค้าสำเร็จ 🎉",
    errorMessage: mode === "create" ? "ไม่สามารถเพิ่มร้านค้าได้" : "ไม่สามารถอัปเดตร้านค้าได้"
  });

  // Load malls and floors
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const mallsData = await listMalls();
        setMalls(mallsData);
        
        // Load floors for default mall if exists
        const defaultMallId = form.getValues("mallId");
        if (defaultMallId) {
          const floorsData = await listFloors(defaultMallId);
          setFloors(floorsData);
        }
      } catch (error) {
        console.error('Error loading form data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [form]);

  // Load floors when mall changes
  const selectedMallId = form.watch("mallId");
  useEffect(() => {
    const loadFloors = async () => {
      if (selectedMallId) {
        try {
          const floorsData = await listFloors(selectedMallId);
          setFloors(floorsData);
          // Reset floor selection when mall changes
          form.setValue("floorId", "");
        } catch (error) {
          console.error('Error loading floors:', error);
          setFloors([]);
        }
      } else {
        setFloors([]);
      }
    };

    loadFloors();
  }, [selectedMallId, form]);

  const handleSubmit = async (values: StoreInput) => {
    // Analytics tracking for field changes summary
    if (typeof window !== 'undefined' && (window as any).gtag) {
      const changedFields = Object.keys(form.formState.dirtyFields || {});
      (window as any).gtag('event', 'form_field_change_summary', {
        event_category: 'form_actions',
        event_label: 'field_change_summary',
        custom_parameter: {
          form: `store_${mode}`,
          changed_fields_count: changedFields.length
        }
      });
    }

    await run(async () => {
      if (mode === "create") {
        // Get mall data for denormalization
        const mall = await getMall(values.mallId);
        const mallCoords = mall?.location ?? mall?.coords ?? null;
        
        // Get floor data for denormalization
        const floors = await listFloors(values.mallId);
        const _selectedFloor = floors.find(f => f.id === values.floorId);
        const floorLabel = selectedFloor?.label ?? values.floorId;
        
        // Create store with denormalized data
        const storeData = {
          ...values,
          mallCoords,
          floorLabel
        };
        
        await createStore(values.mallId, storeData);
      } else {
        // For edit mode, you would need to pass the store ID
        if ((defaultValues as any)?.id) {
          // Get mall data for denormalization
          const mall = await getMall(values.mallId);
          const mallCoords = mall?.location ?? mall?.coords ?? null;
          
          // Get floor data for denormalization
          const floors = await listFloors(values.mallId);
          const _selectedFloor = floors.find(f => f.id === values.floorId);
          const floorLabel = selectedFloor?.label ?? values.floorId;
          
          // Update store with denormalized data
          const updateData = {
            ...values,
            mallCoords,
            floorLabel
          };
          
          await updateStore(values.mallId, (defaultValues as any).id, updateData);
        } else {
          console.log("Store ID not provided for edit mode");
        }
      }
      onSuccess?.();
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <Form form={form} onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SelectField
          name="mallId"
          label="ห้างสรรพสินค้า"
          options={malls.map(mall => ({ label: mall.displayName || mall.name, value: mall.id }))}
          required
          helper="เลือกห้างสรรพสินค้าที่ร้านตั้งอยู่"
          disabled={mode === "edit"}
        />
        
        <SelectField
          name="floorId"
          label="ชั้น"
          options={floors.map(floor => ({ label: floor.label, value: floor.id }))}
          required
          helper="เลือกชั้นที่ร้านตั้งอยู่"
          disabled={!selectedMallId}
        />
        
        <TextField
          name="name"
          label="ชื่อร้านค้า"
          placeholder="เช่น Nike, Starbucks, Apple Store"
          required
          helper="ชื่อร้านค้าหรือแบรนด์"
        />
        
        <SelectField
          name="category"
          label="หมวดหมู่"
          options={categories}
          required
          helper="เลือกหมวดหมู่ของร้านค้า"
        />
        
        <TextField
          name="unit"
          label="ยูนิต/ร้าน"
          placeholder="เช่น 2-22, A-15"
          helper="หมายเลขยูนิตหรือตำแหน่งร้าน"
        />
        
        <SelectField
          name="status"
          label="สถานะ"
          options={statuses}
          required
          helper="สถานะการเปิดทำการของร้าน"
        />
        
        <PhoneField
          name="phone"
          label="เบอร์โทร"
          placeholder="+66 81 234 5678"
          helper="เบอร์โทรติดต่อร้านค้า"
        />
        
        <TextField
          name="hours"
          label="เวลาเปิด-ปิด"
          placeholder="เช่น 10:00-22:00"
          helper="เวลาเปิด-ปิดทำการของร้าน"
        />
      </div>

      <FormActions
        submitLabel={mode === "create" ? "เพิ่มร้านค้า" : "บันทึกการแก้ไข"}
        onCancel={onCancel}
        loading={isLoading}
      />
    </Form>
  );
}
