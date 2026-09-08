import { useState, useCallback } from 'react';
import { GeoLocation } from '../../core/domain/models/GeoLocation';
import { GasStation } from '../../core/domain/models/GasStation';
import { FilterCriteria, DEFAULT_FILTER_CRITERIA } from '../../core/domain/models/FilterCriteria';
import { serviceLocator } from '../../infrastructure/config/serviceLocator';

interface UseGasStationsState {
  stations: GasStation[];
  loading: boolean;
  error: string | null;
  filters: FilterCriteria;
}

/**
 * Hook primario: coordina los casos de uso con la UI.
 * Adaptador primario de la arquitectura hexagonal.
 */
export function useGasStations() {
  const [state, setState] = useState<UseGasStationsState>({
    stations: [],
    loading: false,
    error: null,
    filters: DEFAULT_FILTER_CRITERIA,
  });

  const loadNearby = useCallback(async (location: GeoLocation) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { stations } = await serviceLocator.getNearbyGasStations.execute({
        location,
        filters: state.filters,
      });
      setState((s) => ({ ...s, stations, loading: false }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al cargar gasolineras';
      setState((s) => ({ ...s, error: msg, loading: false }));
    }
  }, [state.filters]);

  const search = useCallback(async (query: string, location?: GeoLocation) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { stations } = await serviceLocator.searchGasStations.execute({
        query,
        currentLocation: location,
        filters: state.filters,
      });
      setState((s) => ({ ...s, stations, loading: false }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error en la búsqueda';
      setState((s) => ({ ...s, error: msg, loading: false }));
    }
  }, [state.filters]);

  const setFilters = useCallback((filters: FilterCriteria) => {
    setState((s) => ({ ...s, filters }));
  }, []);

  const updateFilter = useCallback(<K extends keyof FilterCriteria>(
    key: K,
    value: FilterCriteria[K]
  ) => {
    setState((s) => ({ ...s, filters: { ...s.filters, [key]: value } }));
  }, []);

  return {
    ...state,
    loadNearby,
    search,
    setFilters,
    updateFilter,
  };
}
