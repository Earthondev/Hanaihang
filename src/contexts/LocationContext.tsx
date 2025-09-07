import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

import { UserLocation } from '../types/mall-system';
import { getCurrentLocation } from '../lib/geo-utils';

interface LocationContextType {
  userLocation: UserLocation | null;
  isLoading: boolean;
  error: string | null;
  requestLocation: () => Promise<void>;
  clearLocation: () => void;
  hasLocationPermission: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  const requestLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const location = await getCurrentLocation();
      setUserLocation(location);
      setHasLocationPermission(true);
      
      // เก็บใน localStorage สำหรับการใช้งานครั้งต่อไป
      localStorage.setItem('userLocation', JSON.stringify(location));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถขอตำแหน่งได้';
      setError(errorMessage);
      setHasLocationPermission(false);
      
      // ลบตำแหน่งเก่าออก
      localStorage.removeItem('userLocation');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearLocation = useCallback(() => {
    setUserLocation(null);
    setError(null);
    setHasLocationPermission(false);
    localStorage.removeItem('userLocation');
  }, []);

  // โหลดตำแหน่งจาก localStorage เมื่อเริ่มต้น (ถ้ามี)
  React.useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation);
        // ตรวจสอบว่าตำแหน่งไม่เก่าเกิน 1 ชั่วโมง
        if (location.timestamp && Date.now() - location.timestamp < 3600000) {
          setUserLocation(location);
          setHasLocationPermission(true);
        } else {
          localStorage.removeItem('userLocation');
        }
      } catch (err) {
        localStorage.removeItem('userLocation');
      }
    }
  }, []);

  const value: LocationContextType = {
    userLocation,
    isLoading,
    error,
    requestLocation,
    clearLocation,
    hasLocationPermission
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
