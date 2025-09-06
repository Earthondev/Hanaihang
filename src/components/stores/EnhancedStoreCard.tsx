import React, { useEffect, useState } from "react";
import { Store, ResolvedStore } from "../../lib/store-resolver";
import { resolveStoreComputed, resolveStoreLazy } from "../../lib/store-resolver";

interface EnhancedStoreCardProps {
  store: Store;
  userLocation?: {lat: number; lng: number};
  showMallName?: boolean;
  showDistance?: boolean;
  onClick?: () => void;
  className?: string;
  lazy?: boolean; // ใช้ lazy loading หรือไม่
}

export function EnhancedStoreCard({ 
  store, 
  userLocation, 
  showMallName = true,
  showDistance = true,
  onClick,
  className = "",
  lazy = false
}: EnhancedStoreCardProps) {
  const [view, setView] = useState<ResolvedStore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    
    const loadData = async () => {
      try {
        setLoading(true);
        
        // ใช้ lazy loading หรือ full resolution
        const resolved = lazy 
          ? resolveStoreLazy(store, userLocation)
          : await resolveStoreComputed(store, userLocation);
        
        if (alive) {
          setView(resolved);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error resolving store:', error);
        if (alive) {
          setLoading(false);
        }
      }
    };

    loadData();
    
    return () => { alive = false; };
  }, [store.id, userLocation?.lat, userLocation?.lng, lazy]);

  const getStatusColor = (status?: string) => {
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

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'Active':
        return 'เปิด';
      case 'Maintenance':
        return 'ปิดปรับปรุง';
      case 'Closed':
        return 'ปิด';
      default:
        return 'ไม่ทราบ';
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'Fashion':
        return '👕';
      case 'Food & Beverage':
        return '🍽️';
      case 'Beauty':
        return '💄';
      case 'Electronics':
        return '📱';
      case 'Sports':
        return '⚽';
      case 'Books':
        return '📚';
      case 'Home & Garden':
        return '🏠';
      case 'Health & Pharmacy':
        return '💊';
      case 'Entertainment':
        return '🎬';
      case 'Services':
        return '🔧';
      default:
        return '🏪';
    }
  };

  if (loading) {
    return (
      <div className={`rounded-xl border border-gray-200 p-4 animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded mb-2 w-1/2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
      </div>
    );
  }

  return (
    <div 
      className={`rounded-xl border border-gray-200 p-4 hover:border-green-300 transition-colors cursor-pointer ${onClick ? 'hover:shadow-md' : ''} ${className}`}
      onClick={onClick}
      data-testid="store-card"
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
          
          {showMallName && view?.mallName && (
            <p className="text-sm text-gray-600 mb-1">
              {view.mallName}
            </p>
          )}
        </div>

        {/* Status Badge */}
        <span className={`
          inline-flex px-2 py-1 text-xs font-semibold rounded-full
          ${getStatusColor(store.status)}
        `}>
          {getStatusText(store.status)}
        </span>
      </div>

      {/* Category & Location */}
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {store.category}
        </span>
        
        <div className="text-sm text-gray-600">
          ชั้น {view?.floorLabel || store.floorId}
          {store.unit && ` • ยูนิต ${store.unit}`}
        </div>
      </div>

      {/* Distance & Hours */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          {showDistance && view?.distanceKm !== null && (
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              </svg>
              <span>ระยะทาง {view.distanceKm.toFixed(1)} กม.</span>
            </div>
          )}
        </div>
        
        {store.hours && (
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>{store.hours}</span>
          </div>
        )}
      </div>

      {/* Phone */}
      {store.phone && (
        <div className="mt-2 text-sm text-gray-500">
          📞 {store.phone}
        </div>
      )}

      {/* Debug info (only in development) */}
      {process.env.NODE_ENV === 'development' && view?.coordsUsed && (
        <div className="mt-2 text-xs text-gray-400">
          Coords: {view.coordsUsed.lat.toFixed(4)}, {view.coordsUsed.lng.toFixed(4)}
        </div>
      )}
    </div>
  );
}
