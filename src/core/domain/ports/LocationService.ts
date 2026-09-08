import { GeoLocation, GeoAddress } from '../models/GeoLocation';

/**
 * Puerto Secundario: servicio de geolocalización del dispositivo.
 * Implementado por ExpoLocationAdapter o cualquier otro proveedor.
 */
export interface LocationService {
  /** Solicita permisos y obtiene la posición GPS actual */
  getCurrentLocation(): Promise<GeoLocation>;

  /** Convierte coordenadas en una dirección legible (reverse geocoding) */
  reverseGeocode(location: GeoLocation): Promise<GeoAddress>;

  /** Convierte una dirección/texto en coordenadas */
  geocode(address: string): Promise<GeoLocation | null>;
}
