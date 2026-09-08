import AsyncStorage from '@react-native-async-storage/async-storage';
import { GasStation } from '../../../core/domain/models/GasStation';
import { FavoritesRepository } from '../../../core/domain/ports/FavoritesRepository';

const STORAGE_KEY = '@gasko/favorites';

/**
 * Adaptador Secundario: persistencia local de favoritas mediante AsyncStorage.
 * Reemplazable por un adaptador que sincronice con un backend sin cambios en el dominio.
 */
export class AsyncStorageFavoritesAdapter implements FavoritesRepository {
  private async load(): Promise<GasStation[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as GasStation[];
    } catch {
      return [];
    }
  }

  private async save(stations: GasStation[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stations));
  }

  async getFavorites(): Promise<GasStation[]> {
    return this.load();
  }

  async isFavorite(stationId: string): Promise<boolean> {
    const list = await this.load();
    return list.some((s) => s.id === stationId);
  }

  async addFavorite(station: GasStation): Promise<void> {
    const list = await this.load();
    if (!list.some((s) => s.id === station.id)) {
      await this.save([...list, station]);
    }
  }

  async removeFavorite(stationId: string): Promise<void> {
    const list = await this.load();
    await this.save(list.filter((s) => s.id !== stationId));
  }

  async toggleFavorite(station: GasStation): Promise<boolean> {
    const isFav = await this.isFavorite(station.id);
    if (isFav) {
      await this.removeFavorite(station.id);
      return false;
    } else {
      await this.addFavorite(station);
      return true;
    }
  }
}
