import { MitecoGasStationAdapter } from '../adapters/api/MitecoGasStationAdapter';
import { ExpoLocationAdapter } from '../adapters/location/ExpoLocationAdapter';
import { AsyncStorageFavoritesAdapter } from '../adapters/storage/AsyncStorageFavoritesAdapter';
import { GetNearbyGasStationsUseCase } from '../../core/application/use-cases/GetNearbyGasStationsUseCase';
import { SearchGasStationsUseCase } from '../../core/application/use-cases/SearchGasStationsUseCase';
import {
  ToggleFavoriteStationUseCase,
  GetFavoriteStationsUseCase,
  CheckIsFavoriteUseCase,
} from '../../core/application/use-cases/FavoriteStationsUseCases';

/**
 * Contenedor de Inyección de Dependencias (Service Locator).
 *
 * Para cambiar al futuro backend propio basta con sustituir:
 *   new MitecoGasStationAdapter()
 * por:
 *   new BackendGasStationAdapter(process.env.BACKEND_URL)
 *
 * Sin tocar ni un solo caso de uso ni componente de UI.
 */

const stationRepository = new MitecoGasStationAdapter();
const locationService = new ExpoLocationAdapter();
const favoritesRepository = new AsyncStorageFavoritesAdapter();

export const serviceLocator = {
  // Repositorios / Servicios (para acceso directo si es necesario)
  stationRepository,
  locationService,
  favoritesRepository,

  // Casos de Uso listos para inyectar en hooks/presentación
  getNearbyGasStations: new GetNearbyGasStationsUseCase(stationRepository),
  searchGasStations: new SearchGasStationsUseCase(stationRepository),
  toggleFavorite: new ToggleFavoriteStationUseCase(favoritesRepository),
  getFavorites: new GetFavoriteStationsUseCase(favoritesRepository),
  checkIsFavorite: new CheckIsFavoriteUseCase(favoritesRepository),
} as const;
