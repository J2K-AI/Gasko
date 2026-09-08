import { GasStation } from '../models/GasStation';

/**
 * Puerto Secundario: persistencia local de gasolineras favoritas.
 * Implementado por AsyncStorageFavoritesAdapter o, en el futuro,
 * por un adaptador que sincronice con el backend.
 */
export interface FavoritesRepository {
  getFavorites(): Promise<GasStation[]>;
  isFavorite(stationId: string): Promise<boolean>;
  addFavorite(station: GasStation): Promise<void>;
  removeFavorite(stationId: string): Promise<void>;
  toggleFavorite(station: GasStation): Promise<boolean>;
}
