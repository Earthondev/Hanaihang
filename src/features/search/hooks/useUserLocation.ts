import { useState, useCallback } from 'react';

import { UserLocation } from '@/types/mall-system';

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt' | null>(null);

  // Check if geolocation is supported
  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  // Get current location
  const getCurrentLocation = useCallback(async (): Promise<UserLocation | null> => {
    if (!isSupported) {
      setError('Geolocation is not supported in this browser');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5 * 60 * 1000 // 5 minutes
        });
      });

      const userLocation: UserLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: Date.now()
      };

      setLocation(userLocation);
      setPermission('granted');
      
      // Store in localStorage for persistence
      localStorage.setItem('userLocation', JSON.stringify(userLocation));
      
      return userLocation;
    } catch (err) {
      const errorMessage = err instanceof GeolocationPositionError 
        ? getGeolocationErrorMessage(err.code)
        : 'Failed to get location';
      
      setError(errorMessage);
      setPermission('denied');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Request location permission
  const requestLocation = useCallback(async (): Promise<UserLocation | null> => {
    if (!isSupported) {
      setError('Geolocation is not supported in this browser');
      return null;
    }

    // Check if we already have permission
    if (permission === 'granted' && location) {
      return location;
    }

    return await getCurrentLocation();
  }, [isSupported, permission, location, getCurrentLocation]);

  // Clear location
  const clearLocation = useCallback(() => {
    setLocation(null);
    localStorage.removeItem('userLocation');
  }, []);

  // Load location from localStorage on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation);
        // Check if location is not too old (24 hours)
        if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          setLocation(parsed);
          setPermission('granted');
        } else {
          localStorage.removeItem('userLocation');
        }
      } catch (err) {
        localStorage.removeItem('userLocation');
      }
    }
  }, []);

  // Check permission status
  useEffect(() => {
    if (isSupported && 'permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName })
        .then(result => {
          setPermission(result.state as 'granted' | 'denied' | 'prompt');
          
          result.onchange = () => {
            setPermission(result.state as 'granted' | 'denied' | 'prompt');
          };
        })
        .catch(() => {
          // Permissions API not supported, assume prompt
          setPermission('prompt');
        });
    }
  }, [isSupported]);

  return {
    location,
    isLoading,
    error,
    permission,
    isSupported,
    getCurrentLocation,
    requestLocation,
    clearLocation
  };
}

// Helper function to get user-friendly error messages
function getGeolocationErrorMessage(code: number): string {
  switch (code) {
    case GeolocationPositionError.PERMISSION_DENIED:
      return 'Location access was denied. Please enable location services.';
    case GeolocationPositionError.POSITION_UNAVAILABLE:
      return 'Location information is unavailable.';
    case GeolocationPositionError.TIMEOUT:
      return 'Location request timed out.';
    default:
      return 'An unknown error occurred while getting location.';
  }
}
