import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { MapPin, Navigation, X } from 'lucide-react';

interface MapPickerProps {
  name: string;
  label: string;
  helper?: string;
  required?: boolean;
  className?: string;
}

export default function MapPicker({ 
  name, 
  label, 
  helper, 
  required = false, 
  className = '' 
}: MapPickerProps) {
  const { register, setValue, watch, formState: { errors } } = useFormContext();
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const location = watch(name);
  const error = errors[name]?.message as string;

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          setUserLocation(newLocation);
          setValue(name, newLocation);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('ไม่สามารถเข้าถึงตำแหน่งปัจจุบันได้ กรุณาตรวจสอบการอนุญาตตำแหน่ง');
        }
      );
    } else {
      alert('เบราว์เซอร์ของคุณไม่รองรับการเข้าถึงตำแหน่ง');
    }
  };

  const clearLocation = () => {
    setValue(name, null);
    setUserLocation(null);
  };

  // Enhanced map component with better UX
  const MapComponent = () => (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-green-50">
      <div className="text-center">
        <div className="mb-4">
          <MapPin className="w-12 h-12 text-blue-500 mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">เลือกตำแหน่งห้าง</h3>
          <p className="text-gray-600 mb-4">กำหนดตำแหน่งที่ตั้งของห้างบนแผนที่</p>
        </div>
        
        <div className="space-y-4">
          {/* Current Location Button */}
          <button
            type="button"
            onClick={getUserLocation}
            className="w-full inline-flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <Navigation className="w-5 h-5" />
            <span>ใช้ตำแหน่งปัจจุบัน</span>
          </button>
          
          {/* Manual Input */}
          <div className="bg-white rounded-lg p-4 border">
            <p className="text-sm font-medium text-gray-700 mb-3">หรือกรอกพิกัดเอง:</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ละติจูด</label>
                <input
                  {...register(`${name}.lat`)}
                  type="number"
                  step="any"
                  placeholder="13.7563"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ลองจิจูด</label>
                <input
                  {...register(`${name}.lng`)}
                  type="number"
                  step="any"
                  placeholder="100.5018"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* Location Display */}
          {location && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800 mb-1">ตำแหน่งที่เลือก:</p>
                  <p className="text-sm text-green-700">
                    {Number(location.lat)?.toFixed(6) || 'N/A'}, {Number(location.lng)?.toFixed(6) || 'N/A'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearLocation}
                  className="text-red-600 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                  title="ล้างพิกัด"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          
          {/* Instructions */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>💡 <strong>วิธีใช้:</strong></p>
            <p>• คลิก "ใช้ตำแหน่งปัจจุบัน" เพื่อใช้ GPS</p>
            <p>• หรือกรอกพิกัดละติจูด/ลองจิจูดเอง</p>
            <p>• ตัวอย่าง: กรุงเทพฯ = 13.7563, 100.5018</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="space-y-3">
        {/* Toggle Map Button */}
        <button
          type="button"
          onClick={() => setIsMapVisible(!isMapVisible)}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-gray-500" />
            <span className="font-medium">
              {isMapVisible ? 'ซ่อนแผนที่เลือกพิกัด' : 'แสดงแผนที่เลือกพิกัด'}
            </span>
          </div>
          <span className="text-sm text-gray-500">
            {location ? '✓ มีตำแหน่งแล้ว' : 'ยังไม่ได้เลือก'}
          </span>
        </button>
        
        {/* Map Component */}
        {isMapVisible && <MapComponent />}
      </div>
      
      {helper && (
        <p className="mt-2 text-sm text-gray-500" id={`${name}-helper`}>
          {helper}
        </p>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert" id={`${name}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
