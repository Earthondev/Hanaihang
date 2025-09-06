import React from 'react';

export type SearchTab = 'all' | 'malls' | 'stores';

interface SearchTabsProps {
  activeTab: SearchTab;
  onTabChange: (tab: SearchTab) => void;
  mallCount: number;
  storeCount: number;
}

const SearchTabs: React.FC<SearchTabsProps> = ({
  activeTab,
  onTabChange,
  mallCount,
  storeCount
}) => {
  const tabs = [
    {
      id: 'all' as SearchTab,
      label: 'ทั้งหมด',
      count: mallCount + storeCount,
      icon: '🔍'
    },
    {
      id: 'malls' as SearchTab,
      label: 'ห้าง',
      count: mallCount,
      icon: '🏢'
    },
    {
      id: 'stores' as SearchTab,
      label: 'ร้านค้า',
      count: storeCount,
      icon: '🏪'
    }
  ];

  return (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
          {tab.count > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === tab.id
                ? 'bg-gray-100 text-gray-700'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default SearchTabs;
