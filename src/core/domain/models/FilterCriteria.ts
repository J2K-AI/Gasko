import { FuelType } from './FuelType';

export type SortBy = 'distance' | 'price';

/** Radio máximo permitido en la búsqueda (km) */
export const MAX_RADIUS_KM = 100;

export interface FilterCriteria {
  /** Combustible principal por el que filtrar/ordenar por precio */
  fuelType: FuelType;
  /** Radio máximo en km (nunca debe superar MAX_RADIUS_KM) */
  radiusKm: number;
  /** Marcas seleccionadas (vacío = todas) */
  brands: string[];
  /** Mostrar solo las abiertas 24h */
  onlyOpen24h: boolean;
  /** Servicios requeridos */
  services: {
    hasCarWash: boolean;
    hasStore: boolean;
    hasCafe: boolean;
    hasEvCharger: boolean;
    hasAirPump: boolean;
  };
  sortBy: SortBy;
}

export const DEFAULT_FILTER_CRITERIA: FilterCriteria = {
  fuelType: FuelType.GASOLINA_95,
  radiusKm: 10,
  brands: [],
  onlyOpen24h: false,
  services: {
    hasCarWash: false,
    hasStore: false,
    hasCafe: false,
    hasEvCharger: false,
    hasAirPump: false,
  },
  sortBy: 'distance',
};
