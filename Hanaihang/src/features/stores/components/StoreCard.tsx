import React, { useState, useEffect } from 'react';

import { Store } from '@/types/mall-system';
import { formatDistance } from '@/services/geoutils/geo-utils';
import { resolveStoreComputed } from '@/lib/store-resolver';

interface StoreCardProps {
  store: Store;
  mall?: Mall;
  distance?: number;
  showMallName?: boolean;
  showDistance?: boolean;
  userLocation?: { lat: number; lng: number };
  onClick?: () => void;
  className?: string;
}

const StoreCard: React.FC<StoreCardProps> = ({
  store,
  mall,
  distance,
  showMallName = false,
  showDistance = false,
  userLocation,
  onClick,
  className = '',
}) => {
  const [resolvedData, setResolvedData] = useState<{
    mallName: string;
    floorLabel: string;
    distanceKm: number | null;
  } | null>(null);

  // Resolve store data using the new system
  useEffect(() => {
    let alive = true;

    const resolveData = async () => {
      try {
        const resolved = await resolveStoreComputed(store as unknown, userLocation);
        if (alive) {
          setResolvedData({
            mallName: resolved.mallName,
            floorLabel: resolved.floorLabel,
            distanceKm: resolved.distanceKm,
          });
        }
      } catch (error) {
        console.error('Error resolving store data:', error);
      }
    };

    resolveData();

    return () => {
      alive = false;
    };
  }, [store.id, userLocation?.lat, userLocation?.lng]);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'Closed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Active':
        return 'เปิด';
      case 'Maintenance':
        return 'ปรับปรุง';
      case 'Closed':
        return 'ปิด';
      default:
        return status;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Fashion':
        return '👕';
      case 'Beauty':
        return '💄';
      case 'Electronics':
        return '📱';
      case 'Food & Beverage':
        return '🍽️';
      case 'Sports':
        return '⚽';
      case 'Books':
        return '📚';
      case 'Home & Garden':
        return '🏠';
      case 'Health & Pharmacy':
        return '💊';
      case 'Entertainment':
        return '🎮';
      case 'Services':
        return '🔧';
      default:
        return '🏪';
    }
  };

  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200 p-4 
        hover:shadow-md transition-shadow cursor-pointer
        ${onClick ? 'hover:border-green-300' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-lg">{getCategoryIcon(store.category)}</span>
            <h3 className="font-semibold text-gray-900 text-lg leading-tight">
              {store.name}
            </h3>
          </div>

          {showMallName && (
            <p className="text-sm text-gray-600 mb-1">
              {resolvedData?.mallName || mall?.displayName || store.mallSlug}
            </p>
          )}
        </div>

        {/* Status Badge */}
        <span
          className={`
          inline-flex px-2 py-1 text-xs font-semibold rounded-full
          ${getStatusColor(store.status)}
        `}
        >
          {getStatusText(store.status)}
        </span>
      </div>

      {/* Category & Location */}
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {store.category}
        </span>

        <div className="text-sm text-gray-600">
          {resolvedData?.floorLabel
            ? `ชั้น ${resolvedData.floorLabel}`
            : `ชั้น ${store.floorId}`}{' '}
          {store.unit && `ยูนิต ${store.unit}`}
        </div>
      </div>

      {/* Distance & Hours */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          {showDistance && resolvedData?.distanceKm !== null && (
            <div className="flex items-center space-x-1">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
              </svg>
              <span>{formatDistance(resolvedData.distanceKm!)}</span>
            </div>
          )}
          {distance !== undefined && !showDistance && (
            <div className="flex items-center space-x-1">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
              </svg>
              <span>{formatDistance(distance)}</span>
            </div>
          )}

          {store.hours && (
            <div className="flex items-center space-x-1">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{store.hours}</span>
            </div>
          )}
        </div>

        {store.phone && (
          <div className="flex items-center space-x-1">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <span>{store.phone}</span>
          </div>
        )}
      </div>

      {/* Click indicator */}
      {onClick && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-center text-sm text-gray-400">
            <span>คลิกเพื่อดูรายละเอียด</span>
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreCard;
