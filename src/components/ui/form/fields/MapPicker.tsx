import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { MapPin, Navigation } from 'lucide-react';

interface MapPickerProps {
  name: string;
  label: string;
  required?: boolean;
  helper?: string;
  className?: string;
}

export default function MapPicker({
  name,
  label,
  required = false,
  helper,
  className = '',
}: MapPickerProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext();
  const [isMapVisible, setIsMapVisible] = useState(false);

  const location = watch(name);
  const _error = errors[name]?.message as string;

  // Get user location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          setValue(name, { lat: latitude, lng: longitude });
        },
        error => {
          console.error('Error getting location:', error);
        },
      );
    }
  };

  // Simple map component (placeholder for now)
  const MapComponent = () => (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="text-center py-8">
        <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">แผนที่เลือกพิกัด</p>
        <p className="text-sm text-gray-500">คลิกเพื่อเลือกตำแหน่ง</p>
        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={getUserLocation}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Navigation className="w-4 h-4" />
            <span>ใช้ตำแหน่งปัจจุบัน</span>
          </button>
          <div className="text-sm text-gray-600">
            {location ? (
              <div>
                <p>
                  พิกัดที่เลือก: {location.lat?.toFixed(6)},{' '}
                  {location.lng?.toFixed(6)}
                </p>
                <button
                  type="button"
                  onClick={() => setValue(name, null)}
                  className="text-red-600 hover:text-red-700"
                >
                  ล้างพิกัด
                </button>
              </div>
            ) : (
              <p>ยังไม่ได้เลือกพิกัด</p>
            )}
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

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            {...register(`${name}.lat`)}
            type="number"
            step="any"
            placeholder="ละติจูด"
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            {...register(`${name}.lng`)}
            type="number"
            step="any"
            placeholder="ลองจิจูด"
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="button"
          onClick={() => setIsMapVisible(!isMapVisible)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {isMapVisible ? 'ซ่อนแผนที่' : 'แสดงแผนที่เลือกพิกัด'}
        </button>

        {isMapVisible && <MapComponent />}
      </div>

      {helper && (
        <p className="mt-1 text-sm text-gray-500" id={`${name}-helper`}>
          {helper}
        </p>
      )}

      {_error && (
        <p
          className="mt-1 text-sm text-red-600"
          role="alert"
          id={`${name}-error`}
        >
          {_error}
        </p>
      )}
    </div>
  );
}
