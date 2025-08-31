import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, MapPin, Tag, Phone, Clock, X } from 'lucide-react';

import { SlideOver } from '../../ui/SlideOver';
import TextField from '../../ui/form/fields/TextField';
import SelectField from '../../ui/form/fields/SelectField';
import PhoneField from '../../ui/form/fields/PhoneField';
import TimeField from '../../ui/form/fields/TimeField';
import Switch from '../../ui/Switch';
import { storeSchema, StoreInput } from '../../legacy/validation/store.schema';
import { useSafeSubmit } from '../../legacy/hooks/useSafeSubmit';
import { createStore, listMalls, listFloors } from '../../services/firebase/firestore';
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
  const [isEveryday, setIsEveryday] = React.useState(true);

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
      openTime: "10:00",
      closeTime: "22:00",
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
      const storeData = {
        ...values,
        hours: isEveryday ? `${values.openTime}-${values.closeTime}` : values.hours || `${values.openTime}-${values.closeTime}`
      };
      await createStore(values.mallId, storeData);
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
        className="w-full sm:max-w-xl"
      >
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </SlideOver>
    );
  }

  return (
    <SlideOver
      open={open}
      onOpenChange={onOpenChange}
      title="เพิ่มร้านใหม่"
      description="กรอกข้อมูลร้านค้าใหม่"
      className="w-full sm:max-w-xl"
    >
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          
          {/* 🏬 ข้อมูลร้านค้า */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">ข้อมูลร้านค้า</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                name="mallId"
                label="ห้างสรรพสินค้า"
                options={malls.map(mall => ({ label: mall.displayName || mall.name, value: mall.id }))}
                required
                helper="เลือกห้างที่ร้านตั้งอยู่"
              />
              
              <SelectField
                name="floorId"
                label="ชั้น"
                options={floors.map(floor => ({ label: floor.label, value: floor.id }))}
                required
                helper={`เลือกชั้นที่ร้านตั้งอยู่ (${floors.length} ชั้น)`}
                disabled={!selectedMallId}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                name="unit"
                label="ยูนิต/ร้าน"
                placeholder="เช่น A-22, 3F"
                helper="หมายเลขยูนิตหรือตำแหน่งร้าน"
              />
              
              <SelectField
                name="status"
                label="สถานะ"
                options={statuses}
                required
                helper="สถานะการเปิดทำการ"
              />
            </div>
          </div>

          {/* 🏷️ รายละเอียด */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Tag className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">รายละเอียด</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                name="name"
                label="ชื่อร้านค้า"
                placeholder="เช่น Starbucks"
                required
                helper="ชื่อร้านค้าหรือแบรนด์"
              />
              
              <SelectField
                name="category"
                label="หมวดหมู่"
                options={categories}
                required
                helper="เลือกหมวดหมู่ของร้าน"
              />
            </div>
          </div>

          {/* 📞 การติดต่อ */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Phone className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">การติดต่อ</h3>
            </div>
            
            <PhoneField
              name="phone"
              label="เบอร์โทร"
              placeholder="+66 81 234 5678"
              helper="เบอร์โทรติดต่อร้านค้า"
            />
          </div>

          {/* 🕒 เวลาเปิด-ปิด */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">เวลาเปิด-ปิด</h3>
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
                <TextField
                  name="hours"
                  label="เวลาเปิด-ปิด"
                  placeholder="เช่น 10:00-22:00, จ-ศ 9:00-18:00"
                  helper="ระบุเวลาทำการแบบละเอียด"
                />
              )}
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 -mx-6 mt-8">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                เพิ่มร้านค้าใหม่
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
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
                      <span>กำลังเพิ่ม...</span>
                    </>
                  ) : (
                    <>
                      <span>เพิ่มร้านค้า</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </FormProvider>
    </SlideOver>
  );
}
