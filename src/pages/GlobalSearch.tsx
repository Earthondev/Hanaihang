import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Building, Store, ExternalLink } from 'lucide-react';
import { searchBrands } from '../services/api';
import Card, { CardContent } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const GlobalSearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ store: any; mall: any }>>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const results = searchBrands(searchQuery.trim());
      setSearchResults(results);
      setHasSearched(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleMallClick = (mallId: string) => {
    navigate(`/${mallId}`);
  };

  const handleStoreClick = (mallId: string, storeId: string) => {
    navigate(`/${mallId}/stores/${storeId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ค้นหาแบรนด์</h1>
              <p className="text-gray-600">ค้นหาร้านค้าและแบรนด์ในห้างสรรพสินค้าทั่วกรุงเทพฯ</p>
            </div>
            <img src="/logo-horizontal.svg" alt="Logo" className="h-8" />
          </div>

          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="พิมพ์ชื่อแบรนด์ เช่น Zara, Starbucks, Gucci..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                leftIcon={<Search className="h-5 w-5" />}
              />
            </div>
            <Button onClick={handleSearch} disabled={!searchQuery.trim()}>
              ค้นหา
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {hasSearched && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              ผลการค้นหา "{searchQuery}"
            </h2>
            <p className="text-gray-600">
              พบ {searchResults.length} ร้านค้า
            </p>
          </div>
        )}

        {hasSearched && searchResults.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ไม่พบแบรนด์ที่ค้นหา
              </h3>
              <p className="text-gray-600 mb-4">
                ลองค้นหาด้วยชื่อแบรนด์อื่น หรือตรวจสอบการสะกดคำ
              </p>
              <Button onClick={() => setSearchQuery('')} variant="outline">
                ล้างการค้นหา
              </Button>
            </CardContent>
          </Card>
        )}

        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map(({ store, mall }) => (
              <Card key={store.id} className="hover:shadow-lg transition-shadow">
                <CardContent>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {store.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{store.category}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Building className="h-4 w-4" />
                        <span>{mall.nameTH}</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        ชั้น {store.floor} • {store.unit}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                      <span className="text-lg font-bold text-blue-600">
                        {store.name.charAt(0)}
                      </span>
                    </div>
                  </div>

                  {store.description && (
                    <p className="text-sm text-gray-600 mb-3">
                      {store.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-gray-500">
                      {store.hours}
                    </span>
                  </div>

                  {store.tags && store.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {store.tags.slice(0, 3).map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleMallClick(mall.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      ดูห้าง
                    </Button>
                    <Button
                      onClick={() => handleStoreClick(mall.id, store.id)}
                      size="sm"
                      className="flex-1"
                    >
                      <Store className="h-4 w-4 mr-1" />
                      รายละเอียด
                    </Button>
                  </div>

                  {store.website && (
                    <div className="mt-3 pt-3 border-t">
                      <a
                        href={store.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        เว็บไซต์
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!hasSearched && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ค้นหาแบรนด์ที่คุณสนใจ
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              พิมพ์ชื่อแบรนด์หรือร้านค้าเพื่อค้นหาว่ามีอยู่ในห้างไหนบ้าง
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalSearch;
