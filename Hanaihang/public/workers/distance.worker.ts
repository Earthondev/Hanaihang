/**
 * Enhanced Web Worker for distance calculation and search ranking
 * Optimized for search results with batch processing and scoring
 */

interface Location {
  lat: number;
  lng: number;
}

interface DistanceRequest {
  origin: Location;
  rows: Array<{
    id: string;
    coords?: Location;
    kind?: 'mall' | 'store';
    openNow?: boolean;
  }>;
}

interface DistanceResult {
  id: string;
  distanceKm: number;
  score: number;
  kind?: 'mall' | 'store';
  openNow?: boolean;
}

// Haversine formula for calculating distance between two points
function distanceKm(origin: Location, destination: Location): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(destination.lat - origin.lat);
  const dLng = toRadians(destination.lng - origin.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(origin.lat)) * Math.cos(toRadians(destination.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Calculate search ranking score
function calculateScore(
  distanceKm: number, 
  kind?: 'mall' | 'store', 
  openNow?: boolean
): number {
  const weights = {
    DISTANCE: 1.0,
    OPEN_STATUS: 1.0,
    TYPE_BONUS: 0.1
  };

  let score = weights.DISTANCE * distanceKm;

  // Open status bonus
  if (openNow) {
    score -= weights.OPEN_STATUS * 5;
  }

  // Type bonus (malls get slight preference)
  if (kind === 'mall') {
    score -= weights.TYPE_BONUS;
  }

  return score;
}

// Batch process distances for better performance
function processBatch(origin: Location, rows: DistanceRequest['rows']): DistanceResult[] {
  const results: DistanceResult[] = [];
  
  for (const row of rows) {
    try {
      if (!row.coords) {
        // Add fallback result for missing coordinates
        results.push({
          id: row.id,
          distanceKm: 999,
          score: 999,
          kind: row.kind,
          openNow: row.openNow
        });
        continue;
      }

      const distanceKm = distanceKm(origin, row.coords);
      const score = calculateScore(distanceKm, row.kind, row.openNow);
      
      results.push({
        id: row.id,
        distanceKm,
        score,
        kind: row.kind,
        openNow: row.openNow
      });
    } catch (error) {
      console.warn(`Distance calculation failed for ${row.id}:`, error);
      // Add fallback result
      results.push({
        id: row.id,
        distanceKm: 999,
        score: 999,
        kind: row.kind,
        openNow: row.openNow
      });
    }
  }
  
  return results;
}

// Worker message handling
self.onmessage = (e: MessageEvent<DistanceRequest>) => {
  const { origin, rows } = e.data;
  
  try {
    if (!origin || !rows || rows.length === 0) {
      self.postMessage([]);
      return;
    }

    // Process in batches for better performance
    const batchSize = 50;
    const results: DistanceResult[] = [];
    
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const batchResults = processBatch(origin, batch);
      results.push(...batchResults);
      
      // Yield control periodically for large datasets
      if (i % (batchSize * 5) === 0) {
        // Use setTimeout to yield control
        setTimeout(() => {}, 0);
      }
    }
    
    // Sort by score (lower is better)
    results.sort((a, b) => a.score - b.score);
    
    // Send results back to main thread
    self.postMessage(results);
  } catch (error) {
    console.error('Distance calculation error:', error);
    self.postMessage([]);
  }
};

// Handle errors
self.onerror = (error) => {
  console.error('Distance worker error:', error);
  self.postMessage([]);
};