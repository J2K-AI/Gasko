import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GasStation } from '../../core/domain/models/GasStation';
import { FuelType, FUEL_LABELS } from '../../core/domain/models/FuelType';
import { Colors, Spacing, Radius, Typography } from '../theme';

interface StationCardProps {
  station: GasStation;
  selectedFuel: FuelType;
  isFavorite: boolean;
  onPress: () => void;
  onFavoritePress: () => void;
}

export function StationCard({
  station,
  selectedFuel,
  isFavorite,
  onPress,
  onFavoritePress,
}: StationCardProps) {
  const price = station.prices[selectedFuel];

  const openNavigation = () => {
    const { latitude, longitude } = station.location;
    const label = encodeURIComponent(station.name);
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${label}&travelmode=driving`
    );
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <View style={styles.brandIcon}>
            <Ionicons name="flame" size={18} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.name} numberOfLines={1}>
              {station.name}
            </Text>
            <Text style={styles.address} numberOfLines={1}>
              {station.address}, {station.locality}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onFavoritePress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={isFavorite ? Colors.danger : Colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Precio + Distancia + Badges */}
      <View style={styles.footer}>
        <View style={styles.priceBlock}>
          {price != null ? (
            <>
              <Text style={styles.priceValue}>{price.toFixed(3)} €</Text>
              <Text style={styles.priceLabel}>{FUEL_LABELS[selectedFuel]}</Text>
            </>
          ) : (
            <Text style={styles.noPrice}>Sin precio</Text>
          )}
        </View>

        <View style={styles.rightBlock}>
          {station.distanceKm != null && (
            <View style={styles.badge}>
              <Ionicons name="navigate" size={12} color={Colors.primary} />
              <Text style={styles.badgeText}>
                {station.distanceKm < 1
                  ? `${Math.round(station.distanceKm * 1000)} m`
                  : `${station.distanceKm.toFixed(1)} km`}
              </Text>
            </View>
          )}
          {station.schedule.isOpen24h && (
            <View style={[styles.badge, styles.openBadge]}>
              <Text style={[styles.badgeText, styles.openBadgeText]}>24h</Text>
            </View>
          )}
          <TouchableOpacity style={styles.navButton} onPress={openNavigation}>
            <Ionicons name="navigate-circle" size={32} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  name: {
    ...Typography.h3,
    fontSize: 15,
  },
  address: {
    ...Typography.caption,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceBlock: {
    flexDirection: 'column',
  },
  priceValue: {
    ...Typography.price,
  },
  priceLabel: {
    ...Typography.caption,
    marginTop: 2,
  },
  noPrice: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  rightBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    gap: 3,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  openBadge: {
    backgroundColor: '#FEF3C7',
  },
  openBadgeText: {
    color: '#D97706',
  },
  navButton: {
    marginLeft: Spacing.xs,
  },
});
