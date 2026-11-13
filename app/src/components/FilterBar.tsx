import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, STORE_THEMES } from '../theme/colors';
import {
  DealFilter,
  SortOption,
  StoreFilter,
  StoreId,
  StoreStat,
} from '../types/specials';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onLiveWebSearch: () => void;
  liveSearching: boolean;
  selectedStore: StoreFilter;
  onStoreChange: (store: StoreFilter) => void;
  dealFilter: DealFilter;
  onDealFilterChange: (filter: DealFilter) => void;
  inStockOnly: boolean;
  onToggleInStockOnly: () => void;
  totalItemsCount: number;
  totalOnSaleCount: number;
  totalHalfPriceCount: number;
  inStockCount?: number;
  amazonCount?: number;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  categories: string[];
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  storeStats: Partial<Record<StoreId, StoreStat>> | null;
}

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'featured', label: 'Featured' },
  { key: 'price_asc', label: 'Lowest Price' },
  { key: 'discount', label: 'Biggest % Off' },
  { key: 'savings', label: 'Most $ Saved' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  onLiveWebSearch,
  liveSearching,
  selectedStore,
  onStoreChange,
  dealFilter,
  onDealFilterChange,
  inStockOnly,
  onToggleInStockOnly,
  totalItemsCount,
  totalOnSaleCount,
  totalHalfPriceCount,
  inStockCount = 0,
  amazonCount = 0,
  selectedCategory,
  onCategoryChange,
  categories,
  sortBy,
  onSortChange,
  storeStats,
}) => {
  const totalAllStores = storeStats
    ? (storeStats.woolworths?.count || 0) +
      (storeStats.coles?.count || 0) +
      (storeStats.aldi?.count || 0) +
      (storeStats.iga?.count || 0) +
      amazonCount
    : totalItemsCount;

  const storeOptions: { id: StoreFilter; label: string; count: number; color: string }[] = [
    { id: 'all', label: 'All Stores', count: totalAllStores, color: COLORS.textPrimary },
    {
      id: 'woolworths',
      label: 'Woolworths',
      count: storeStats?.woolworths?.count || 0,
      color: STORE_THEMES.woolworths.primary,
    },
    {
      id: 'coles',
      label: 'Coles',
      count: storeStats?.coles?.count || 0,
      color: STORE_THEMES.coles.primary,
    },
    {
      id: 'aldi',
      label: 'ALDI',
      count: storeStats?.aldi?.count || 0,
      color: STORE_THEMES.aldi.primary,
    },
    {
      id: 'iga',
      label: 'IGA',
      count: storeStats?.iga?.count || 0,
      color: STORE_THEMES.iga.primary,
    },
  ];

  if (amazonCount > 0 || selectedStore === 'amazon') {
    storeOptions.push({
      id: 'amazon',
      label: 'Amazon AU',
      count: amazonCount,
      color: STORE_THEMES.amazon.primary,
    });
  }

  return (
    <View style={styles.wrapper}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search any item (e.g. Nutella, milk, Tim Tam, Panadol)…"
          placeholderTextColor={COLORS.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={onLiveWebSearch}
          autoCorrect={false}
          clearButtonMode="never"
        />
        {searchQuery.trim().length > 0 && (
          <>
            <Pressable
              onPress={() => onSearchChange('')}
              hitSlop={8}
              style={styles.clearBtn}
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </Pressable>
            <Pressable
              onPress={onLiveWebSearch}
              disabled={liveSearching}
              style={({ pressed }) => [
                styles.webSearchChip,
                pressed && { opacity: 0.75 },
              ]}
            >
              {liveSearching ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="globe-outline" size={13} color="#FFFFFF" />
                  <Text style={styles.webSearchText}>Live Search</Text>
                </>
              )}
            </Pressable>
          </>
        )}
      </View>

      {/* Browse All vs Filter by Sales + Sort Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalRow}
      >
        {/* All Items */}
        <Pressable
          onPress={() => onDealFilterChange('all')}
          style={[
            styles.dealModeChip,
            dealFilter === 'all' ? styles.dealModeAllActive : styles.dealModeInactive,
          ]}
        >
          <Ionicons
            name="grid-outline"
            size={13}
            color={dealFilter === 'all' ? '#FFFFFF' : COLORS.textSecondary}
          />
          <Text
            style={[
              styles.dealModeText,
              dealFilter === 'all' && styles.dealModeTextLight,
            ]}
          >
            All Items{totalItemsCount > 0 ? ` (${totalItemsCount})` : ''}
          </Text>
        </Pressable>

        {/* On Sale */}
        <Pressable
          onPress={() =>
            onDealFilterChange(dealFilter === 'sale' ? 'all' : 'sale')
          }
          style={[
            styles.dealModeChip,
            dealFilter === 'sale' ? styles.dealModeSaleActive : styles.dealModeSaleInactive,
          ]}
        >
          <Ionicons
            name={dealFilter === 'sale' ? 'pricetag' : 'pricetag-outline'}
            size={13}
            color={dealFilter === 'sale' ? '#FFFFFF' : COLORS.savingsText}
          />
          <Text
            style={[
              styles.dealModeSaleText,
              dealFilter === 'sale' && styles.dealModeTextLight,
            ]}
          >
            On Sale{totalOnSaleCount > 0 ? ` (${totalOnSaleCount})` : ''}
          </Text>
        </Pressable>

        {/* Half Price */}
        <Pressable
          onPress={() =>
            onDealFilterChange(dealFilter === 'half_price' ? 'all' : 'half_price')
          }
          style={[
            styles.halfPriceToggle,
            dealFilter === 'half_price'
              ? styles.halfPriceToggleActive
              : styles.halfPriceToggleInactive,
          ]}
        >
          <Ionicons
            name={dealFilter === 'half_price' ? 'flash' : 'flash-outline'}
            size={14}
            color={COLORS.halfPriceText}
          />
          <Text style={styles.halfPriceToggleText}>
            ½ Price{totalHalfPriceCount > 0 ? ` (${totalHalfPriceCount})` : ''}
          </Text>
        </Pressable>

        {/* In Stock Only Toggle */}
        <Pressable
          onPress={onToggleInStockOnly}
          style={[
            styles.dealModeChip,
            inStockOnly ? styles.inStockActive : styles.inStockInactive,
          ]}
        >
          <Ionicons
            name={inStockOnly ? 'checkmark-circle' : 'checkmark-circle-outline'}
            size={14}
            color={inStockOnly ? '#FFFFFF' : COLORS.savingsText}
          />
          <Text
            style={[
              styles.inStockText,
              inStockOnly && styles.dealModeTextLight,
            ]}
          >
            In Stock{inStockCount > 0 ? ` (${inStockCount})` : ''}
          </Text>
        </Pressable>

        <View style={styles.divider} />

        {SORT_OPTIONS.map((opt) => {
          const active = sortBy === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => onSortChange(opt.key)}
              style={[styles.sortChip, active && styles.sortChipActive]}
            >
              <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Store Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalRow}
      >
        {storeOptions.map((s) => {
          const active = selectedStore === s.id;
          return (
            <Pressable
              key={s.id}
              onPress={() => onStoreChange(s.id)}
              style={[
                styles.storePill,
                active
                  ? { backgroundColor: s.color, borderColor: s.color }
                  : styles.storePillInactive,
              ]}
            >
              {s.id !== 'all' && !active && (
                <View style={[styles.storeDot, { backgroundColor: s.color }]} />
              )}
              <Text
                style={[
                  styles.storePillLabel,
                  active ? styles.storePillLabelActive : { color: COLORS.textPrimary },
                ]}
              >
                {s.label}
              </Text>
              {s.count > 0 && (
                <View
                  style={[
                    styles.countBadge,
                    active ? styles.countBadgeActive : styles.countBadgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.countBadgeText,
                      active ? { color: '#FFFFFF' } : { color: COLORS.textSecondary },
                    ]}
                  >
                    {s.count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Category Aisle Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {['All', ...categories].map((cat) => {
          const active = selectedCategory === cat;
          return (
            <Pressable
              key={cat}
              onPress={() => onCategoryChange(cat)}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
            >
              <Text
                style={[styles.categoryChipText, active && styles.categoryChipTextActive]}
              >
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
    gap: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSubtle,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 2,
  },
  webSearchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  webSearchText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  horizontalRow: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  dealModeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6.5,
    borderRadius: 999,
    borderWidth: 1,
  },
  dealModeAllActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  dealModeInactive: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  dealModeSaleActive: {
    backgroundColor: COLORS.savingsText,
    borderColor: COLORS.savingsText,
  },
  dealModeSaleInactive: {
    backgroundColor: COLORS.savingsBg,
    borderColor: '#CBEBD6',
  },
  dealModeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dealModeSaleText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.savingsText,
  },
  dealModeTextLight: {
    color: '#FFFFFF',
  },
  storePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  storePillInactive: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  storeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  storePillLabel: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  storePillLabelActive: {
    color: '#FFFFFF',
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 999,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  countBadgeInactive: {
    backgroundColor: COLORS.surfaceSubtle,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  halfPriceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6.5,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  halfPriceToggleActive: {
    backgroundColor: COLORS.halfPriceBg,
    borderColor: '#D4A800',
  },
  halfPriceToggleInactive: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F3D75B',
  },
  halfPriceToggleText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.halfPriceText,
  },
  inStockActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  inStockInactive: {
    backgroundColor: '#F0FDFA',
    borderColor: '#99F6E4',
  },
  inStockText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F766E',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
    marginHorizontal: 2,
  },
  sortChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceSubtle,
  },
  sortChipActive: {
    backgroundColor: COLORS.textPrimary,
  },
  sortChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  sortChipTextActive: {
    color: '#FFFFFF',
  },
  categoryRow: {
    paddingHorizontal: 16,
    gap: 7,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accent,
  },
  categoryChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  categoryChipTextActive: {
    color: COLORS.accent,
    fontWeight: '700',
  },
});
