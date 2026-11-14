import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, STORE_THEMES } from '../theme/colors';
import { DISCOVER_CATEGORIES } from '../theme/uiAssets';
import {
  getSubCategoriesForAisle,
  getSubCategoryDef,
  isSpecialItemHalfPrice,
  isSpecialItemOnSale,
  isSpecialItemRegularPrice,
  POPULAR_SUBCATEGORY_FILTERS,
} from '../services/normalizeClient';
import {
  DealFilter,
  SortOption,
  SpecialItem,
  StoreFilter,
  StoreId,
} from '../types/specials';
import { SpecialCard } from './SpecialCard';
import { SavingsRow } from './SavingsRow';

interface SearchViewProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSubmitSearch: (q: string) => void;
  liveSearching: boolean;
  allItems: SpecialItem[];
  filteredItems: SpecialItem[];
  qtyMap: Record<string, number>;
  recentSearches: string[];
  selectedStore: StoreFilter;
  onStoreChange: (s: StoreFilter) => void;
  dealFilter: DealFilter;
  onDealFilterChange: (d: DealFilter) => void;
  inStockOnly: boolean;
  onToggleInStockOnly: () => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedSubCategory: string;
  onSubCategoryChange: (sub: string) => void;
  loadingMoreRange?: boolean;
  onLoadMoreRange?: () => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  counts: {
    totalItemsCount: number;
    regularItemsCount: number;
    totalOnSaleCount: number;
    totalHalfPriceCount: number;
    inStockCount: number;
    amazonCount: number;
    aisleCounts?: Record<string, number>;
    subCategoryCounts?: Record<string, number>;
  };
  onSelectProduct: (item: SpecialItem) => void;
  onIncrementItem: (item: SpecialItem) => void;
  onDecrementItem: (item: SpecialItem) => void;
}

const SORT_CHIPS: { key: SortOption; label: string }[] = [
  { key: 'featured', label: 'Featured' },
  { key: 'savings', label: 'Biggest saving' },
  { key: 'discount', label: 'Highest % off' },
  { key: 'price_asc', label: 'Lowest price' },
];

const STORE_PILLS: { id: StoreFilter; label: string }[] = [
  { id: 'all', label: 'All stores' },
  { id: 'woolworths', label: 'Woolworths' },
  { id: 'coles', label: 'Coles' },
  { id: 'aldi', label: 'ALDI' },
  { id: 'iga', label: 'IGA' },
  { id: 'amazon', label: 'Amazon AU' },
];

