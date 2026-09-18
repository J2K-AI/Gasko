import { GasStation } from '../../../core/domain/models/GasStation';
import { GeoLocation } from '../../../core/domain/models/GeoLocation';
import { FilterCriteria, MAX_RADIUS_KM } from '../../../core/domain/models/FilterCriteria';
import { GasStationRepository } from '../../../core/domain/ports/GasStationRepository';
import { MitecoGasStationAdapter } from './MitecoGasStationAdapter';
import { API_CONFIG } from '../../config/apiConfig';

/**
 * Adaptador Secundario: implementa GasStationRepository consumiendo
 * el backend de Cloudflare Workers (Gasko API).
 *
 * Cuenta con fallback transparente hacia MitecoGasStationAdapter
 * en caso de que ocurra algún error de red o timeout.
 */
export class BackendGasStationAdapter implements GasStationRepository {
  private readonly fallbackAdapter = new MitecoGasStationAdapter();

  async getStationsNear(location: GeoLocation, radiusKm: number): Promise<GasStation[]> {
    const effectiveRadius = Math.min(radiusKm ?? MAX_RADIUS_KM, MAX_RADIUS_KM);
    const url = `${API_CONFIG.BASE_URL}/api/v1/stations/nearby?lat=${location.latitude}&lng=${location.longitude}&radius=${effectiveRadius}&limit=150`;

    try {
      const response = await this.fetchWithTimeout(url);
      if (!response.ok) {
        throw new Error(`Backend HTTP ${response.status}`);
      }

      const json = await response.json() as { stations?: GasStation[] };
      if (Array.isArray(json.stations) && json.stations.length > 0) {
        return json.stations;
      }
    } catch (err) {
      console.warn('[BackendGasStationAdapter] Error al consultar backend, usando fallback MITECO:', err);
    }

    // Fallback a llamada directa al Ministerio si el backend no responde
    return this.fallbackAdapter.getStationsNear(location, effectiveRadius);
  }

  async searchByText(query: string, filters: FilterCriteria): Promise<GasStation[]> {
    const q = encodeURIComponent(query.trim());
    const url = `${API_CONFIG.BASE_URL}/api/v1/stations/search?q=${q}`;

    try {
      const response = await this.fetchWithTimeout(url);
      if (!response.ok) {
        throw new Error(`Backend HTTP ${response.status}`);
      }

      const json = await response.json() as { stations?: GasStation[] };
      if (Array.isArray(json.stations)) {
        return json.stations;
      }
    } catch (err) {
      console.warn('[BackendGasStationAdapter] Error en searchByText, usando fallback MITECO:', err);
    }

    return this.fallbackAdapter.searchByText(query, filters);
  }

  async getStationById(id: string): Promise<GasStation | null> {
    const url = `${API_CONFIG.BASE_URL}/api/v1/stations/${encodeURIComponent(id)}`;

    try {
      const response = await this.fetchWithTimeout(url);
      if (response.status === 404) return null;
      if (!response.ok) {
        throw new Error(`Backend HTTP ${response.status}`);
      }

      const json = await response.json() as GasStation;
      if (json && json.id) {
        return json;
      }
    } catch (err) {
      console.warn('[BackendGasStationAdapter] Error en getStationById, usando fallback MITECO:', err);
    }

    return this.fallbackAdapter.getStationById(id);
  }

  async getAvailableBrands(location?: GeoLocation, radiusKm?: number): Promise<string[]> {
    const effectiveRadius = Math.min(radiusKm ?? MAX_RADIUS_KM, MAX_RADIUS_KM);
    let url = `${API_CONFIG.BASE_URL}/api/v1/stations/brands?radius=${effectiveRadius}`;
    if (location) {
      url += `&lat=${location.latitude}&lng=${location.longitude}`;
    }

    try {
      const response = await this.fetchWithTimeout(url);
      if (!response.ok) {
        throw new Error(`Backend HTTP ${response.status}`);
      }

      const json = await response.json() as { brands?: string[] };
      if (Array.isArray(json.brands) && json.brands.length > 0) {
        return json.brands;
      }
    } catch (err) {
      console.warn('[BackendGasStationAdapter] Error en getAvailableBrands, usando fallback MITECO:', err);
    }

    return this.fallbackAdapter.getAvailableBrands(location, effectiveRadius);
  }

  private async fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timer);
    }
  }
}
