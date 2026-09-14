import { GasStation } from '../../domain/models/GasStation';
import { FilterCriteria, MAX_RADIUS_KM } from '../../domain/models/FilterCriteria';
import { GeoLocation, haversineDistanceKm } from '../../domain/models/GeoLocation';
import { GasStationRepository } from '../../domain/ports/GasStationRepository';

export interface GetNearbyGasStationsInput {
  location: GeoLocation;
  filters: FilterCriteria;
}

export interface GetNearbyGasStationsOutput {
  stations: GasStation[];
}

/**
 * Caso de Uso: Obtener gasolineras cercanas con filtros aplicados.
 * Lógica de negocio pura; no depende de React ni de ningún framework.
 */
export class GetNearbyGasStationsUseCase {
  constructor(private readonly repository: GasStationRepository) {}

  async execute(input: GetNearbyGasStationsInput): Promise<GetNearbyGasStationsOutput> {
    const { location, filters } = input;

    // El radio efectivo nunca supera MAX_RADIUS_KM
    const effectiveRadius = Math.min(filters.radiusKm, MAX_RADIUS_KM);

    const raw = await this.repository.getStationsNear(location, effectiveRadius);

    const stations = raw
      // 1. Calcular distancia y filtrar por radio
      .map((s) => ({
        ...s,
        distanceKm: haversineDistanceKm(location, s.location),
      }))
      .filter((s) => s.distanceKm <= effectiveRadius)

      // 2. Filtrar por marcas
      .filter((s) =>
        filters.brands.length === 0
          ? true
          : filters.brands.some((b) => s.brand.toLowerCase().includes(b.toLowerCase()))
      )

      // 3. Solo abiertas 24h
      .filter((s) => (filters.onlyOpen24h ? s.schedule.isOpen24h : true))

      // 4. Servicios requeridos
      .filter((s) => {
        const srv = filters.services;
        return (
          (!srv.hasCarWash || s.services.hasCarWash) &&
          (!srv.hasStore || s.services.hasStore) &&
          (!srv.hasCafe || s.services.hasCafe) &&
          (!srv.hasEvCharger || s.services.hasEvCharger) &&
          (!srv.hasAirPump || s.services.hasAirPump)
        );
      })

      // 5. Ordenar
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
