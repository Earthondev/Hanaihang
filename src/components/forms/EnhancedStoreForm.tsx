import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Form from '../ui/form/Form';
import TextField from '../ui/form/fields/TextField';
import SelectField from '../ui/form/fields/SelectField';
import PhoneField from '../ui/form/fields/PhoneField';
import TextAreaField from '../ui/form/fields/TextAreaField';
import FormActions from '../ui/form/FormActions';
import { storeSchema, StoreInput } from '../../validation/store.schema';
import { useSafeSubmit } from '../../hooks/useSafeSubmit';
import { createStore } from '../../lib/firestore';
import { getMall, listFloors } from '../../lib/malls';
import { Mall, Floor } from '../../types/mall-system';

interface EnhancedStoreFormProps {
  defaultValues?: Partial<StoreInput>;
  mode?: "create" | "edit";
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EnhancedStoreForm({ 
  defaultValues, 
  mode = "create", 
  onSuccess,
  onCancel 
}: EnhancedStoreFormProps) {
  const [malls, setMalls] = useState<Mall[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMall, setSelectedMall] = useState<Mall | null>(null);

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

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<StoreInput>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: '',
      category: 'Fashion',
      floorId: '',
      unit: '',
      phone: '',
      hours: '',
      status: 'Active',
      ...defaultValues
    }
  });

  const watchedMallId = watch('mallId');
  const watchedFloorId = watch('floorId');

  // Load malls
  useEffect(() => {
    const loadMalls = async () => {
      try {
        setLoading(true);
        // Import listMalls dynamically to avoid circular dependency
        const { listMalls } = await import('../../lib/firestore');
        const mallsData = await listMalls();
        setMalls(mallsData);
      } catch (error) {
        console.error('Error loading malls:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMalls();
  }, []);

  // Load floors when mall changes
  useEffect(() => {
    const loadFloors = async () => {
      if (!watchedMallId) {
        setFloors([]);
        setSelectedMall(null);
        return;
      }

      try {
        // Get mall data for denormalization
        const mall = await getMall(watchedMallId);
        setSelectedMall(mall);
        
        // Load floors
        const floorsData = await listFloors(watchedMallId);
        setFloors(floorsData);
        
        // Reset floor selection when mall changes
        if (watchedFloorId) {
          setValue('floorId', '');
        }
      } catch (error) {
        console.error('Error loading floors:', error);
        setFloors([]);
        setSelectedMall(null);
      }
    };

    loadFloors();
  }, [watchedMallId, setValue, watchedFloorId]);

  const { isLoading, run } = useSafeSubmit({
    formName: 'store_create',
    successMessage: 'สร้างร้านค้าสำเร็จ 🎉',
    errorMessage: 'ไม่สามารถสร้างร้านค้าได้'
  });

  const onSubmit = async (data: StoreInput) => {
    if (!selectedMall) {
      alert('กรุณาเลือกห้างสรรพสินค้า');
      return;
    }

    // Get floor info for denormalization
    const selectedFloor = floors.find(f => f.id === data.floorId || f.label === data.floorId);
    
    // Prepare store data with denormalized fields
    const storeData = {
      ...data,
      mallId: selectedMall.id!,
      mallSlug: selectedMall.name,
      mallCoords: selectedMall.coords || selectedMall.location,
      floorLabel: selectedFloor?.name || selectedFloor?.label || data.floorId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    run(async () => {
      await createStore(selectedMall.id!, storeData);
      onSuccess?.();
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-6">
        {/* Store Name */}
        <TextField
          label="ชื่อร้านค้า"
          {...register('name')}
          error={errors.name?.message}
          placeholder="เช่น UNIQLO, Starbucks, Apple Store"
        />

        {/* Mall Selection */}
        <SelectField
          label="ห้างสรรพสินค้า"
          {...register('mallId')}
          error={errors.mallId?.message}
          options={malls.map(mall => ({
            label: mall.displayName || mall.name,
            value: mall.id!
          }))}
          placeholder="เลือกห้างสรรพสินค้า"
        />

        {/* Category */}
        <SelectField
          label="หมวดหมู่"
          {...register('category')}
          error={errors.category?.message}
          options={categories}
        />

        {/* Floor Selection */}
        <SelectField
          label="ชั้น"
          {...register('floorId')}
          error={errors.floorId?.message}
          options={floors.map(floor => ({
            label: `ชั้น ${floor.label}`,
            value: floor.id || floor.label
          }))}
          placeholder="เลือกชั้น"
          disabled={!watchedMallId}
        />

        {/* Unit */}
        <TextField
          label="ยูนิต (ไม่บังคับ)"
          {...register('unit')}
          error={errors.unit?.message}
          placeholder="เช่น 2-22, A-15, B-08"
        />

        {/* Phone */}
        <PhoneField
          label="เบอร์โทรศัพท์ (ไม่บังคับ)"
          {...register('phone')}
          error={errors.phone?.message}
          placeholder="เช่น 02-123-4567"
        />

        {/* Hours */}
        <TextField
          label="เวลาทำการ (ไม่บังคับ)"
          {...register('hours')}
          error={errors.hours?.message}
          placeholder="เช่น 10:00-22:00"
        />

        {/* Status */}
        <SelectField
          label="สถานะ"
          {...register('status')}
          error={errors.status?.message}
          options={statuses}
        />

        {/* Denormalized Data Preview */}
        {selectedMall && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">ข้อมูลที่จะเก็บเพิ่มเติม:</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <div>• ห้าง: {selectedMall.displayName || selectedMall.name}</div>
              <div>• Mall Slug: {selectedMall.name}</div>
              {selectedMall.coords && (
                <div>• พิกัดห้าง: {selectedMall.coords.lat.toFixed(4)}, {selectedMall.coords.lng.toFixed(4)}</div>
              )}
              {watchedFloorId && (
                <div>• ชั้น: {floors.find(f => f.id === watchedFloorId || f.label === watchedFloorId)?.label}</div>
              )}
            </div>
          </div>
        )}
      </div>

      <FormActions
        onCancel={onCancel}
        submitText={mode === 'create' ? 'สร้างร้านค้า' : 'อัปเดตร้านค้า'}
        isLoading={isLoading}
      />
    </Form>
  );
}
