import { GasStation, GasStationSchedule, GasStationServices } from '../../../core/domain/models/GasStation';
import { FuelPrices, FuelType } from '../../../core/domain/models/FuelType';
import { GeoLocation, haversineDistanceKm } from '../../../core/domain/models/GeoLocation';
import { FilterCriteria, MAX_RADIUS_KM } from '../../../core/domain/models/FilterCriteria';
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

  /**
   * Normaliza el rótulo de la gasolinera a una marca canónica única
   * para evitar duplicados como "BP ALFAZ", "BP ROMICA", "DISA PUERTO", etc.
   */
  private normalizeBrand(rawRotulo: string): string {
    const r = (rawRotulo || '').trim().toUpperCase();
    if (!r) return 'OTROS';

    if (/\bBP\b/i.test(r)) return 'BP';
    if (/\bDISA\b/i.test(r)) return 'DISA';
    if (/\bREPSOL\b/i.test(r)) return 'REPSOL';
    if (/\bCEPSA\b/i.test(r)) return 'CEPSA';
    if (/\bMOEVE\b/i.test(r)) return 'MOEVE';
    if (/\bGALP\b/i.test(r)) return 'GALP';
    if (/\bSHELL\b/i.test(r)) return 'SHELL';
    if (/\bBALLENOIL\b/i.test(r)) return 'BALLENOIL';
    if (/\bPLENERGY\b|\bPLENOIL\b/i.test(r)) return 'PLENOIL';
    if (/\bPETROPRIX\b/i.test(r)) return 'PETROPRIX';
    if (/\bPETRONOR\b/i.test(r)) return 'PETRONOR';
    if (/\bCARREFOUR\b/i.test(r)) return 'CARREFOUR';
    if (/\bALCAMPO\b/i.test(r)) return 'ALCAMPO';
    if (/\bEROSKI\b/i.test(r)) return 'EROSKI';
    if (/\bAVIA\b/i.test(r)) return 'AVIA';
    if (/\bQ8\b/i.test(r)) return 'Q8';
    if (/\bBONAREA\b/i.test(r)) return 'BONAREA';
    if (/\bESCLATOIL\b/i.test(r)) return 'ESCLATOIL';
    if (/\bCAMPSA\b/i.test(r)) return 'CAMPSA';
    if (/\bVALCARCE\b/i.test(r)) return 'VALCARCE';
    if (/\bAGLA\b/i.test(r)) return 'AGLA';
    if (/\bENI\b/i.test(r)) return 'ENI';
    if (/\bHAM\b/i.test(r)) return 'HAM';
    if (/\bGASEXPRESS\b/i.test(r)) return 'GASEXPRESS';
    if (/\bMEROIL\b/i.test(r)) return 'MEROIL';
    if (/\bBEROIL\b/i.test(r)) return 'BEROIL';
    if (/\bTAMOIL\b/i.test(r)) return 'TAMOIL';
    if (/\bMOLGAS\b/i.test(r)) return 'MOLGAS';
    if (/\bNATURGY\b/i.test(r)) return 'NATURGY';
    if (/\bNIEVES\b/i.test(r)) return 'NIEVES';
    if (/\bAUTONETOIL\b/i.test(r)) return 'AUTONETOIL';
    if (/\bEASYGAS\b/i.test(r)) return 'EASYGAS';

    // Para estaciones independientes o marcas locales, tomar la primera palabra limpia si tiene longitud suficiente
    const firstWord = r.split(/[\s,.-]+/)[0];
    return firstWord && firstWord.length >= 3 ? firstWord : r;
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

    const brand = this.normalizeBrand(raw['Rótulo']);

    return {
      id: raw['IDEESS'],
      name: raw['Rótulo'],
      brand,
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

  async getAvailableBrands(location?: GeoLocation, radiusKm?: number): Promise<string[]> {
    const all = await this.fetchAllStations();

    // Si se proporciona ubicación, limitar las marcas al radio de búsqueda actual
    const effectiveRadius = Math.min(radiusKm ?? MAX_RADIUS_KM, MAX_RADIUS_KM);
    const candidates = location
      ? all.filter((s) => haversineDistanceKm(location, s.location) <= effectiveRadius)
      : all;

    const brandCounts = new Map<string, number>();
    candidates.forEach((s) => {
      if (s.brand) {
        brandCounts.set(s.brand, (brandCounts.get(s.brand) || 0) + 1);
      }
    });

    // Marcas principales ordenadas de mayor a menor presencia
    const majorPriority = [
      'REPSOL',
      'CEPSA',
      'MOEVE',
      'BP',
      'DISA',
      'GALP',
      'SHELL',
      'BALLENOIL',
      'PLENOIL',
      'PETROPRIX',
      'CARREFOUR',
      'ALCAMPO',
      'EROSKI',
      'AVIA',
      'Q8',
      'BONAREA',
      'ESCLATOIL',
      'CAMPSA',
      'VALCARCE',
      'AGLA',
      'BEROIL',
      'TAMOIL',
      'EASYGAS',
    ];

    const presentMajor = majorPriority.filter((b) => brandCounts.has(b));
    const others = Array.from(brandCounts.keys())
      .filter((b) => !majorPriority.includes(b) && (brandCounts.get(b) || 0) >= 1)
      .sort((a, b) => (brandCounts.get(b) || 0) - (brandCounts.get(a) || 0));

    return [...presentMajor, ...others];
  }
}

