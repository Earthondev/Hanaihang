import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { MapPin, Navigation, Building, Clock, Phone } from 'lucide-react';

import { Mall } from '@/types/mall-system';
import { distanceKm } from '@/services/geoutils/geo-utils';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  malls: Mall[];
  userLocation: { lat: number; lng: number } | null;
  onMallClick?: (mall: Mall) => void;
  className?: string;
}

// Custom marker icons
const createCustomIcon = (color: string, icon: string) => {
  // Use simple text instead of emoji to avoid btoa encoding issues
  const safeIcon = icon === '🏢' ? 'M' : icon === '📍' ? 'U' : icon;
  
  const svgString = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path fill="${color}" stroke="#fff" stroke-width="2" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z"/>
      <text x="12.5" y="20" text-anchor="middle" fill="white" font-size="12" font-family="Arial" font-weight="bold">${safeIcon}</text>
    </svg>
  `;
  
  // Encode SVG properly for data URL
  const encodedSvg = encodeURIComponent(svgString);
  
  return new Icon({
    iconUrl: `data:image/svg+xml;charset=utf-8,${encodedSvg}`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  });
};

const mallIcon = createCustomIcon('#10b981', '🏢');
const userIcon = createCustomIcon('#3b82f6', '📍');

// Component to center map on user location
const MapCenter: React.FC<{ userLocation: { lat: number; lng: number } | null }> = ({ userLocation }) => {
  const map = useMap();
  
  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 13);
    }
  }, [userLocation, map]);
  
  return null;
};

const MapView: React.FC<MapViewProps> = ({
  malls,
  userLocation,
  onMallClick,
  className = ''
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([13.7563, 100.5018]); // Bangkok center
  const [mapZoom, setMapZoom] = useState(11);

  // Set initial map center based on user location or malls
  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng]);
      setMapZoom(13);
    } else if (malls.length > 0) {
      // Calculate center of all malls
      const avgLat = malls.reduce((sum, mall) => sum + (mall.coords?.lat || 0), 0) / malls.length;
      const avgLng = malls.reduce((sum, mall) => sum + (mall.coords?.lng || 0), 0) / malls.length;
      setMapCenter([avgLat, avgLng]);
      setMapZoom(11);
    }
  }, [userLocation, malls]);

  const handleMallClick = (mall: Mall) => {
    if (onMallClick) {
      onMallClick(mall);
    }
  };

  const getMallDistance = (mall: Mall) => {
    if (!userLocation || !mall.coords) return null;
    return distanceKm(userLocation, mall.coords);
  };

  const getMallStatusColor = (status: string) => {
    switch (status) {
      case 'Published':
        return 'text-green-600';
      case 'Draft':
        return 'text-yellow-600';
      case 'Archived':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getMallStatusText = (status: string) => {
    switch (status) {
      case 'Published':
        return 'เปิด';
      case 'Draft':
        return 'ร่าง';
      case 'Archived':
        return 'ปิด';
      default:
        return status;
    }
  };

  return (
    <div className={`w-full h-full ${className}`}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Center map on user location */}
        <MapCenter userLocation={userLocation} />
        
        {/* User location marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userIcon}
          >
            <Popup>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Navigation className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-blue-600">ตำแหน่งของคุณ</span>
                </div>
                <p className="text-sm text-gray-600">
                  {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Mall markers */}
        {malls.map((mall) => {
          if (!mall.coords) return null;
          
          const distance = getMallDistance(mall);
          
          return (
            <Marker
              key={mall.id}
              position={[mall.coords.lat, mall.coords.lng]}
              icon={mallIcon}
              eventHandlers={{
                click: () => handleMallClick(mall),
              }}
            >
              <Popup>
                <div className="min-w-[250px]">
                  {/* Mall Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Building className="w-4 h-4 text-green-600" />
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {mall.displayName || mall.name}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {mall.address}
                      </p>
                    </div>
                    <span className={`text-xs font-medium ${getMallStatusColor(mall.status)}`}>
                      {getMallStatusText(mall.status)}
                    </span>
                  </div>
                  
                  {/* Distance */}
                  {distance && (
                    <div className="flex items-center space-x-2 mb-3">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-700">
                        ระยะทาง {distance.toFixed(1)} กม.
                      </span>
                    </div>
                  )}
                  
                  {/* Mall Info */}
                  <div className="space-y-2 mb-3">
                    {mall.hours && (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-600">
                          {typeof mall.hours === 'string' ? mall.hours : 
                           `${mall.hours.open} - ${mall.hours.close}`}
                        </span>
                      </div>
                    )}
                    
                    {mall.contact?.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-600">
                          {mall.contact.phone}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Button */}
                  <button
                    onClick={() => handleMallClick(mall)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors"
                  >
                    ดูรายละเอียด
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;
