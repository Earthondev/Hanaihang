/**
 * Search Result Card Component
 * Displays unified search results for both malls and stores
 */

import React from 'react';
import { Building, Store, MapPin, Clock, ArrowRight } from 'lucide-react';
import { UnifiedSearchResult } from '../../lib/unified-search';
import { formatDistance } from '../../lib/geo-utils';

interface SearchResultCardProps {
  result: UnifiedSearchResult;
  highlightQuery?: string;
  onClick?: () => void;
}

const SearchResultCard: React.FC<SearchResultCardProps> = ({
  result,
  highlightQuery,
  onClick
}) => {
  const getIcon = () => {
    if (result.kind === 'mall') {
      return <Building className="w-5 h-5 text-blue-600" />;
    }
    return <Store className="w-5 h-5 text-green-600" />;
  };

  const getTypeLabel = () => {
    return result.kind === 'mall' ? 'ห้างสรรพสินค้า' : 'ร้านค้า';
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'Fashion': return 'bg-pink-100 text-pink-800';
      case 'Beauty': return 'bg-purple-100 text-purple-800';
      case 'Electronics': return 'bg-blue-100 text-blue-800';
      case 'Food & Beverage': return 'bg-orange-100 text-orange-800';
      case 'Sports': return 'bg-green-100 text-green-800';
      case 'Books': return 'bg-yellow-100 text-yellow-800';
      case 'Home & Garden': return 'bg-indigo-100 text-indigo-800';
      case 'Health & Pharmacy': return 'bg-red-100 text-red-800';
      case 'Entertainment': return 'bg-purple-100 text-purple-800';
      case 'Services': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'Closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'Active': return 'เปิด';
      case 'Maintenance': return 'ปรับปรุง';
      case 'Closed': return 'ปิด';
      default: return status || 'ไม่ระบุ';
    }
  };

  const highlightText = (text: string, query?: string) => {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  };

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 
              className="font-semibold text-gray-900 text-lg leading-tight"
              dangerouslySetInnerHTML={{ 
                __html: highlightText(result.name, highlightQuery) 
              }}
            />
            <p className="text-sm text-gray-600 mt-1">
              {getTypeLabel()}
              {result.mallName && ` • ${result.mallName}`}
            </p>
          </div>
        </div>

        {/* Status Badge (for stores) */}
        {result.kind === 'store' && result.status && (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(result.status)}`}>
            {getStatusText(result.status)}
          </span>
        )}
      </div>

      {/* Category (for stores) */}
      {result.kind === 'store' && result.category && (
        <div className="mb-3">
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(result.category)}`}>
            {result.category}
          </span>
        </div>
      )}

      {/* Location & Floor */}
      <div className="flex items-center justify-between mb-3 text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          {result.floorLabel && (
            <div className="flex items-center space-x-1">
              <Building className="w-4 h-4 text-gray-400" />
              <span>ชั้น {result.floorLabel}</span>
            </div>
          )}
          
          {result.openHours && (
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{result.openHours}</span>
            </div>
          )}
        </div>

        {/* Distance */}
        {result.distanceKm !== undefined && (
          <div className="flex items-center space-x-1">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{formatDistance(result.distanceKm)}</span>
          </div>
        )}
      </div>

      {/* Action Indicator */}
      <div className="flex items-center justify-center pt-3 border-t border-gray-100">
        <div className="flex items-center text-sm text-gray-400 group-hover:text-gray-600 transition-colors">
          <span>ดูรายละเอียด</span>
          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};

export default SearchResultCard;