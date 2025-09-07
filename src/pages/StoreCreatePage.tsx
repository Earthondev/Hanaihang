import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Store, Phone, Clock } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { createStore, listMalls, listFloors, findStoreById, updateStore } from '../services/firebase/firestore';
import { storeSchema, StoreInput } from '../legacy/validation/store.schema';
import { useSafeSubmit } from '../legacy/hooks/useSafeSubmit';
import { getMall } from '../lib/malls';
import TextField from '../components/ui/form/fields/TextField';
import PhoneField from '../components/ui/form/fields/PhoneField';
import SelectField from '../components/ui/form/fields/SelectField';
import { BaseButton } from '../components/ui/BaseButton';
import { Mall, Floor, Store as StoreType } from '../types/mall-system';

const StoreCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { storeId } = useParams<{ storeId?: string }>();
  const defaultMallId = searchParams.get('mallId') || '';

  const [malls, setMalls] = useState<Mall[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingStore, setExistingStore] = useState<StoreType | null>(null);

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

  const { isLoading, run } = useSafeSubmit({
    formName: 'store_create',
    successMessage: "เพิ่มร้านค้าสำเร็จ 🎉",
    errorMessage: "ไม่สามารถเพิ่มร้านค้าได้"
  });

  const form = useForm<StoreInput>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      _mallId: defaultMallId,
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

  // Check if we're in edit mode
  useEffect(() => {
    if (storeId) {
      setIsEditMode(true);
    }
  }, [storeId]);

  // Load existing store data for edit mode
  useEffect(() => {
    const loadStoreData = async () => {
      if (isEditMode && storeId) {
        try {
          setLoading(true);
          const result = await findStoreById(storeId);
          if (result) {
            setExistingStore(result.store);
            // Set form values
            form.reset({
              _mallId: result._mallId,
              name: result.store.name,
              category: result.store.category as any,
              floorId: result.store.floorId,
              unit: result.store.unit || '',
              phone: result.store.phone || '',
              openTime: result.store.hours?.split('-')[0] || '10:00',
              closeTime: result.store.hours?.split('-')[1] || '22:00',
              status: result.store.status as any,
            });
          }
        } catch (error) {
          console.error('Error loading store data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadStoreData();
  }, [isEditMode, storeId, form]);

  // Load malls and floors
  useEffect(() => {
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

    loadData();
  }, [defaultMallId]);

  // Load floors when mall changes
  const selectedMallId = form.watch("_mallId");
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
    await run(async () => {
      if (isEditMode && existingStore) {
        // Update existing store
        const result = await findStoreById(storeId!);
        if (result) {
          const updateData = {
            name: values.name,
            nameLower: values.name.toLowerCase(),
            category: values.category,
            floorId: values.floorId,
            unit: values.unit,
            phone: values.phone,
            hours: `${values.openTime}-${values.closeTime}`,
            status: values.status,
            _mallId: values._mallId
          };
          
          await updateStore(result._mallId, storeId!, updateData);
          navigate(`/stores/${storeId}`);
        }
      } else {
        // Get mall data for denormalization
        const mall = await getMall(values._mallId);
        const mallCoords = mall?.location ?? mall?.coords ?? null;
        
        // Get floor data for denormalization
        const selectedFloor = floors.find(f => f.id === values.floorId);
        const floorLabel = selectedFloor?.label ?? values.floorId;
        
        // Create store with denormalized data
        const storeData = {
          ...values,
          hours: `${values.openTime}-${values.closeTime}`,
          mallCoords,
          floorLabel
        };
        
        await createStore(values._mallId, storeData);
        navigate('/admin?tab=stores');
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin?tab=stores')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {isEditMode ? 'แก้ไขร้านค้า' : 'เพิ่มร้านค้าใหม่'}
                </h1>
                <p className="text-sm text-gray-600">
                  {isEditMode ? 'แก้ไขข้อมูลร้านค้า' : 'เพิ่มร้านค้าใหม่เข้าสู่ระบบ'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            
            {/* Mall and Floor Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Building2 className="w-6 h-6 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">เลือกห้างและชั้น</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField
                  name="_mallId"
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
              </div>
            </div>

            {/* Store Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Store className="w-6 h-6 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">ข้อมูลร้านค้า</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Phone className="w-6 h-6 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">ข้อมูลการติดต่อ</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PhoneField
                  name="phone"
                  label="เบอร์โทร"
                  placeholder="+66 81 234 5678"
                  helper="เบอร์โทรติดต่อร้านค้า"
                />
              </div>
            </div>

            {/* Operating Hours */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Clock className="w-6 h-6 text-orange-600" />
                <h2 className="text-lg font-semibold text-gray-900">เวลาเปิด-ปิดทำการ</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField
                  name="openTime"
                  label="เวลาเปิด"
                  placeholder="10:00"
                  helper="เวลาที่ร้านเปิดทำการ"
                />

                <TextField
                  name="closeTime"
                  label="เวลาปิด"
                  placeholder="22:00"
                  helper="เวลาที่ร้านปิดทำการ"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-end space-x-4">
                <BaseButton
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin?tab=stores')}
                  disabled={isLoading}
                >
                  ยกเลิก
                </BaseButton>
                <BaseButton
                  type="submit"
                  variant="primary"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  {isLoading 
                    ? (isEditMode ? "กำลังบันทึก..." : "กำลังเพิ่ม...") 
                    : (isEditMode ? "บันทึกการแก้ไข" : "เพิ่มร้านค้า")
                  }
                </BaseButton>
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default StoreCreatePage;
