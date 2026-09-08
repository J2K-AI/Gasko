import * as ExpoLocation from 'expo-location';
import { GeoLocation, GeoAddress } from '../../../core/domain/models/GeoLocation';
import { LocationService } from '../../../core/domain/ports/LocationService';

/**
 * Adaptador Secundario: implementa LocationService usando expo-location.
 * Sustituible por otro proveedor (navigator.geolocation web, etc.) sin cambios en el dominio.
 */
export class ExpoLocationAdapter implements LocationService {
  async getCurrentLocation(): Promise<GeoLocation> {
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permiso de ubicación denegado');
    }

    const position = await ExpoLocation.getCurrentPositionAsync({
      accuracy: ExpoLocation.Accuracy.Balanced,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  }

  async reverseGeocode(location: GeoLocation): Promise<GeoAddress> {
    const [result] = await ExpoLocation.reverseGeocodeAsync({
      latitude: location.latitude,
      longitude: location.longitude,
    });

    if (!result) return {};

    return {
      street: result.street ?? undefined,
      locality: result.city ?? undefined,
      postalCode: result.postalCode ?? undefined,
      region: result.region ?? undefined,
      country: result.country ?? undefined,
      formatted: [result.street, result.city, result.region].filter(Boolean).join(', '),
    };
  }

  async geocode(address: string): Promise<GeoLocation | null> {
    const results = await ExpoLocation.geocodeAsync(address);
    if (!results.length) return null;
    return {
      latitude: results[0].latitude,
      longitude: results[0].longitude,
    };
  }
}
