import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGasStations } from '../hooks/useGasStations';
import { useLocation } from '../hooks/useLocation';
import { useFavorites } from '../hooks/useFavorites';
import { StationCard } from '../components/StationCard';
import { FilterModal } from '../components/FilterModal';
import { GasStation } from '../../core/domain/models/GasStation';
import { Colors, Spacing, Radius, Typography } from '../theme';
import { serviceLocator } from '../../infrastructure/config/serviceLocator';
import { DEFAULT_FILTER_CRITERIA } from '../../core/domain/models/FilterCriteria';


export function HomeScreen() {
  const { stations, loading, error, filters, loadNearby, search, setFilters } = useGasStations();
  const { location, address, fetchCurrentLocation } = useLocation();
  const { favorites, loadFavorites, toggle, isFavorite } = useFavorites();

  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);

  // Cargar ubicación y gasolineras al montar
  useEffect(() => {
    (async () => {
      await loadFavorites();
      const loc = await fetchCurrentLocation();
      if (loc) {
        await loadNearby(loc);
        // Cargar marcas disponibles limitadas al radio actual
        const brands = await serviceLocator.stationRepository.getAvailableBrands(loc, filters.radiusKm);
        setAvailableBrands(brands);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refrescar marcas disponibles cuando cambia el radio de búsqueda
  useEffect(() => {
    if (!location) return;
    serviceLocator.stationRepository
      .getAvailableBrands(location, filters.radiusKm)
      .then(setAvailableBrands)
      .catch(() => {/* ignorar errores silenciosos */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.radiusKm, location]);


  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      if (location) await loadNearby(location);
      return;
    }
    await search(query, location ?? undefined);
  }, [query, location, loadNearby, search]);

  const handleFavoriteToggle = useCallback(
    async (station: GasStation) => {
      await toggle(station);
    },
    [toggle]
  );

  const activeFilterCount = [
    filters.brands.length > 0,
    filters.onlyOpen24h,
    Object.values(filters.services).some(Boolean),
    filters.radiusKm !== DEFAULT_FILTER_CRITERIA.radiusKm,
  ].filter(Boolean).length;


  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>⛽ Gasko</Text>
          {address?.locality && (
            <Text style={styles.locationText}>
              <Ionicons name="location" size={12} color={Colors.primary} /> {address.locality}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={() => location && loadNearby(location)} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por municipio, C.P. o marca..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); if (location) loadNearby(location); }}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options" size={20} color={activeFilterCount > 0 ? Colors.surface : Colors.primary} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Chips de acceso rápido */}
      <View style={styles.quickChips}>
        <QuickChip
          label="Cerca de mí"
          icon="navigate"
          onPress={() => location && loadNearby(location)}
        />
        <QuickChip
          label="24 horas"
          icon="time"
          active={filters.onlyOpen24h}
          onPress={() =>
            setFilters({ ...filters, onlyOpen24h: !filters.onlyOpen24h })
          }
        />
        <QuickChip
          label="Más barata"
          icon="trending-down"
          active={filters.sortBy === 'price'}
          onPress={() => setFilters({ ...filters, sortBy: filters.sortBy === 'price' ? 'distance' : 'price' })}
        />
      </View>

      {/* Resultado contador */}
      {!loading && stations.length > 0 && (
        <Text style={styles.resultCount}>{stations.length} gasolineras encontradas</Text>
      )}

      {/* Lista */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Buscando gasolineras...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline" size={48} color={Colors.textMuted} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => location && loadNearby(location)}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : stations.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="search" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No se encontraron gasolineras{'\n'}con los filtros aplicados</Text>
        </View>
      ) : (
        <FlatList
          data={stations}
          keyExtractor={(s) => s.id}
          renderItem={({ item }) => (
            <StationCard
              station={item}
              selectedFuel={filters.fuelType}
              isFavorite={isFavorite(item.id)}
              onPress={() => {}} // TODO: navegar a detalle
              onFavoritePress={() => handleFavoriteToggle(item)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal de filtros */}
      <FilterModal
        visible={showFilters}
        filters={filters}
        availableBrands={availableBrands}
        onApply={(f) => {
          setFilters(f);
          setShowFilters(false);
          if (location) loadNearby(location);
        }}
        onClose={() => setShowFilters(false)}
      />
    </SafeAreaView>
  );
}

function QuickChip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.quickChip, active && styles.quickChipActive]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={14}
        color={active ? Colors.surface : Colors.primary}
        style={{ marginRight: 4 }}
      />
      <Text style={[styles.quickChipText, active && styles.quickChipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 4,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  logo: { ...Typography.h1, fontSize: 22 },
  locationText: { ...Typography.caption, color: Colors.primary, marginTop: 2 },
  refreshBtn: {
    padding: Spacing.xs,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  searchIcon: { marginRight: Spacing.xs },
  searchInput: { flex: 1, ...Typography.body, color: Colors.textPrimary },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBtnActive: { backgroundColor: Colors.primary },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: { color: Colors.surface, fontSize: 10, fontWeight: '700' },
  quickChips: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  quickChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  quickChipText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  quickChipTextActive: { color: Colors.surface },
  resultCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  list: { paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  loadingText: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.md },
  errorText: {
    ...Typography.body,
    color: Colors.danger,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  retryBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
  },
  retryText: { ...Typography.body, color: Colors.surface, fontWeight: '600' },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
