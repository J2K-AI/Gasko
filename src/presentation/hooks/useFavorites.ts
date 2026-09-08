import { useState, useCallback } from 'react';
import { GasStation } from '../../core/domain/models/GasStation';
import { serviceLocator } from '../../infrastructure/config/serviceLocator';

export function useFavorites() {
  const [favorites, setFavorites] = useState<GasStation[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    const list = await serviceLocator.getFavorites.execute();
    setFavorites(list);
    setLoading(false);
  }, []);

  const toggle = useCallback(async (station: GasStation): Promise<boolean> => {
    const isNowFavorite = await serviceLocator.toggleFavorite.execute(station);
    await loadFavorites();
    return isNowFavorite;
  }, [loadFavorites]);

  const isFavorite = useCallback(
    (stationId: string) => favorites.some((s) => s.id === stationId),
    [favorites]
  );

  return { favorites, loading, loadFavorites, toggle, isFavorite };
}
