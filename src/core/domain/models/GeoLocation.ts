export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface GeoAddress {
  street?: string;
  locality?: string;
  postalCode?: string;
  region?: string;
  country?: string;
  formatted?: string;
}

/** Fórmula de Haversine: distancia en kilómetros entre dos puntos */
export function haversineDistanceKm(a: GeoLocation, b: GeoLocation): number {
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const c =
    sinDLat * sinDLat +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinDLon * sinDLon;
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
