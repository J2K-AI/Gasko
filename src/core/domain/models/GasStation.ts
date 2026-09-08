import { GeoLocation } from './GeoLocation';
import { FuelPrices } from './FuelType';

export interface GasStationSchedule {
  /** Horario en texto libre (ej: "L-D: 07:00-22:00") */
  raw: string;
  isOpen24h: boolean;
}

export interface GasStation {
  id: string;
  name: string;
  brand: string;
  location: GeoLocation;
  address: string;
  postalCode: string;
  locality: string;
  province: string;
  schedule: GasStationSchedule;
  prices: FuelPrices;
  services: GasStationServices;
  /** Distancia en km desde el punto de referencia (se asigna fuera del dominio) */
  distanceKm?: number;
}

export interface GasStationServices {
  hasCarWash: boolean;
  hasStore: boolean;
  hasCafe: boolean;
  hasEvCharger: boolean;
  hasAirPump: boolean;
}
