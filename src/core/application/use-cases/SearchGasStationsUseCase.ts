import { GasStation } from '../../domain/models/GasStation';
import { FilterCriteria, MAX_RADIUS_KM } from '../../domain/models/FilterCriteria';
import { GasStationRepository } from '../../domain/ports/GasStationRepository';
import { haversineDistanceKm } from '../../domain/models/GeoLocation';
import { GeoLocation } from '../../domain/models/GeoLocation';

export interface SearchGasStationsInput {
  query: string;
  currentLocation?: GeoLocation;
  filters: FilterCriteria;
}

export interface SearchGasStationsOutput {
  stations: GasStation[];
}

/**
 * Caso de Uso: Buscar gasolineras por texto (localidad, CP, dirección).
 */
export class SearchGasStationsUseCase {
  constructor(private readonly repository: GasStationRepository) {}

  async execute(input: SearchGasStationsInput): Promise<SearchGasStationsOutput> {
    const { query, currentLocation, filters } = input;

    // El radio efectivo nunca supera MAX_RADIUS_KM
    const effectiveRadius = Math.min(filters.radiusKm, MAX_RADIUS_KM);

    const raw = await this.repository.searchByText(query, filters);

    const stations = raw
      .map((s) => ({
        ...s,
        distanceKm: currentLocation
          ? haversineDistanceKm(currentLocation, s.location)
          : undefined,
      }))
      // Filtrar por radio si hay ubicación disponible
      .filter((s) =>
        currentLocation && s.distanceKm !== undefined
          ? s.distanceKm <= effectiveRadius
          : true
      )
      .filter((s) =>
        filters.brands.length === 0
          ? true
          : filters.brands.some((b) => s.brand.toLowerCase().includes(b.toLowerCase()))
      )
      .filter((s) => (filters.onlyOpen24h ? s.schedule.isOpen24h : true))
      .sort((a, b) => {
        if (filters.sortBy === 'price') {
          const pa = a.prices[filters.fuelType] ?? Infinity;
          const pb = b.prices[filters.fuelType] ?? Infinity;
          return (pa as number) - (pb as number);
        }
        return (a.distanceKm ?? 0) - (b.distanceKm ?? 0);
      });

    return { stations };
  }
}
