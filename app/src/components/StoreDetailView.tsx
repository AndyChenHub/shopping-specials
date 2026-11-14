import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, STORE_THEMES } from '../theme/colors';
import {
  getCatalogueResetInfo,
  getStoreHeroImage,
} from '../theme/uiAssets';
import {
  CLIENT_CATEGORIES,
  getSubCategoriesForAisle,
  getSubCategoryDef,
  isSpecialItemHalfPrice,
  isSpecialItemOnSale,
  isSpecialItemRegularPrice,
  matchesSubCategory,
} from '../services/normalizeClient';
import {
  CatalogueInfo,
  DealFilter,
  SpecialItem,
  StoreFilter,
  StoreId,
  UserStoreLocation,
} from '../types/specials';
import { SpecialCard } from './SpecialCard';
import { resolveLocalStoreMeta } from './VenueCard';

interface StoreDetailViewProps {
  storeId: StoreId;
  items: SpecialItem[];
  catalogue: CatalogueInfo | null;
  qtyMap: Record<string, number>;
  isFavourite: boolean;
  userLocation: UserStoreLocation | null;
  loadingMoreRange?: boolean;
  onLoadMoreRange?: (params: {
    query?: string;
    category?: string;
    subCategory?: string;
    store?: StoreFilter;
    silent?: boolean;
  }) => void;
  onClose: () => void;
  onToggleFavourite: (storeId: StoreId) => void;
  onSelectProduct: (item: SpecialItem) => void;
  onIncrementItem: (item: SpecialItem) => void;
  onDecrementItem: (item: SpecialItem) => void;
  onOpenLocation: () => void;
}

