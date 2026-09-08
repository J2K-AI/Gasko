import { useState, useCallback } from 'react';
import { GeoLocation } from '../../core/domain/models/GeoLocation';
import { GeoAddress } from '../../core/domain/models/GeoLocation';
import { serviceLocator } from '../../infrastructure/config/serviceLocator';

interface UseLocationState {
  location: GeoLocation | null;
  address: GeoAddress | null;
  loading: boolean;
  error: string | null;
}

export function useLocation() {
  const [state, setState] = useState<UseLocationState>({
    location: null,
    address: null,
    loading: false,
    error: null,
  });

  const fetchCurrentLocation = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const location = await serviceLocator.locationService.getCurrentLocation();
      const address = await serviceLocator.locationService.reverseGeocode(location);
      setState({ location, address, loading: false, error: null });
      return location;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error obteniendo ubicación';
      setState((s) => ({ ...s, error: msg, loading: false }));
      return null;
    }
  }, []);

  return { ...state, fetchCurrentLocation };
}
