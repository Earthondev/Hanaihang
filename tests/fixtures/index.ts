/**
 * Test fixtures and mock data for E2E tests
 */

export const TEST_DATA = {
  locations: {
    bangkok: { latitude: 13.7563, longitude: 100.5018 },
    centralRama3: { latitude: 13.6891, longitude: 100.5441 },
    siamParagon: { latitude: 13.7462, longitude: 100.5347 },
    terminal21: { latitude: 13.7304, longitude: 100.5392 }
  },
  
  queries: {
    mall: 'Central Rama 3',
    store: 'H&M',
    brand: 'Starbucks',
    category: 'Fashion',
    invalid: 'xyz123nonexistent'
  },
  
  malls: [
    {
      id: 'central-rama-3',
      name: 'Central Rama 3',
      address: '123 Rama III Road, Bangkok',
      coordinates: { latitude: 13.6891, longitude: 100.5441 }
    },
    {
      id: 'siam-paragon',
      name: 'Siam Paragon',
      address: '991 Rama I Road, Bangkok',
      coordinates: { latitude: 13.7462, longitude: 100.5347 }
    }
  ],
  
  stores: [
    {
      id: 'hm-central-rama-3',
      name: 'H&M',
      mallId: 'central-rama-3',
      floor: 'G',
      category: 'Fashion',
      coordinates: { latitude: 13.6891, longitude: 100.5441 }
    },
    {
      id: 'starbucks-central-rama-3',
      name: 'Starbucks',
      mallId: 'central-rama-3',
      floor: '1',
      category: 'Food & Beverage',
      coordinates: { latitude: 13.6891, longitude: 100.5441 }
    }
  ],
  
  searchResults: {
    mall: [
      {
        id: 'central-rama-3',
        name: 'Central Rama 3',
        type: 'mall',
        distance: 2.5,
        isOpen: true,
        hours: '10:00 - 22:00'
      }
    ],
    store: [
      {
        id: 'hm-central-rama-3',
        name: 'H&M',
        mall: 'Central Rama 3',
        floor: 'G',
        type: 'store',
        distance: 2.5,
        isOpen: true,
        hours: '10:00 - 22:00'
      }
    ]
  }
};

export const TEST_SELECTORS = {
  search: {
    input: '[data-testid="search-input"]',
    results: '[data-testid="search-result-card"]',
    skeleton: '[data-testid="skeleton-card"]',
    emptyState: '[data-testid="empty-state"]',
    suggestions: '[data-testid="search-suggestions"]',
    loading: '[data-testid="search-loading"]'
  },
  
  location: {
    button: '[data-testid="use-my-location"]',
    loading: '[data-testid="location-loading"]',
    hint: '[data-testid="gps-hint"]'
  },
  
  mall: {
    card: '[data-testid="mall-card"]',
    name: '[data-testid="mall-name"]',
    address: '[data-testid="mall-address"]',
    distance: '[data-testid="distance"]',
    hours: '[data-testid="hours"]',
    openBadge: '[data-testid="open-now-badge"]',
    closedBadge: '[data-testid="closed-badge"]',
    navigateButton: '[data-testid="navigate-button"]'
  },
  
  store: {
    card: '[data-testid="store-card"]',
    name: '[data-testid="store-name"]',
    floor: '[data-testid="store-floor"]',
    category: '[data-testid="store-category"]'
  },
  
  admin: {
    button: '[data-testid="admin-button"]',
    addMallButton: '[data-testid="add-mall-button"]',
    mallFormDrawer: '[data-testid="mall-form-drawer"]',
    mallNameInput: '[data-testid="mall-name-input"]',
    mallAddressInput: '[data-testid="mall-address-input"]',
    submitMallButton: '[data-testid="submit-mall-button"]',
    editStoreButton: '[data-testid="edit-store-button"]',
    storeEditDrawer: '[data-testid="store-edit-drawer"]',
    storeNameInput: '[data-testid="store-name-input"]',
    saveStoreButton: '[data-testid="save-store-button"]'
  },
  
  ui: {
    heroTitle: '[data-testid="hero-title"]',
    successToast: '[data-testid="success-toast"]',
    recentSearches: '[data-testid="recent-searches"]',
    unknownDistance: '[data-testid="unknown-distance"]',
    categoryFilter: '[data-testid="category-filter"]',
    floorFilter: '[data-testid="floor-filter"]',
    fashionCategory: '[data-testid="fashion-category"]'
  }
};

export const TEST_TIMEOUTS = {
  short: 1000,
  medium: 3000,
  long: 5000,
  search: 400,
  skeleton: 500,
  results: 600
};

export const PERFORMANCE_THRESHOLDS = {
  medianLatency: 400,
  p95Latency: 600,
  maxLatency: 1000
};