export const StoreDetailView: React.FC<StoreDetailViewProps> = ({
  storeId,
  items,
  catalogue,
  qtyMap,
  isFavourite,
  userLocation,
  loadingMoreRange = false,
  onLoadMoreRange,
  onClose,
  onToggleFavourite,
  onSelectProduct,
  onIncrementItem,
  onDecrementItem,
  onOpenLocation,
}) => {
  const { width } = useWindowDimensions();
  const numColumns = width >= 1100 ? 4 : width >= 740 ? 3 : 2;

  const [solidNav, setSolidNav] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [selectedSubCat, setSelectedSubCat] = useState<string>('All');
  const [dealFilter, setDealFilter] = useState<DealFilter>('all');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const autoWarmedRef = useRef<Set<string>>(new Set());

  const theme = STORE_THEMES[storeId];
  const storeBtnLabel = storeId === 'iga' ? 'IGA' : theme.name;
  const meta = resolveLocalStoreMeta(storeId, userLocation);
  const { timeLeft } = getCatalogueResetInfo();

  const handleSelectCat = (nextCat: string) => {
    setSelectedCat(nextCat);
    if (nextCat !== 'all' && selectedSubCat !== 'All') {
      const def = getSubCategoryDef(selectedSubCat);
      if (!def || def.parentCategory !== nextCat) {
        setSelectedSubCat('All');
      }
    }
  };

  useEffect(() => {
    if (!onLoadMoreRange) return;
    if (selectedCat === 'all' && selectedSubCat === 'All') return;
    const warmKey = `${storeId}::${selectedCat}::${selectedSubCat}`;
    if (autoWarmedRef.current.has(warmKey)) return;
    const matching = items.filter((i) => {
      if (selectedCat !== 'all' && i.category !== selectedCat) return false;
      if (selectedSubCat !== 'All' && !matchesSubCategory(i, selectedSubCat)) {
        return false;
      }
      return true;
    });
    if (matching.length < 14) {
      autoWarmedRef.current.add(warmKey);
      onLoadMoreRange({
        store: storeId,
        category: selectedCat === 'all' ? 'All' : selectedCat,
        subCategory: selectedSubCat,
        silent: true,
      });
    }
  }, [items, onLoadMoreRange, selectedCat, selectedSubCat, storeId]);

  const specialsList = useMemo(
    () => items.filter(isSpecialItemOnSale),
    [items]
  );

  const availableCats = useMemo(() => {
    const ordered: string[] = [...CLIENT_CATEGORIES];
    for (const i of items) {
      if (i.category && !ordered.includes(i.category)) {
        ordered.push(i.category);
      }
    }
    return ['all', ...ordered];
  }, [items]);

  const subCategoryOptions = useMemo(
    () => getSubCategoriesForAisle(selectedCat === 'all' ? 'All' : selectedCat),
    [selectedCat]
  );

  const subCatCounts = useMemo(() => {
    const base = items.filter((i) => {
      if (selectedCat !== 'all' && i.category !== selectedCat) return false;
      if (dealFilter === 'half_price' && !isSpecialItemHalfPrice(i)) {
        return false;
      }
      if (dealFilter === 'sale' && !isSpecialItemOnSale(i)) return false;
      if (dealFilter === 'regular' && !isSpecialItemRegularPrice(i)) {
        return false;
      }
      if (inStockOnly && i.inStock !== true) return false;
      return true;
    });
    const map: Record<string, number> = {};
    for (const sub of subCategoryOptions) {
      let c = 0;
      for (const item of base) {
        if (matchesSubCategory(item, sub.id)) c += 1;
      }
      map[sub.id] = c;
    }
    return map;
  }, [items, selectedCat, dealFilter, inStockOnly, subCategoryOptions]);

  const chipCounts = useMemo(() => {
    const catPool = items.filter((i) => {
      if (selectedCat !== 'all' && i.category !== selectedCat) return false;
      if (selectedSubCat !== 'All' && !matchesSubCategory(i, selectedSubCat)) {
        return false;
      }
      return true;
    });
    const dealScoped = inStockOnly
      ? catPool.filter((i) => i.inStock === true)
      : catPool;
    const stockScoped = catPool.filter((i) => {
      if (dealFilter === 'half_price') return isSpecialItemHalfPrice(i);
      if (dealFilter === 'sale') return isSpecialItemOnSale(i);
      if (dealFilter === 'regular') return isSpecialItemRegularPrice(i);
      return true;
    });
    return {
      allCount: dealScoped.length,
      regularCount: dealScoped.filter(isSpecialItemRegularPrice).length,
      saleCount: dealScoped.filter(isSpecialItemOnSale).length,
      halfCount: dealScoped.filter(isSpecialItemHalfPrice).length,
      inStockCount: stockScoped.filter((i) => i.inStock === true).length,
    };
  }, [items, selectedCat, selectedSubCat, dealFilter, inStockOnly]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (selectedCat !== 'all' && i.category !== selectedCat) return false;
      if (selectedSubCat !== 'All' && !matchesSubCategory(i, selectedSubCat)) {
        return false;
      }
      if (dealFilter === 'half_price' && !isSpecialItemHalfPrice(i)) {
        return false;
      }
      if (dealFilter === 'sale' && !isSpecialItemOnSale(i)) {
        return false;
      }
      if (dealFilter === 'regular' && !isSpecialItemRegularPrice(i)) {
        return false;
      }
      if (inStockOnly && i.inStock !== true) return false;
      return true;
    });
  }, [items, selectedCat, selectedSubCat, dealFilter, inStockOnly]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const isSolid = e.nativeEvent.contentOffset.y > 140;
    if (isSolid !== solidNav) setSolidNav(isSolid);
  };

  return (
    <View style={styles.overlay}>
      {/* Floating / Sticky Nav Bar */}
      <View style={[styles.navBar, solidNav && styles.navBarSolid]}>
        <Pressable onPress={onClose} style={styles.roundBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={COLORS.ink} />
        </Pressable>
        <Text
          style={[styles.navTitle, { opacity: solidNav ? 1 : 0 }]}
          numberOfLines={1}
        >
          {meta.displayName}
        </Text>
        <Pressable
          onPress={() => onToggleFavourite(storeId)}
          style={styles.roundBtn}
          hitSlop={8}
        >
          <Ionicons
            name={isFavourite ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavourite ? COLORS.hot : COLORS.ink}
          />
        </Pressable>
      </View>

      <FlatList
        key={`store-grid-${numColumns}`}
        data={filtered}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.gridRow}
        ListHeaderComponent={
          <View>
            {/* Hero Cover */}
            <View style={styles.heroWrap}>
              <Image
                source={getStoreHeroImage(storeId)}
                style={styles.heroImg}
                resizeMode="cover"
              />
              <View style={styles.heroTopGradient} />
            </View>

            {/* Store Header Info + 3 Stat Cards */}
            <View style={styles.headWrap}>
              <View
                style={[styles.bigLogo, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.bigLogoText}>{theme.mono}</Text>
              </View>

              <Text style={styles.storeHeading}>{meta.displayName}</Text>

              <Pressable onPress={onOpenLocation} style={styles.metaLineBtn}>
                <Text style={styles.metaText}>
                  {theme.storeType} · {meta.badgeText} · {meta.hoursText}
                </Text>
                <Ionicons name="location-outline" size={14} color={COLORS.blue} />
              </Pressable>

              {catalogue && (
                <Text style={styles.catalogueLine} numberOfLines={1}>
                  {catalogue.name} · {catalogue.validDates}
                </Text>
              )}

              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statNum}>{items.length}</Text>
                  <Text style={styles.statLabel}>Total items</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNum}>{specialsList.length}</Text>
                  <Text style={styles.statLabel}>On special</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statNum, { color: COLORS.hot }]}>
                    {timeLeft}
                  </Text>
                  <Text style={styles.statLabel}>Until reset</Text>
                </View>
              </View>
            </View>

            {/* Deal / Stock Mode Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.modeChipsRow}
            >
              <Pressable
                onPress={() => setDealFilter('all')}
                style={[
                  styles.modeChip,
                  dealFilter === 'all' && styles.modeChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.modeChipText,
                    dealFilter === 'all' && styles.modeChipTextActive,
                  ]}
                >
                  All ({chipCounts.allCount})
                </Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  setDealFilter(dealFilter === 'sale' ? 'all' : 'sale')
                }
                style={[
                  styles.modeChip,
                  dealFilter === 'sale' && styles.modeChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.modeChipText,
                    dealFilter === 'sale' && styles.modeChipTextActive,
                  ]}
                >
                  Specials ({chipCounts.saleCount})
                </Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  setDealFilter(
                    dealFilter === 'half_price' ? 'all' : 'half_price'
                  )
                }
                style={[
                  styles.modeChip,
                  dealFilter === 'half_price' && { backgroundColor: COLORS.yellow },
                ]}
              >
                <Text
                  style={[
                    styles.modeChipText,
                    dealFilter === 'half_price' && { color: COLORS.ink },
                  ]}
                >
                  ½ price ({chipCounts.halfCount})
                </Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  setDealFilter(dealFilter === 'regular' ? 'all' : 'regular')
                }
                style={[
                  styles.modeChip,
                  dealFilter === 'regular' && styles.modeChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.modeChipText,
                    dealFilter === 'regular' && styles.modeChipTextActive,
                  ]}
                >
                  Regular ({chipCounts.regularCount})
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setInStockOnly((v) => !v)}
                style={[
                  styles.modeChip,
                  inStockOnly && { backgroundColor: COLORS.green },
                ]}
              >
                <Text
                  style={[
                    styles.modeChipText,
                    inStockOnly && { color: '#FFFFFF' },
                  ]}
                >
                  In stock ({chipCounts.inStockCount})
                </Text>
              </Pressable>
            </ScrollView>

            {/* Category Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catTabsRow}
            >
              {availableCats.map((c) => {
                const active = selectedCat === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => handleSelectCat(c)}
                    style={[styles.catTab, active && styles.catTabActive]}
                  >
                    <Text
                      style={[
                        styles.catTabText,
                        active && styles.catTabTextActive,
                      ]}
                    >
                      {c === 'all' ? 'All aisles' : c}
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
                contentContainerStyle={styles.subTabsRow}
              >
                <Pressable
                  onPress={() => setSelectedSubCat('All')}
                  style={[
                    styles.subChip,
                    selectedSubCat === 'All' && styles.subChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.subChipText,
                      selectedSubCat === 'All' && styles.subChipTextActive,
                    ]}
                  >
                    All types
                  </Text>
                </Pressable>
                {subCategoryOptions.map((sub) => {
                  const active = selectedSubCat === sub.id;
                  const sCount = subCatCounts[sub.id] ?? 0;
                  return (
                    <Pressable
                      key={sub.id}
                      onPress={() =>
                        setSelectedSubCat(active ? 'All' : sub.id)
                      }
                      style={[styles.subChip, active && styles.subChipActive]}
                    >
                      <Text
                        style={[
                          styles.subChipText,
                          active && styles.subChipTextActive,
                        ]}
                      >
                        {sCount > 0
                          ? `${sub.shortLabel} (${sCount})`
                          : sub.shortLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            {loadingMoreRange && (
              <Text style={styles.loadingHint}>
                Loading more {storeBtnLabel} items…
              </Text>
            )}
          </View>
        }
        ListFooterComponent={
          filtered.length > 0 && onLoadMoreRange ? (
            <View style={styles.footerMoreWrap}>
              <Text style={styles.footerCountText}>
                Showing {filtered.length} items
              </Text>
              <Pressable
                onPress={() =>
                  onLoadMoreRange({
                    store: storeId,
                    category: selectedCat === 'all' ? 'All' : selectedCat,
                    subCategory: selectedSubCat,
                  })
                }
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
                    ? `Loading more ${storeBtnLabel} items…`
                    : `Load more ${storeBtnLabel} items`}
                </Text>
              </Pressable>
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          <View style={styles.emptyStoreBox}>
            <Text style={styles.emptyStoreTitle}>
              {loadingMoreRange
                ? `Fetching ${storeBtnLabel} items…`
                : 'No matching items'}
            </Text>
            <Text style={styles.emptyStoreSub}>
              Try loading more range from {storeBtnLabel} or clearing an active filter.
            </Text>
            <View style={styles.emptyActionsRow}>
              {onLoadMoreRange && (
                <Pressable
                  onPress={() =>
                    onLoadMoreRange({
                      store: storeId,
                      category: selectedCat === 'all' ? 'All' : selectedCat,
                      subCategory: selectedSubCat,
                    })
                  }
                  disabled={loadingMoreRange}
                  style={styles.loadMoreBtn}
                >
                  {loadingMoreRange && (
                    <ActivityIndicator size="small" color={COLORS.blue} />
                  )}
                  <Text style={styles.loadMoreBtnText}>
                    {loadingMoreRange
                      ? 'Loading…'
                      : `Load from ${storeBtnLabel}`}
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => {
                  setSelectedCat('all');
                  setSelectedSubCat('All');
                  setDealFilter('all');
                  setInStockOnly(false);
                }}
                style={styles.resetStoreBtn}
              >
                <Text style={styles.resetStoreBtnText}>Reset filters</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 35,
    backgroundColor: '#FFFFFF',
  },
  navBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    height: 60,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBarSolid: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.ink,
    marginHorizontal: 8,
  },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  listContent: {
    paddingBottom: 175,
  },
  heroWrap: {
    height: 230,
    backgroundColor: COLORS.surfaceAlt,
    position: 'relative',
  },
  heroImg: {
    width: '100%',
    height: '100%',
  },
  heroTopGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  headWrap: {
    paddingHorizontal: 16,
    marginTop: -36,
  },
  bigLogo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  bigLogoText: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  storeHeading: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: -1.1,
    marginTop: 10,
  },
  metaLineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.muted,
  },
  catalogueLine: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.blue,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    padding: 12,
  },
  statNum: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
    marginTop: 2,
  },
  modeChipsRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  modeChip: {
    height: 34,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeChipActive: {
    backgroundColor: COLORS.ink,
  },
  modeChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ink2,
  },
  modeChipTextActive: {
    color: '#FFFFFF',
  },
  catTabsRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 6,
  },
  catTab: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catTabActive: {
    backgroundColor: COLORS.blueSoft,
  },
  catTabText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink2,
  },
  catTabTextActive: {
    color: COLORS.blueDark,
  },
  subTabsRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 7,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    marginBottom: 14,
  },
  subChip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
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
  loadingHint: {
    paddingHorizontal: 16,
    marginBottom: 12,
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
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.blueDark,
  },
  emptyStoreBox: {
    alignItems: 'center',
    paddingVertical: 44,
    paddingHorizontal: 28,
    gap: 8,
  },
  emptyStoreTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
    textAlign: 'center',
  },
  emptyStoreSub: {
    fontSize: 13.5,
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
    marginTop: 6,
  },
  resetStoreBtn: {
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
  },
  resetStoreBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.ink2,
  },
});
