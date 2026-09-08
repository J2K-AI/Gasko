import { GasStation } from '../../domain/models/GasStation';
import { FavoritesRepository } from '../../domain/ports/FavoritesRepository';

export class ToggleFavoriteStationUseCase {
  constructor(private readonly favorites: FavoritesRepository) {}

  /** Alterna el estado favorito y devuelve el nuevo estado (true = ahora es favorita) */
  async execute(station: GasStation): Promise<boolean> {
    return this.favorites.toggleFavorite(station);
  }
}

export class GetFavoriteStationsUseCase {
  constructor(private readonly favorites: FavoritesRepository) {}

  async execute(): Promise<GasStation[]> {
    return this.favorites.getFavorites();
  }
}

export class CheckIsFavoriteUseCase {
  constructor(private readonly favorites: FavoritesRepository) {}

  async execute(stationId: string): Promise<boolean> {
    return this.favorites.isFavorite(stationId);
  }
}