export const SearchView: React.FC<SearchViewProps> = ({
  searchQuery,
  onSearchChange,
  onSubmitSearch,
  liveSearching,
  allItems,
  filteredItems,
  qtyMap,
  recentSearches,
  selectedStore,
  onStoreChange,
  dealFilter,
  onDealFilterChange,
  inStockOnly,
  onToggleInStockOnly,
  selectedCategory,
  onCategoryChange,
  selectedSubCategory,
  onSubCategoryChange,
  loadingMoreRange = false,
  onLoadMoreRange,
  sortBy,
  onSortChange,
  counts,
  onSelectProduct,
  onIncrementItem,
  onDecrementItem,
}) => {
  const { width } = useWindowDimensions();
  const numColumns = width >= 1100 ? 4 : width >= 740 ? 3 : 2;
  const [focused, setFocused] = useState(false);

  const hasActiveSearchOrCat =
    searchQuery.trim().length > 0 ||
    selectedCategory !== 'All' ||
    selectedSubCategory !== 'All';

  const hasPersistedSubFilters =
    selectedStore !== 'all' || dealFilter !== 'all' || inStockOnly;

  const trendingItems = useMemo(() => {
    return [...allItems]
      .filter((i) => isSpecialItemOnSale(i))
      .sort((a, b) => (b.saveAmount || 0) - (a.saveAmount || 0))
      .slice(0, 5);
  }, [allItems]);

  const catCounts = useMemo(() => {
    if (counts.aisleCounts) return counts.aisleCounts;
    const map: Record<string, number> = {};
    for (const i of allItems) {
      if (selectedStore !== 'all' && i.store !== selectedStore) continue;
      if (dealFilter === 'half_price' && !isSpecialItemHalfPrice(i)) continue;
      if (dealFilter === 'sale' && !isSpecialItemOnSale(i)) continue;
      if (dealFilter === 'regular' && !isSpecialItemRegularPrice(i)) continue;
      if (inStockOnly && i.inStock !== true) continue;
      map[i.category] = (map[i.category] || 0) + 1;
    }
    return map;
  }, [allItems, counts.aisleCounts, selectedStore, dealFilter, inStockOnly]);

  const aisleChipOptions = useMemo(() => {
    const baseIds = DISCOVER_CATEGORIES.map((c) => c.id);
    if (
      (counts.aisleCounts?.['Other'] || 0) > 0 ||
      selectedCategory === 'Other'
    ) {
      baseIds.push('Other');
    }
    return ['All', ...baseIds];
  }, [counts.aisleCounts, selectedCategory]);

  const subCategoryOptions = useMemo(
    () => getSubCategoriesForAisle(selectedCategory),
    [selectedCategory]
  );

  const activeSubLabel = useMemo(() => {
    if (selectedSubCategory === 'All') return '';
    return (
      getSubCategoryDef(selectedSubCategory)?.shortLabel || selectedSubCategory
    );
  }, [selectedSubCategory]);

  const categoryPairs = useMemo(() => {
    const pairs: Array<typeof DISCOVER_CATEGORIES> = [];
    for (let i = 0; i < DISCOVER_CATEGORIES.length; i += 2) {
      pairs.push(DISCOVER_CATEGORIES.slice(i, i + 2));
    }
    return pairs;
  }, []);

  return (
    <View style={styles.root}>
      {/* Sticky Header + Search Field */}
      <View style={styles.headerBlock}>
        <Text style={styles.pageTitle}>Search</Text>
        <View
          style={[
            styles.searchField,
            focused && styles.searchFieldFocused,
          ]}
        >
          <Ionicons name="search" size={20} color={COLORS.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={onSearchChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={() => onSubmitSearch(searchQuery)}
            placeholder="Search all supermarket items (snacks, meat, lollies, milk…)"
            placeholderTextColor={COLORS.muted}
            style={styles.input}
            returnKeyType="search"
            autoCorrect={false}
          />
          {liveSearching && (
            <ActivityIndicator size="small" color={COLORS.blue} />
          )}
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => onSearchChange('')}
              hitSlop={8}
              style={styles.clearCircle}
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close" size={13} color="#FFFFFF" />
            </Pressable>
          )}
        </View>
      </View>

      {!hasActiveSearchOrCat ? (
        <ScrollView
          contentContainerStyle={styles.discoveryScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.sec}>
              <Text style={styles.secHeading}>Recent</Text>
              <View style={styles.recentWrap}>
                {recentSearches.map((term) => (
                  <Pressable
                    key={term}
                    onPress={() => {
                      onSearchChange(term);
                      onSubmitSearch(term);
                    }}
                    style={({ pressed }) => [
                      styles.recentChip,
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <Ionicons
                      name="time-outline"
                      size={15}
                      color={COLORS.muted}
                    />
                    <Text style={styles.recentChipText}>{term}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Quick Product Type Filters (Snacks, Meat, Chocolate, Lollies, Fruit, etc.) */}
          <View style={styles.sec}>
            <Text style={styles.secHeading}>Browse by type</Text>
            <View style={styles.quickTypeWrap}>
              {POPULAR_SUBCATEGORY_FILTERS.map((sub) => {
                const subCount = counts.subCategoryCounts?.[sub.id] ?? 0;
                return (
                  <Pressable
                    key={sub.id}
                    onPress={() => onSubCategoryChange(sub.id)}
                    style={({ pressed }) => [
                      styles.quickTypeChip,
                      pressed && { opacity: 0.78, transform: [{ scale: 0.97 }] },
                    ]}
                  >
                    <Text style={styles.quickTypeText}>{sub.shortLabel}</Text>
                    {subCount > 0 && (
                      <Text style={styles.quickTypeCount}>{subCount}</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Trending This Week */}
          {trendingItems.length > 0 && (
            <View style={styles.sec}>
              <Text style={styles.secHeading}>Trending this week</Text>
              <View style={styles.trendingList}>
                {trendingItems.map((it, idx) => (
                  <SavingsRow
                    key={it.id}
                    item={it}
                    rank={idx + 1}
                    isLast={idx === trendingItems.length - 1}
                    onPress={onSelectProduct}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Colorful Browse Category Tiles */}
          <View style={styles.sec}>
            <View style={styles.secHeaderRow}>
              <Text style={[styles.secHeading, { marginBottom: 0 }]}>
                Browse aisles
              </Text>
              {hasPersistedSubFilters && (
                <Pressable
                  onPress={() => {
                    onStoreChange('all');
                    onDealFilterChange('all');
                    if (inStockOnly) onToggleInStockOnly();
                  }}
                  hitSlop={8}
                >
                  <Text style={styles.clearCatText}>Reset active filters</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.tilesGrid}>
              {categoryPairs.map((pair, pIdx) => (
                <View key={`pair-${pIdx}`} style={styles.tileRow}>
                  {pair.map((cat) => (
                    <Pressable
                      key={cat.id}
                      onPress={() => onCategoryChange(cat.id)}
                      style={({ pressed }) => [
                        styles.tile,
                        { backgroundColor: cat.bg },
                        pressed && { transform: [{ scale: 0.97 }] },
                      ]}
                    >
                      <Text
                        style={[styles.tileTitle, { color: cat.fg }]}
                        numberOfLines={2}
                      >
                        {cat.shortLabel}
                      </Text>
                      <Text style={[styles.tileCount, { color: cat.fg }]}>
                        {catCounts[cat.id] || 0} items
                      </Text>
                      <Image
                        source={cat.image}
                        style={styles.tileCornerImg}
                        resizeMode="cover"
                      />
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          key={`search-grid-${numColumns}`}
          data={filteredItems}
          numColumns={numColumns}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.resultsContent}
          columnWrapperStyle={styles.gridRow}
          ListHeaderComponent={
            <View style={styles.filtersWrap}>
              {(selectedCategory !== 'All' ||
                selectedSubCategory !== 'All') && (
                <View style={styles.activeCatBanner}>
                  <Text style={styles.activeCatText} numberOfLines={1}>
                    {selectedCategory !== 'All' && selectedSubCategory !== 'All'
                      ? `${selectedCategory} · ${activeSubLabel}`
                      : selectedSubCategory !== 'All'
                      ? `Type: ${activeSubLabel}`
                      : `Aisle: ${selectedCategory}`}
                  </Text>
                  <Pressable
                    onPress={() => {
                      onCategoryChange('All');
                      onSubCategoryChange('All');
                    }}
                  >
                    <Text style={styles.clearCatText}>Clear</Text>
                  </Pressable>
                </View>
              )}

              {/* Aisle Quick-Switch Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScroll}
              >
                {aisleChipOptions.map((aisle) => {
                  const active = selectedCategory === aisle;
                  const cCount =
                    aisle === 'All'
                      ? undefined
                      : counts.aisleCounts?.[aisle] ?? 0;
                  if (
                    aisle !== 'All' &&
                    !active &&
                    searchQuery.trim().length > 0 &&
                    cCount === 0
                  ) {
                    return null;
                  }
                  return (
                    <Pressable
                      key={aisle}
                      onPress={() =>
                        onCategoryChange(
                          active && aisle !== 'All' ? 'All' : aisle
                        )
                      }
                      style={[styles.chip, active && styles.chipBlue]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {aisle === 'All'
                          ? 'All aisles'
                          : cCount !== undefined
                          ? `${aisle} (${cCount})`
                          : aisle}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Subcategory / Product Type Chips */}
              {subCategoryOptions.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsScroll}
                >
                  <Pressable
                    onPress={() => onSubCategoryChange('All')}
                    style={[
                      styles.subChip,
                      selectedSubCategory === 'All' && styles.subChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.subChipText,
                        selectedSubCategory === 'All' &&
                          styles.subChipTextActive,
                      ]}
                    >
                      All types
                    </Text>
                  </Pressable>

                  {subCategoryOptions.map((sub) => {
                    const active = selectedSubCategory === sub.id;
                    const sCount = counts.subCategoryCounts?.[sub.id] ?? 0;
                    if (
                      !active &&
                      searchQuery.trim().length > 0 &&
                      sCount === 0
                    ) {
                      return null;
                    }
                    return (
                      <Pressable
                        key={sub.id}
                        onPress={() =>
                          onSubCategoryChange(active ? 'All' : sub.id)
                        }
                        style={[
                          styles.subChip,
                          active && styles.subChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.subChipText,
                            active && styles.subChipTextActive,
                          ]}
                        >
                          {sCount > 0 || searchQuery.trim().length > 0
                            ? `${sub.shortLabel} (${sCount})`
                            : sub.shortLabel}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}

              {/* Deal & Stock Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScroll}
              >
                <Pressable
                  onPress={() => onDealFilterChange('all')}
                  style={[
                    styles.chip,
                    dealFilter === 'all' && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      dealFilter === 'all' && styles.chipTextActive,
                    ]}
                  >
                    All items ({counts.totalItemsCount})
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    onDealFilterChange(dealFilter === 'sale' ? 'all' : 'sale')
                  }
                  style={[
                    styles.chip,
                    dealFilter === 'sale' && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      dealFilter === 'sale' && styles.chipTextActive,
                    ]}
                  >
                    On sale ({counts.totalOnSaleCount})
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    onDealFilterChange(
                      dealFilter === 'half_price' ? 'all' : 'half_price'
                    )
                  }
                  style={[
                    styles.chip,
                    dealFilter === 'half_price' && {
                      backgroundColor: COLORS.yellow,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      dealFilter === 'half_price' && {
                        color: COLORS.ink,
                        fontWeight: '900',
                      },
                    ]}
                  >
                    ½ price ({counts.totalHalfPriceCount})
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    onDealFilterChange(
                      dealFilter === 'regular' ? 'all' : 'regular'
                    )
                  }
                  style={[
                    styles.chip,
                    dealFilter === 'regular' && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      dealFilter === 'regular' && styles.chipTextActive,
                    ]}
                  >
                    Regular price ({counts.regularItemsCount})
                  </Text>
                </Pressable>

                <Pressable
                  onPress={onToggleInStockOnly}
                  style={[
                    styles.chip,
                    inStockOnly && { backgroundColor: COLORS.green },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={inStockOnly ? '#FFFFFF' : COLORS.green}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      inStockOnly && styles.chipTextActive,
                    ]}
                  >
                    In stock ({counts.inStockCount})
                  </Text>
                </Pressable>
              </ScrollView>

              {/* Store + Sort Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScroll}
              >
                {STORE_PILLS.map((sp) => {
                  if (
                    sp.id === 'amazon' &&
                    counts.amazonCount === 0 &&
                    selectedStore !== 'amazon'
                  ) {
                    return null;
                  }
                  const active = selectedStore === sp.id;
                  const storeColor =
                    sp.id === 'all'
                      ? COLORS.ink
                      : STORE_THEMES[sp.id as StoreId].primary;
                  return (
                    <Pressable
                      key={sp.id}
                      onPress={() => onStoreChange(sp.id)}
                      style={[
                        styles.chip,
                        active && { backgroundColor: storeColor },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {sp.label}
                      </Text>
                    </Pressable>
                  );
                })}

                <View style={styles.divider} />

                {SORT_CHIPS.map((s) => {
                  const active = sortBy === s.key;
                  return (
                    <Pressable
                      key={s.key}
                      onPress={() => onSortChange(s.key)}
                      style={[styles.chip, active && styles.chipBlue]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {s.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {(liveSearching || loadingMoreRange) && (
                <Text style={styles.searchingHint}>
                  {liveSearching
                    ? 'Searching live range across Woolworths, Coles, ALDI, IGA & Amazon AU…'
                    : 'Loading more supermarket items from Woolworths, Coles, ALDI & IGA…'}
                </Text>
              )}
            </View>
          }
          ListFooterComponent={
            filteredItems.length > 0 && onLoadMoreRange ? (
              <View style={styles.footerMoreWrap}>
                <Text style={styles.footerCountText}>
                  Showing {filteredItems.length} items
                </Text>
                <Pressable
                  onPress={onLoadMoreRange}
                  disabled={loadingMoreRange}
                  style={({ pressed }) => [
                    styles.loadMoreBtn,
                    pressed && { opacity: 0.85 },
                    loadingMoreRange && { opacity: 0.7 },
                  ]}
                >
                  {loadingMoreRange ? (
                    <ActivityIndicator size="small" color={COLORS.blue} />
                  ) : (
                    <Ionicons
                      name="add-circle-outline"
                      size={17}
                      color={COLORS.blue}
                    />
                  )}
                  <Text style={styles.loadMoreBtnText}>
                    {loadingMoreRange
                      ? 'Loading more from supermarkets…'
                      : 'Load more from supermarkets'}
                  </Text>
                </Pressable>
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>
                {liveSearching || loadingMoreRange
                  ? 'Fetching items from supermarkets…'
                  : `No items for "${
                      searchQuery ||
                      activeSubLabel ||
                      selectedCategory
                    }"`}
              </Text>
              <Text style={styles.emptySub}>
                Try loading more range from supermarkets or clearing an active filter.
              </Text>
              <View style={styles.emptyActionsRow}>
                {onLoadMoreRange && (
                  <Pressable
                    onPress={onLoadMoreRange}
                    disabled={loadingMoreRange}
                    style={styles.loadMoreBtn}
                  >
                    {loadingMoreRange && (
                      <ActivityIndicator size="small" color={COLORS.blue} />
                    )}
                    <Text style={styles.loadMoreBtnText}>
                      {loadingMoreRange
                        ? 'Loading…'
                        : 'Load from supermarkets'}
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => {
                    onStoreChange('all');
                    onDealFilterChange('all');
                    if (inStockOnly) onToggleInStockOnly();
                    onCategoryChange('All');
                    onSubCategoryChange('All');
                  }}
                  style={styles.resetBtn}
                >
                  <Text style={styles.resetBtnText}>Reset filters</Text>
                </Pressable>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.cardCell}>
              <SpecialCard
                item={item}
                quantity={qtyMap[item.id] || 0}
                onPress={onSelectProduct}
                onIncrement={onIncrementItem}
                onDecrement={onDecrementItem}
              />
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerBlock: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: -1.4,
    marginBottom: 12,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  searchFieldFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: COLORS.blue,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.ink,
    paddingVertical: 0,
  },
  clearCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D7D8DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoveryScroll: {
    paddingBottom: 175,
  },
  sec: {
    marginTop: 18,
  },
  secHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
    marginBottom: 10,
  },
  secHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: -0.4,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  recentWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
  },
  recentChip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink2,
  },
  quickTypeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
  },
  quickTypeChip: {
    height: 36,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: COLORS.blueSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickTypeText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.blueDark,
  },
  quickTypeCount: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.blue,
    opacity: 0.85,
  },
  trendingList: {
    paddingHorizontal: 16,
  },
  tilesGrid: {
    paddingHorizontal: 16,
    gap: 10,
  },
  tileRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    flex: 1,
    height: 94,
    borderRadius: 18,
    padding: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  tileTitle: {
    fontSize: 16,
    fontWeight: '800',
    maxWidth: '64%',
    lineHeight: 19,
    letterSpacing: -0.3,
  },
  tileCount: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.72,
    marginTop: 4,
  },
  tileCornerImg: {
    position: 'absolute',
    right: -18,
    bottom: -22,
    width: 102,
    height: 102,
    borderRadius: 51,
    transform: [{ rotate: '-8deg' }],
  },
  resultsContent: {
    paddingBottom: 175,
  },
  filtersWrap: {
    gap: 8,
    marginBottom: 14,
  },
  activeCatBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.blueSoft,
  },
  activeCatText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.blueDark,
  },
  clearCatText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.blue,
  },
  chipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  chipActive: {
    backgroundColor: COLORS.ink,
  },
  chipBlue: {
    backgroundColor: COLORS.blue,
  },
  chipText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.ink2,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  subChip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  subChipActive: {
    backgroundColor: COLORS.blueDark,
  },
  subChipText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.blueDark,
  },
  subChipTextActive: {
    color: '#FFFFFF',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.line,
    marginHorizontal: 2,
  },
  searchingHint: {
    paddingHorizontal: 16,
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.blue,
  },
  gridRow: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 18,
  },
  cardCell: {
    flex: 1,
  },
  footerMoreWrap: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: 24,
    gap: 10,
  },
  footerCountText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.muted,
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: COLORS.blueSoft,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
  },
  loadMoreBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.blueDark,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 56,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.ink,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14.5,
    fontWeight: '600',
    color: COLORS.muted,
    textAlign: 'center',
  },
  emptyActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  resetBtn: {
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink2,
  },
});
