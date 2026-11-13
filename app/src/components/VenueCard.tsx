import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, STORE_THEMES } from '../theme/colors';
import {
  getCatalogueResetInfo,
  getStoreHeroImage,
} from '../theme/uiAssets';
import { SpecialItem, StoreId, UserStoreLocation } from '../types/specials';

interface VenueCardProps {
  storeId: StoreId;
  items: SpecialItem[];
  userLocation: UserStoreLocation | null;
  isFavourite?: boolean;
  fullWidth?: boolean;
  onPress: (storeId: StoreId) => void;
}

export function resolveLocalStoreMeta(
  storeId: StoreId,
  userLocation: UserStoreLocation | null
): {
  displayName: string;
  badgeText: string;
  hoursText: string;
} {
  const theme = STORE_THEMES[storeId];
  if (!userLocation) {
    return {
      displayName: theme.name,
      badgeText: theme.storeType,
      hoursText: theme.defaultHours,
    };
  }

  if (storeId === 'woolworths' && userLocation.woolworthsStore) {
    const s = userLocation.woolworthsStore;
    return {
      displayName: s.name,
      badgeText:
        s.distanceKm !== null ? `${s.distanceKm.toFixed(1)} km` : userLocation.postcode,
      hoursText: s.tradingHours || (s.isOpen ? 'Open now' : theme.defaultHours),
    };
  }

  if (storeId === 'iga' && userLocation.igaStore) {
    const s = userLocation.igaStore;
    return {
      displayName: s.name,
      badgeText:
        s.distanceKm !== null ? `${s.distanceKm.toFixed(1)} km` : userLocation.postcode,
      hoursText: s.tradingHours || theme.defaultHours,
    };
  }

  if (storeId === 'aldi' && userLocation.aldiStore) {
    const s = userLocation.aldiStore;
    return {
      displayName: s.name,
      badgeText:
        s.distanceKm !== null ? `${s.distanceKm.toFixed(1)} km` : userLocation.postcode,
      hoursText:
        typeof s.isOpen === 'boolean'
          ? s.isOpen
            ? 'Open now'
            : 'Closed now'
          : theme.defaultHours,
    };
  }

  if (storeId === 'coles') {
    return {
      displayName: `Coles ${userLocation.suburb || userLocation.state}`,
      badgeText: userLocation.postcode || userLocation.state,
      hoursText: theme.defaultHours,
    };
  }

  return {
    displayName: theme.name,
    badgeText: userLocation.postcode || theme.storeType,
    hoursText: theme.defaultHours,
  };
}

export const VenueCard: React.FC<VenueCardProps> = React.memo(
  ({
    storeId,
    items,
    userLocation,
    isFavourite = false,
    fullWidth = false,
    onPress,
  }) => {
    const theme = STORE_THEMES[storeId];
    const meta = resolveLocalStoreMeta(storeId, userLocation);
    const { shortDay } = getCatalogueResetInfo();

    const specials = items.filter(
      (i) =>
        i.isOnSale ||
        i.isHalfPrice ||
        (i.saveAmount !== null && i.saveAmount > 0)
    );

    let maxOff = 0;
    let sumOff = 0;
    let offCount = 0;
    for (const it of specials) {
      const pct =
        it.discountPercent ||
        (it.wasPrice && it.wasPrice > it.price
          ? Math.round((1 - it.price / it.wasPrice) * 100)
          : 0);
      if (pct > 0) {
        if (pct > maxOff) maxOff = pct;
        sumOff += pct;
        offCount += 1;
      }
    }
    const avgOff = offCount > 0 ? Math.round(sumOff / offCount) : 0;

    return (
      <Pressable
        onPress={() => onPress(storeId)}
        style={({ pressed }) => [
          styles.card,
          fullWidth ? styles.cardFull : styles.cardCarousel,
          pressed && styles.cardPressed,
        ]}
      >
        <View style={[styles.imageWrap, fullWidth && styles.imageWrapFull]}>
          <Image
            source={getStoreHeroImage(storeId)}
            style={styles.heroImg}
            resizeMode="cover"
          />

          <View style={styles.topTags}>
            <View style={[styles.chipOverlay, styles.chipBlue]}>
              <Ionicons name="pricetag" size={12} color="#FFFFFF" />
              <Text style={[styles.chipText, { color: '#FFFFFF' }]}>
                {maxOff > 0 ? `Up to ${maxOff}% off` : 'Everyday value'}
              </Text>
            </View>
            <View style={styles.chipOverlay}>
              <Ionicons name="time-outline" size={13} color={COLORS.ink} />
              <Text style={styles.chipText}>Ends {shortDay}</Text>
            </View>
          </View>

          {isFavourite && (
            <View style={styles.favBadge}>
              <Ionicons name="heart" size={14} color={COLORS.hot} />
            </View>
          )}
        </View>

        <View style={styles.bottomRow}>
          <View style={[styles.logoBox, { backgroundColor: theme.primary }]}>
            <Text style={styles.logoText}>{theme.mono}</Text>
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.storeTitle} numberOfLines={1}>
              {meta.displayName}
            </Text>
            <Text style={styles.storeSub} numberOfLines={1}>
              {specials.length} specials · {items.length} items
              {avgOff > 0 ? ` · avg −${avgOff}%` : ''}
            </Text>
          </View>
          <View style={styles.distPill}>
            <Text style={styles.distText}>{meta.badgeText}</Text>
          </View>
        </View>
      </Pressable>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    position: 'relative',
  },
  cardCarousel: {
    width: 280,
  },
  cardFull: {
    width: '100%',
    marginBottom: 22,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  imageWrap: {
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceAlt,
    position: 'relative',
  },
  imageWrapFull: {
    height: 172,
  },
  heroImg: {
    width: '100%',
    height: '100%',
  },
  topTags: {
    position: 'absolute',
    left: 10,
    top: 10,
    flexDirection: 'row',
    gap: 6,
  },
  chipOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  chipBlue: {
    backgroundColor: COLORS.blue,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.ink,
  },
  favBadge: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  storeTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -0.3,
  },
  storeSub: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
    marginTop: 1,
  },
  distPill: {
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  distText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.ink2,
  },
});
