import { Mall, Store, StoreSearchResult } from '../types/mall-system';

import { listMalls, listStores } from './firestore';

/**
 * ค้นหาห้างและร้านค้า
 */
export async function searchMallsAndBrands(query: string): Promise<{
  malls: Mall[];
  stores: StoreSearchResult[];
}> {
  if (!query.trim()) {
    return { malls: [], stores: [] };
  }

  const searchTerm = query.toLowerCase().trim();
  
  try {
    // ค้นหาห้าง
    const allMalls = await listMalls();
    const matchingMalls = allMalls.filter(mall =>
      mall.displayName.toLowerCase().includes(searchTerm) ||
      mall.district?.toLowerCase().includes(searchTerm) ||
      mall.address?.toLowerCase().includes(searchTerm)
    );

    // ค้นหาร้านค้า
    const storeResults: StoreSearchResult[] = [];
    
    for (const mall of allMalls) {
      const stores = await listStores(mall.id!, { query: searchTerm });
      
      for (const store of stores) {
        // Get floor info (simplified - in real app you'd want to cache this)
        const floors = await import('./firestore').then(m => m.listFloors(mall.id!));
        const floor = floors.find(f => f.id === store.floorId);
        
        if (floor) {
          storeResults.push({
            store,
            mall,
            floor
          });
        }
      }
    }

    return {
      malls: matchingMalls,
      stores: storeResults
    };
  } catch (error) {
    console.error('Search error:', error);
    return { malls: [], stores: [] };
  }
}

/**
 * ค้นหาร้านค้าในห้างเดียว
 */
export async function searchStoresInMall(
  _mallId: string, 
  query: string
): Promise<Store[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    return await listStores(_mallId, { query: query.trim() });
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

/**
 * ค้นหาร้านค้าตามหมวดหมู่
 */
export async function searchStoresByCategory(
  _mallId: string,
  category: string
): Promise<Store[]> {
  try {
    return await listStores(_mallId, { category });
  } catch (error) {
    console.error('Category search error:', error);
    return [];
  }
}
