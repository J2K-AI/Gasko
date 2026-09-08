import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FilterCriteria, DEFAULT_FILTER_CRITERIA } from '../../core/domain/models/FilterCriteria';
import { FuelType, FUEL_LABELS } from '../../core/domain/models/FuelType';
import { Colors, Spacing, Radius, Typography } from '../theme';

interface FilterModalProps {
  visible: boolean;
  filters: FilterCriteria;
  availableBrands: string[];
  onApply: (filters: FilterCriteria) => void;
  onClose: () => void;
}

const RADIUS_OPTIONS = [1, 2, 5, 10, 20, 50];

export function FilterModal({
  visible,
  filters,
  availableBrands,
  onApply,
  onClose,
}: FilterModalProps) {
  const [draft, setDraft] = React.useState<FilterCriteria>(filters);

  React.useEffect(() => {
    setDraft(filters);
  }, [filters, visible]);

  const update = <K extends keyof FilterCriteria>(key: K, value: FilterCriteria[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const toggleBrand = (brand: string) => {
    setDraft((d) => ({
      ...d,
      brands: d.brands.includes(brand)
        ? d.brands.filter((b) => b !== brand)
        : [...d.brands, brand],
    }));
  };

  const toggleService = (key: keyof FilterCriteria['services']) => {
    setDraft((d) => ({
      ...d,
      services: { ...d.services, [key]: !d.services[key] },
    }));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Filtros</Text>
          <TouchableOpacity onPress={() => setDraft(DEFAULT_FILTER_CRITERIA)}>
            <Text style={styles.reset}>Restablecer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Combustible */}
          <SectionTitle>Tipo de combustible</SectionTitle>
          <View style={styles.chipRow}>
            {Object.values(FuelType).map((fuel) => (
              <TouchableOpacity
                key={fuel}
                style={[styles.chip, draft.fuelType === fuel && styles.chipActive]}
                onPress={() => update('fuelType', fuel)}
              >
                <Text style={[styles.chipText, draft.fuelType === fuel && styles.chipTextActive]}>
                  {FUEL_LABELS[fuel]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Radio */}
          <SectionTitle>Radio de búsqueda</SectionTitle>
          <View style={styles.chipRow}>
            {RADIUS_OPTIONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.chip, draft.radiusKm === r && styles.chipActive]}
                onPress={() => update('radiusKm', r)}
              >
                <Text style={[styles.chipText, draft.radiusKm === r && styles.chipTextActive]}>
                  {r} km
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Ordenar por */}
          <SectionTitle>Ordenar por</SectionTitle>
          <View style={styles.chipRow}>
            {([['distance', 'Distancia'], ['price', 'Precio']] as const).map(([val, label]) => (
              <TouchableOpacity
                key={val}
                style={[styles.chip, draft.sortBy === val && styles.chipActive]}
                onPress={() => update('sortBy', val)}
              >
                <Text style={[styles.chipText, draft.sortBy === val && styles.chipTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Solo 24h */}
          <SectionTitle>Horario</SectionTitle>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Solo abiertas 24h</Text>
            <Switch
              value={draft.onlyOpen24h}
              onValueChange={(v) => update('onlyOpen24h', v)}
              trackColor={{ true: Colors.primary }}
              thumbColor={Colors.surface}
            />
          </View>

          {/* Servicios */}
          <SectionTitle>Servicios</SectionTitle>
          {(
            [
              ['hasCarWash', 'Túnel de lavado', 'car-wash'],
              ['hasStore', 'Tienda', 'bag-handle'],
              ['hasCafe', 'Cafetería', 'cafe'],
              ['hasEvCharger', 'Carga eléctrica', 'flash'],
              ['hasAirPump', 'Inflado neumáticos', 'radio-button-on'],
            ] as [keyof FilterCriteria['services'], string, string][]
          ).map(([key, label]) => (
            <View key={key} style={styles.switchRow}>
              <Text style={styles.switchLabel}>{label}</Text>
              <Switch
                value={draft.services[key]}
                onValueChange={() => toggleService(key)}
                trackColor={{ true: Colors.primary }}
                thumbColor={Colors.surface}
              />
            </View>
          ))}

          {/* Marcas */}
          {availableBrands.length > 0 && (
            <>
              <SectionTitle>Marcas / Cadenas</SectionTitle>
              <View style={styles.chipRow}>
                {availableBrands.slice(0, 20).map((brand) => (
                  <TouchableOpacity
                    key={brand}
                    style={[styles.chip, draft.brands.includes(brand) && styles.chipActive]}
                    onPress={() => toggleBrand(brand)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        draft.brands.includes(brand) && styles.chipTextActive,
                      ]}
                    >
                      {brand}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>

        {/* Aplicar */}
        <View style={styles.applyContainer}>
          <TouchableOpacity style={styles.applyButton} onPress={() => onApply(draft)}>
            <Text style={styles.applyText}>Aplicar filtros</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  title: Typography.h2,
  reset: { ...Typography.body, color: Colors.primary, fontWeight: '600' },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl },
  sectionTitle: {
    ...Typography.h3,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  chipText: { ...Typography.caption, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  switchLabel: Typography.body,
  applyContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  applyText: { ...Typography.h3, color: Colors.surface },
});
