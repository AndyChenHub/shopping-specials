import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, STORE_THEMES, StoreCategoryType } from '../theme/colors';
import { SpecialItem, StoreId, UserStoreLocation } from '../types/specials';
import { VenueCard } from './VenueCard';

interface StoresViewProps {
  allItems: SpecialItem[];
  favStores: StoreId[];
  userLocation: UserStoreLocation | null;
  selectedFilter?: string;
  onSelectFilter?: (filter: string) => void;
  onOpenStore: (storeId: StoreId) => void;
  onOpenLocation: () => void;
}

type StoreChipFilter = 'All' | 'Favourites' | StoreCategoryType;

const STORE_FILTERS: StoreChipFilter[] = [
  'All',
  'Favourites',
  'Supermarket',
  'Discount',
  'Local',
  'Online',
];

const ALL_STORES: StoreId[] = ['woolworths', 'coles', 'aldi', 'iga', 'amazon'];

export const StoresView: React.FC<StoresViewProps> = ({
  allItems,
  favStores,
  userLocation,
  selectedFilter,
  onSelectFilter,
  onOpenStore,
  onOpenLocation,
}) => {
  const [localFilter, setLocalFilter] = useState<StoreChipFilter>('All');
  const filter: StoreChipFilter = STORE_FILTERS.includes(
    selectedFilter as StoreChipFilter
  )
    ? (selectedFilter as StoreChipFilter)
    : localFilter;
  const setFilter = (next: StoreChipFilter) => {
    setLocalFilter(next);
    onSelectFilter?.(next);
  };

  const itemsByStore = useMemo(() => {
    const map: Record<StoreId, SpecialItem[]> = {
      woolworths: [],
      coles: [],
      aldi: [],
      iga: [],
      amazon: [],
    };
    for (const item of allItems) {
      if (map[item.store]) map[item.store].push(item);
    }
    return map;
  }, [allItems]);

  const visibleStores = useMemo(() => {
    return ALL_STORES.filter((sid) => {
      if (sid === 'amazon' && filter === 'All' && itemsByStore.amazon.length === 0) {
        return false;
      }
      if (filter === 'All') return true;
      if (filter === 'Favourites') return favStores.includes(sid);
      return STORE_THEMES[sid].storeType === filter;
    });
  }, [filter, favStores, itemsByStore]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>Stores</Text>
        <Pressable
          onPress={onOpenLocation}
          style={({ pressed }) => [
            styles.locPill,
            pressed && { opacity: 0.75 },
          ]}
        >
          <Ionicons name="location" size={14} color={COLORS.blue} />
          <Text style={styles.locPillText}>
            {userLocation
              ? `${userLocation.suburb} ${userLocation.postcode}`
              : 'Set postcode'}
          </Text>
        </Pressable>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {STORE_FILTERS.map((f) => {
          const active = filter === f;
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.chip, active && styles.chipActive]}
            >
              {f === 'Favourites' && (
                <Ionicons
                  name="heart"
                  size={15}
                  color={active ? '#FFFFFF' : COLORS.hot}
                />
              )}
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {f}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Store Venue Cards */}
      <View style={styles.listPad}>
        {visibleStores.length > 0 ? (
          visibleStores.map((sid) => (
            <VenueCard
              key={sid}
              storeId={sid}
              items={itemsByStore[sid] || []}
              userLocation={userLocation}
              isFavourite={favStores.includes(sid)}
              fullWidth
              onPress={onOpenStore}
            />
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons name="heart-outline" size={38} color={COLORS.faint} />
            <Text style={styles.emptyTitle}>No favourites yet</Text>
            <Text style={styles.emptySub}>
              Open any store and tap the heart to save it here.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 170,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: -1.4,
  },
  locPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.blueSoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  locPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.blue,
  },
  chipsRow: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    gap: 8,
  },
  chip: {
    height: 38,
    paddingHorizontal: 15,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipActive: {
    backgroundColor: COLORS.ink,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink2,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  listPad: {
    paddingHorizontal: 16,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 56,
    paddingHorizontal: 28,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.ink,
    marginTop: 6,
  },
  emptySub: {
    fontSize: 14.5,
    fontWeight: '600',
    color: COLORS.muted,
    textAlign: 'center',
  },
});
