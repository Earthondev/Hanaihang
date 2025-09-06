/**
 * Enhanced Hook for using distance calculation Web Worker with search ranking
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

export interface DistanceWorkerItem {
  id: string;
  coords?: { lat: number; lng: number };
  kind?: 'mall' | 'store';
  openNow?: boolean;
}

export interface DistanceResult {
  id: string;
  distanceKm: number;
  score: number;
  kind?: 'mall' | 'store';
  openNow?: boolean;
}

export function useDistanceWorker() {
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  
  const worker = useMemo(() => {
    try {
      const workerInstance = new Worker(
        new URL('/workers/distance.worker.ts', import.meta.url),
        { type: 'module' }
      );
      
      workerInstance.onmessage = () => {
        setIsWorkerReady(true);
      };
      
      workerInstance.onerror = (error) => {
        console.error('Distance worker error:', error);
        setIsWorkerReady(false);
      };
      
      return workerInstance;
    } catch (error) {
      console.error('Failed to create distance worker:', error);
      return null;
    }
  }, []);

  const calculateDistances = useCallback((
    origin: { lat: number; lng: number },
    items: DistanceWorkerItem[],
    callback: (results: DistanceResult[]) => void
  ) => {
    if (!worker || !isWorkerReady) {
      console.warn('Distance worker not ready');
      return;
    }

    const handleMessage = (e: MessageEvent) => {
      const results = e.data as DistanceResult[];
      callback(results);
      worker.removeEventListener('message', handleMessage);
    };

    worker.addEventListener('message', handleMessage);
    worker.postMessage({ origin, rows: items });
  }, [worker, isWorkerReady]);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      if (worker) {
        worker.terminate();
      }
    };
  }, [worker]);

  return {
    calculateDistances,
    isWorkerReady
  };
}