import React from 'react';

import { useLocation } from '../../contexts/LocationContext';

interface LocationButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
  onLocationGranted?: () => void;
}

const LocationButton: React.FC<LocationButtonProps> = ({
  className = "",
  size = "md",
  variant = "primary",
  onLocationGranted
}) => {
  const { requestLocation, isLoading, error, hasLocationPermission, userLocation } = useLocation();

  const handleClick = async () => {
    await requestLocation();
    if (userLocation && onLocationGranted) {
      onLocationGranted();
    }
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-base",
    lg: "px-6 py-4 text-lg"
  };

  const variantClasses = {
    primary: "bg-green-600 hover:bg-green-700 text-white",
    secondary: "bg-white hover:bg-gray-50 text-green-600 border border-green-600",
    ghost: "bg-transparent hover:bg-green-50 text-green-600"
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        inline-flex items-center space-x-2 rounded-lg font-medium
        transition-colors focus:outline-none focus:ring-2 focus:ring-green-200
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      aria-label={isLoading ? "กำลังขอตำแหน่ง..." : hasLocationPermission ? "ใช้ตำแหน่งปัจจุบัน" : "ขอใช้ตำแหน่งปัจจุบัน"}
    >
      {isLoading ? (
        <>
          <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${iconSizes[size]}`} />
          <span>กำลังขอตำแหน่ง...</span>
        </>
      ) : hasLocationPermission ? (
        <>
          <svg className={`${iconSizes[size]} text-green-500`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <span>ใช้ตำแหน่งปัจจุบัน</span>
        </>
      ) : (
        <>
          <svg className={iconSizes[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          <span>ใช้ตำแหน่งฉัน</span>
        </>
      )}
    </button>
  );
};

export default LocationButton;
