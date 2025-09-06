import React from 'react';
import { Mall } from '../../types/mall-system';
import { formatDistance } from '../../lib/geo-utils';

interface MallCardProps {
  mall: Mall;
  distance?: number;
  storeCount?: number;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'compact' | 'featured';
}

const MallCard: React.FC<MallCardProps> = ({
  mall,
  distance,
  storeCount,
  onClick,
  className = "",
  variant = "default"
}) => {
  const formatHours = (hours?: { open: string; close: string }) => {
    if (!hours) return null;
    return `${hours.open}-${hours.close}`;
  };

  if (variant === 'compact') {
    return (
      <div
        className={`
          bg-white rounded-lg border border-gray-200 p-3
          hover:shadow-md transition-shadow cursor-pointer
          ${onClick ? 'hover:border-green-300' : ''}
          ${className}
        `}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{mall.displayName}</h3>
            <p className="text-sm text-gray-600">{mall.district}</p>
          </div>
          
          <div className="text-right text-sm text-gray-500">
            {distance !== undefined && (
              <div>{formatDistance(distance)}</div>
            )}
            {storeCount !== undefined && (
              <div>{storeCount} ร้าน</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div
        className={`
          bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200 p-6
          hover:shadow-lg transition-all cursor-pointer transform hover:scale-105
          ${className}
        `}
        onClick={onClick}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">{mall.displayName}</h3>
          
          {mall.district && (
            <p className="text-gray-600 mb-3">{mall.district}</p>
          )}
          
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            {distance !== undefined && (
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                </svg>
                <span>{formatDistance(distance)}</span>
              </div>
            )}
            
            {storeCount !== undefined && (
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                </svg>
                <span>{storeCount} ร้าน</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200 p-6
        hover:shadow-md transition-shadow cursor-pointer
        ${onClick ? 'hover:border-green-300' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1">
          {/* Mall Logo */}
          {mall.logoUrl ? (
            <img
              src={mall.logoUrl}
              alt={`${mall.displayName} logo`}
              className="w-12 h-12 rounded-lg object-cover shadow-sm border border-gray-200 flex-shrink-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className={`w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0 ${mall.logoUrl ? 'hidden' : ''}`}
            style={{ display: mall.logoUrl ? 'none' : 'flex' }}
          >
            {mall.displayName.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-gray-900 mb-1">
              {mall.displayName}
            </h3>
          
          {mall.address && (
            <p className="text-gray-600 mb-2">{mall.address}</p>
          )}
          
          {mall.district && (
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
              {mall.district}
            </span>
          )}
          </div>
        </div>

        {distance !== undefined && (
          <div className="text-right">
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              </svg>
              <span>{formatDistance(distance)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {/* Contact Info */}
        {(mall.contact?.phone || mall.contact?.website) && (
          <div className="space-y-2">
            {mall.contact.phone && (
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                <span className="text-gray-600">{mall.contact.phone}</span>
              </div>
            )}
            
            {mall.contact.website && (
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
                </svg>
                <span className="text-gray-600 truncate">{mall.contact.website}</span>
              </div>
            )}
          </div>
        )}

        {/* Hours & Store Count */}
        <div className="space-y-2">
          {mall.hours && (
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span className="text-gray-600">{formatHours(mall.hours)}</span>
            </div>
          )}
          
          {storeCount !== undefined && (
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
              <span className="text-gray-600">{storeCount} ร้านค้า</span>
            </div>
          )}
        </div>
      </div>

      {/* Action hint */}
      {onClick && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-center text-sm text-gray-400">
            <span>คลิกเพื่อดูร้านค้า</span>
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default MallCard;
