import { GasStation } from '../models/GasStation';
import { GeoLocation } from '../models/GeoLocation';
import { FilterCriteria } from '../models/FilterCriteria';

/**
 * Puerto Secundario: contrato para obtener datos de gasolineras.
 * Puede ser implementado por:
 *  - MitecoGasStationAdapter (API del Ministerio España)
 *  - BackendGasStationAdapter (futuro backend propio)
 *  - MockGasStationAdapter (tests / offline)
 */
export interface GasStationRepository {
  /**
   * Devuelve todas las estaciones cercanas a un punto dentro del radio indicado.
   * El radio lo aplica el repositorio si tiene capacidad (backend), o se filtra
   * en el caso de uso si el adaptador devuelve un conjunto fijo (API del Ministerio).
   */
  getStationsNear(location: GeoLocation, radiusKm: number): Promise<GasStation[]>;

  /**
   * Busca gasolineras por municipio, código postal o texto libre.
   */
  searchByText(query: string, filters: FilterCriteria): Promise<GasStation[]>;

  /**
   * Obtiene los datos completos de una gasolinera por su id.
   */
  getStationById(id: string): Promise<GasStation | null>;

  /**
   * Devuelve la lista de marcas/cadenas disponibles para los filtros.
   */
  getAvailableBrands(): Promise<string[]>;
}
