import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SlideOver } from '../ui/SlideOver';
import TextField from '../ui/form/fields/TextField';
import SelectField from '../ui/form/fields/SelectField';
import PhoneField from '../ui/form/fields/PhoneField';
import { storeSchema, StoreInput } from '../../validation/store.schema';
import { useSafeSubmit } from '../../hooks/useSafeSubmit';
import { createStore, listMalls, listFloors } from '../../lib/firestore';
import { Mall, Floor } from '../../types/mall-system';

interface StoreCreateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMallId?: string;
  onCreated?: () => void;
}

export function StoreCreateDrawer({
  open,
  onOpenChange,
  defaultMallId,
  onCreated,
}: StoreCreateDrawerProps) {
  const [malls, setMalls] = React.useState<Mall[]>([]);
  const [floors, setFloors] = React.useState<Floor[]>([]);
  const [loading, setLoading] = React.useState(true);

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
      mallId: defaultMallId || "",
      name: "",
      category: "Fashion" as any,
      floorId: "",
      unit: "",
      phone: "",
      hours: "",
      status: "Active" as any,
    },
    mode: "onSubmit"
  });

  const { run, isLoading } = useSafeSubmit({
    formName: 'store_create',
    successMessage: "เพิ่มร้านค้าสำเร็จ 🎉",
    errorMessage: "ไม่สามารถเพิ่มร้านค้าได้"
  });

  // Load malls and floors
  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const mallsData = await listMalls();
        setMalls(mallsData);
        
        // Load floors for default mall if exists
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

    if (open) {
      loadData();
    }
  }, [open, defaultMallId]);

  // Load floors when mall changes
  const selectedMallId = form.watch("mallId");
  React.useEffect(() => {
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

    if (open) {
      loadFloors();
    }
  }, [selectedMallId, form, open]);

  // Set default mall when prop changes
  React.useEffect(() => {
    if (defaultMallId && open) {
      form.setValue("mallId", defaultMallId);
    }
  }, [defaultMallId, form, open]);

  const handleSubmit = async (values: StoreInput) => {
    await run(async () => {
      await createStore(values.mallId, values);
      onCreated?.();
      onOpenChange(false);
    });
  };

  if (loading) {
    return (
      <SlideOver
        open={open}
        onOpenChange={onOpenChange}
        title="เพิ่มร้านใหม่"
        description="กำลังโหลดข้อมูล..."
        className="w-full sm:max-w-lg"
      >
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
      </SlideOver>
    );
  }

  return (
    <SlideOver
      open={open}
      onOpenChange={onOpenChange}
      title="เพิ่มร้านใหม่"
      description="เลือกรายการห้างที่ร้านตั้งอยู่"
      className="w-full sm:max-w-lg"
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <SelectField
          name="mallId"
          label="ห้างสรรพสินค้า"
          options={malls.map(mall => ({ label: mall.displayName || mall.name, value: mall.id }))}
          required
          helper="เลือกห้างสรรพสินค้าที่ร้านตั้งอยู่"
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

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white pt-4 border-t mt-6 flex gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            aria-busy={isLoading}
          >
            {isLoading ? 'กำลังเพิ่ม...' : 'เพิ่มร้านค้า'}
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
