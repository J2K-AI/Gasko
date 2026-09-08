import { GasStation, GasStationSchedule, GasStationServices } from '../../../core/domain/models/GasStation';
import { FuelPrices, FuelType } from '../../../core/domain/models/FuelType';
import { GeoLocation } from '../../../core/domain/models/GeoLocation';
import { FilterCriteria } from '../../../core/domain/models/FilterCriteria';
import { GasStationRepository } from '../../../core/domain/ports/GasStationRepository';

/**
 * Respuesta cruda de la API del Ministerio (MITECO).
 * URL base: https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/
 */
interface MitecoApiResponse {
  ResultadoConsulta: string;
  ListaEESSPrecio: MitecoStation[];
}

interface MitecoStation {
  'IDEESS': string;
  'Rótulo': string;
  'Dirección': string;
  'C.P.': string;
  'Municipio': string;
  'Provincia': string;
  'Latitud': string;
  'Longitud (WGS84)': string;
  'Horario': string;
  'Precio Gasolina 95 E5': string;
  'Precio Gasolina 98 E5': string;
  'Precio Gasóleo A': string;
  'Precio Gasóleo Premium': string;
  'Precio Gasóleo B': string;
  'Precio Gases licuados del petróleo': string;
  'Precio Gas Natural Comprimido': string;
  'Precio Gas Natural Licuado': string;
  'Precio Hidrógeno': string;
  [key: string]: string;
}

const MITECO_BASE_URL =
  'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes';

/** Cache simple en memoria (TTL: 15 minutos) */
interface Cache<T> {
  data: T;
  fetchedAt: number;
}

const CACHE_TTL_MS = 15 * 60 * 1000;

/**
 * Adaptador Secundario: implementa GasStationRepository usando la API pública del MITECO.
 * No requiere API key; proporciona precios en tiempo real de toda España.
 */
export class MitecoGasStationAdapter implements GasStationRepository {
  private cache: Cache<GasStation[]> | null = null;

  // ------------------------------------------------------------------ helpers

  private parsePrice(raw: string): number | null {
    if (!raw || raw.trim() === '') return null;
    const n = parseFloat(raw.replace(',', '.'));
    return isNaN(n) ? null : n;
  }

  private parseCoord(raw: string): number {
    return parseFloat(raw.replace(',', '.')) || 0;
  }

  private parseSchedule(raw: string): GasStationSchedule {
    const upper = raw.toUpperCase();
    const isOpen24h =
      upper.includes('24H') ||
      upper.includes('24 H') ||
      (upper.includes('00:00') && upper.includes('23:59'));
    return { raw, isOpen24h };
  }

  private parseServices(_raw: MitecoStation): GasStationServices {
    // La API del Ministerio no expone estos datos; se inicializan en false.
    // Un futuro backend propio podría enriquecerlos.
    return {
      hasCarWash: false,
      hasStore: false,
      hasCafe: false,
      hasEvCharger: false,
      hasAirPump: false,
    };
  }

  private mapStation(raw: MitecoStation): GasStation {
    const prices: FuelPrices = {
      [FuelType.GASOLINA_95]: this.parsePrice(raw['Precio Gasolina 95 E5']),
      [FuelType.GASOLINA_98]: this.parsePrice(raw['Precio Gasolina 98 E5']),
      [FuelType.GASOLEO_A]: this.parsePrice(raw['Precio Gasoleo A'] || raw['Precio Gasóleo A']),
      [FuelType.GASOLEO_A_PLUS]: this.parsePrice(raw['Precio Gasoleo Premium'] || raw['Precio Gasóleo Premium']),
      [FuelType.GASOLEO_B]: this.parsePrice(raw['Precio Gasoleo B'] || raw['Precio Gasóleo B']),
      [FuelType.GLP]: this.parsePrice(raw['Precio Gases licuados del petróleo']),
      [FuelType.GNC]: this.parsePrice(raw['Precio Gas Natural Comprimido']),
      [FuelType.GNL]: this.parsePrice(raw['Precio Gas Natural Licuado']),
      [FuelType.HIDROGENO]: this.parsePrice(raw['Precio Hidrogeno'] || raw['Precio Hidrógeno']),
    };

    return {
      id: raw['IDEESS'],
      name: raw['Rótulo'],
      brand: raw['Rótulo'],
      location: {
        latitude: this.parseCoord(raw['Latitud']),
        longitude: this.parseCoord(raw['Longitud (WGS84)']),
      } as GeoLocation,
      address: raw['Dirección'],
      postalCode: raw['C.P.'],
      locality: raw['Municipio'],
      province: raw['Provincia'],
      schedule: this.parseSchedule(raw['Horario']),
      prices,
      services: this.parseServices(raw),
    };
  }

  // ---------------------------------------------------------------- internal fetch

  private async fetchAllStations(): Promise<GasStation[]> {
    const now = Date.now();
    if (this.cache && now - this.cache.fetchedAt < CACHE_TTL_MS) {
      return this.cache.data;
    }

    const url = `${MITECO_BASE_URL}/EstacionesTerrestres/`;
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`MITECO API error: ${response.status} ${response.statusText}`);
    }

    const json: MitecoApiResponse = await response.json();
    if (json.ResultadoConsulta !== 'OK') {
      throw new Error(`MITECO API returned: ${json.ResultadoConsulta}`);
    }

    const stations = json.ListaEESSPrecio.map((s) => this.mapStation(s));
    this.cache = { data: stations, fetchedAt: now };
    return stations;
  }

  // ---------------------------------------------------------- port implementation

  async getStationsNear(location: GeoLocation, _radiusKm: number): Promise<GasStation[]> {
    // Devolvemos todas; el filtro de radio lo aplica el caso de uso con Haversine.
    return this.fetchAllStations();
  }

  async searchByText(query: string, _filters: FilterCriteria): Promise<GasStation[]> {
    const all = await this.fetchAllStations();
    const q = query.toLowerCase().trim();
    return all.filter(
      (s) =>
        s.locality.toLowerCase().includes(q) ||
        s.postalCode.includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.province.toLowerCase().includes(q) ||
        s.brand.toLowerCase().includes(q)
    );
  }

  async getStationById(id: string): Promise<GasStation | null> {
    const all = await this.fetchAllStations();
    return all.find((s) => s.id === id) ?? null;
  }

  async getAvailableBrands(): Promise<string[]> {
    const all = await this.fetchAllStations();
    const brands = [...new Set(all.map((s) => s.brand).filter(Boolean))].sort();
    return brands;
  }
}
