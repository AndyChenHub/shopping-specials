import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import {
  DISCOVER_CATEGORIES,
  getCatalogueResetInfo,
  UI_ASSETS,
} from '../theme/uiAssets';
import {
  DealFilter,
  SpecialItem,
  StoreId,
  UserStoreLocation,
} from '../types/specials';
import { APP_VERSION_INFO } from '../services/versionChecker';
import {
  isSpecialItemHalfPrice,
  isSpecialItemOnSale,
} from '../services/normalizeClient';
import { SpecialCard } from './SpecialCard';
import { SavingsRow } from './SavingsRow';
import { VenueCard } from './VenueCard';

interface DiscoverViewProps {
  allItems: SpecialItem[];
  qtyMap: Record<string, number>;
  favStores: StoreId[];
  userLocation: UserStoreLocation | null;
  lastSyncedAt: string | null;
  refreshing: boolean;
  hasAppUpdate: boolean;
  onRefresh: () => void;
  onOpenLocation: () => void;
  onOpenSettings: () => void;
  onSelectProduct: (item: SpecialItem) => void;
  onIncrementItem: (item: SpecialItem) => void;
  onDecrementItem: (item: SpecialItem) => void;
  onOpenStore: (storeId: StoreId) => void;
  onNavigateTab: (tab: 'discover' | 'stores' | 'search' | 'list') => void;
  browseDealFilter?: DealFilter;
  onChangeBrowseDealFilter?: (filter: DealFilter) => void;
  browseInStockOnly?: boolean;
  onToggleBrowseInStockOnly?: () => void;
}

const DISCOVER_STORE_ORDER: StoreId[] = ['woolworths', 'coles', 'aldi', 'iga'];

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  allItems,
  qtyMap,
  favStores,
  userLocation,
  lastSyncedAt,
  refreshing,
  hasAppUpdate,
  onRefresh,
  onOpenLocation,
  onOpenSettings,
  onSelectProduct,
  onIncrementItem,
  onDecrementItem,
  onOpenStore,
  onNavigateTab,
  browseDealFilter: controlledDealFilter,
  onChangeBrowseDealFilter,
  browseInStockOnly: controlledInStockOnly,
  onToggleBrowseInStockOnly,
}) => {
  const { width } = useWindowDimensions();
  const numColumns = width >= 1100 ? 4 : width >= 740 ? 3 : 2;

  const [heroIndex, setHeroIndex] = useState<number>(0);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [localDealFilter, setLocalDealFilter] = useState<DealFilter>('all');
  const [localInStockOnly, setLocalInStockOnly] = useState<boolean>(false);

  const browseDealFilter = controlledDealFilter ?? localDealFilter;
  const setBrowseDealFilter = onChangeBrowseDealFilter ?? setLocalDealFilter;
  const browseInStockOnly = controlledInStockOnly ?? localInStockOnly;
  const toggleBrowseInStockOnly =
    onToggleBrowseInStockOnly ?? (() => setLocalInStockOnly((v) => !v));

  const { timeLeft } = getCatalogueResetInfo();

  const halfPriceDeals = useMemo(
    () => allItems.filter(isSpecialItemHalfPrice).slice(0, 18),
    [allItems]
  );

  const biggestSavings = useMemo(() => {
    return [...allItems]
      .filter((i) => (i.saveAmount && i.saveAmount > 0) || (i.wasPrice && i.wasPrice > i.price))
      .sort((a, b) => {
        const sa = a.saveAmount ?? (a.wasPrice ? a.wasPrice - a.price : 0);
        const sb = b.saveAmount ?? (b.wasPrice ? b.wasPrice - b.price : 0);
        return sb - sa;
      })
      .slice(0, 6);
  }, [allItems]);

  const underFiveDeals = useMemo(
    () =>
      allItems
        .filter((i) => i.price > 0 && i.price < 5)
        .slice(0, 18),
    [allItems]
  );

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

  const browseChipCounts = useMemo(() => {
    const catScoped = selectedCat
      ? allItems.filter((item) => item.category === selectedCat)
      : allItems;
    const dealScoped = browseInStockOnly
      ? catScoped.filter((item) => item.inStock === true)
      : catScoped;
    const stockScoped = catScoped.filter((item) => {
      if (browseDealFilter === 'half_price') return isSpecialItemHalfPrice(item);
      if (browseDealFilter === 'sale') return isSpecialItemOnSale(item);
      return true;
    });
    return {
      allCount: dealScoped.length,
      saleCount: dealScoped.filter(isSpecialItemOnSale).length,
      halfCount: dealScoped.filter(isSpecialItemHalfPrice).length,
      inStockCount: stockScoped.filter((item) => item.inStock === true).length,
    };
  }, [allItems, selectedCat, browseDealFilter, browseInStockOnly]);

  const gridPool = useMemo(() => {
    return allItems.filter((item) => {
      if (selectedCat && item.category !== selectedCat) return false;
      if (browseDealFilter === 'half_price' && !isSpecialItemHalfPrice(item)) {
        return false;
      }
      if (browseDealFilter === 'sale' && !isSpecialItemOnSale(item)) {
        return false;
      }
      if (browseInStockOnly && item.inStock !== true) return false;
      return true;
    });
  }, [allItems, selectedCat, browseDealFilter, browseInStockOnly]);

  const displayedGridItems = useMemo(
    () => (selectedCat ? gridPool : gridPool.slice(0, 36)),
    [gridPool, selectedCat]
  );

  const gridRows = useMemo(() => {
    const rows: SpecialItem[][] = [];
    for (let i = 0; i < displayedGridItems.length; i += numColumns) {
      rows.push(displayedGridItems.slice(i, i + numColumns));
    }
    return rows;
  }, [displayedGridItems, numColumns]);

  const handleHeroScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / 328);
    if (idx !== heroIndex && idx >= 0 && idx <= 1) {
      setHeroIndex(idx);
    }
  };

  const renderFilterChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterChipsRow}
    >
      <Pressable
        onPress={() => setBrowseDealFilter('all')}
        style={[
          styles.filterChip,
          browseDealFilter === 'all' && styles.filterChipActive,
        ]}
      >
        <Text
          style={[
            styles.filterChipText,
            browseDealFilter === 'all' && styles.filterChipTextActive,
          ]}
        >
          All items ({browseChipCounts.allCount})
        </Text>
      </Pressable>

      <Pressable
        onPress={() =>
          setBrowseDealFilter(browseDealFilter === 'sale' ? 'all' : 'sale')
        }
        style={[
          styles.filterChip,
          browseDealFilter === 'sale' && styles.filterChipActive,
        ]}
      >
        <Ionicons
          name="pricetag"
          size={13}
          color={browseDealFilter === 'sale' ? '#FFFFFF' : COLORS.ink2}
        />
        <Text
          style={[
            styles.filterChipText,
            browseDealFilter === 'sale' && styles.filterChipTextActive,
          ]}
        >
          On sale ({browseChipCounts.saleCount})
        </Text>
      </Pressable>

      <Pressable
        onPress={() =>
          setBrowseDealFilter(
            browseDealFilter === 'half_price' ? 'all' : 'half_price'
          )
        }
        style={[
          styles.filterChip,
          browseDealFilter === 'half_price' && styles.filterChipYellow,
        ]}
      >
        <Text
          style={[
            styles.filterChipText,
            browseDealFilter === 'half_price' && { color: COLORS.ink, fontWeight: '900' },
          ]}
        >
          ½ price ({browseChipCounts.halfCount})
        </Text>
      </Pressable>

      <Pressable
        onPress={toggleBrowseInStockOnly}
        style={[
          styles.filterChip,
          browseInStockOnly && styles.filterChipGreen,
        ]}
      >
        <Ionicons
          name="checkmark-circle"
          size={14}
          color={browseInStockOnly ? '#FFFFFF' : COLORS.green}
        />
        <Text
          style={[
            styles.filterChipText,
            browseInStockOnly && styles.filterChipTextActive,
          ]}
        >
          In stock ({browseChipCounts.inStockCount})
        </Text>
      </Pressable>
    </ScrollView>
  );

  const renderProductGrid = () => {
    if (displayedGridItems.length === 0) {
      return (
        <View style={styles.emptyFilterBox}>
          <Text style={styles.emptyFilterTitle}>No matching items</Text>
          <Text style={styles.emptyFilterSub}>
            Try clearing a deal or stock filter to see all items in this aisle.
          </Text>
          <Pressable
            onPress={() => {
              setBrowseDealFilter('all');
              if (browseInStockOnly) toggleBrowseInStockOnly();
            }}
            style={styles.seeAllPill}
          >
            <Text style={styles.seeAllText}>Reset filters</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.gridContainer}>
        {gridRows.map((row, rIdx) => (
          <View key={`row-${rIdx}`} style={styles.gridRow}>
            {row.map((item) => (
              <View key={item.id} style={styles.gridCell}>
                <SpecialCard
                  item={item}
                  quantity={qtyMap[item.id] || 0}
                  onPress={onSelectProduct}
                  onIncrement={onIncrementItem}
                  onDecrement={onDecrementItem}
                />
              </View>
            ))}
            {row.length < numColumns &&
              Array.from({ length: numColumns - row.length }).map((_, emptyIdx) => (
                <View key={`empty-${emptyIdx}`} style={styles.gridCell} />
              ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.blue}
        />
      }
    >
      {/* Snag Top Bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={onOpenLocation}
          style={({ pressed }) => [styles.locButton, pressed && { opacity: 0.75 }]}
          accessibilityLabel="Set postcode and local stores"
        >
          <View style={styles.pinCircle}>
            <Ionicons name="location" size={20} color={COLORS.blue} />
          </View>
          <View style={styles.locTextWrap}>
            <Text style={styles.locSmall}>Specials near</Text>
            <View style={styles.locBoldRow}>
              <Text style={styles.locBold} numberOfLines={1}>
                {userLocation
                  ? `${userLocation.suburb} ${userLocation.postcode}`
                  : 'Set local store'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.blue} />
            </View>
          </View>
        </Pressable>

        <View style={styles.rightBrandRow}>
          <Pressable
            onPress={onRefresh}
            disabled={refreshing}
            style={({ pressed }) => [
              styles.topIconCircle,
              pressed && { opacity: 0.7 },
            ]}
            accessibilityLabel="Sync latest catalogues and prices"
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={COLORS.blue} />
            ) : (
              <Ionicons name="sync-outline" size={18} color={COLORS.ink2} />
            )}
          </Pressable>

          <Pressable
            onPress={onOpenSettings}
            style={({ pressed }) => [
              styles.topIconCircle,
              pressed && { opacity: 0.7 },
            ]}
            accessibilityLabel={`App settings v${APP_VERSION_INFO.version}`}
          >
            <Ionicons name="settings-outline" size={18} color={COLORS.ink2} />
            {hasAppUpdate && <View style={styles.updateDot} />}
          </Pressable>

          <View style={styles.brandLockup}>
            <Text style={styles.wordmarkTop}>AUSSIE</Text>
            <Text style={styles.wordmark}>
              Specials<Text style={styles.wordmarkDot}>.</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Hero Banners */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={328}
        decelerationRate="fast"
        onScroll={handleHeroScroll}
        scrollEventThrottle={32}
        contentContainerStyle={styles.horizontalPad}
      >
        <Pressable
          onPress={() =>
            setSelectedCat((prev) =>
              prev === 'Fruit & Veg' ? null : 'Fruit & Veg'
            )
          }
          style={({ pressed }) => [
            styles.heroBanner,
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
        >
          <Image
            source={UI_ASSETS.bannerFresh}
            style={styles.heroImg}
            resizeMode="cover"
          />
          <View style={styles.heroScrim} />
          <View style={styles.heroTextCol}>
            <Text style={styles.heroKick}>THIS WEEK</Text>
            <Text style={styles.heroHeadline}>
              Fresh produce, half the price
            </Text>
            <View style={styles.heroCta}>
              <Text style={styles.heroCtaText}>Shop fresh</Text>
            </View>
          </View>
        </Pressable>

        <Pressable
          onPress={() =>
            setSelectedCat((prev) =>
              prev === 'Pantry & Snacks' ? null : 'Pantry & Snacks'
            )
          }
          style={({ pressed }) => [
            styles.heroBanner,
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
        >
          <Image
            source={UI_ASSETS.bannerPantry}
            style={styles.heroImg}
            resizeMode="cover"
          />
          <View style={styles.heroScrim} />
          <View style={styles.heroTextCol}>
            <Text style={styles.heroKick}>STOCK-UP</Text>
            <Text style={styles.heroHeadline}>
              Pantry heroes up to 50% off
            </Text>
            <View style={styles.heroCta}>
              <Text style={styles.heroCtaText}>Browse pantry</Text>
            </View>
          </View>
        </Pressable>
      </ScrollView>

      {/* Hero Pagination Dots */}
      <View style={styles.heroDots}>
        <View style={[styles.dot, heroIndex === 0 && styles.dotActive]} />
        <View style={[styles.dot, heroIndex === 1 && styles.dotActive]} />
      </View>

      {/* Circular Photo Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catsStrip}
      >
        {DISCOVER_CATEGORIES.map((cat) => {
          const isActive = selectedCat === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() =>
                setSelectedCat((prev) => (prev === cat.id ? null : cat.id))
              }
              style={({ pressed }) => [
                styles.catItem,
                pressed && { transform: [{ scale: 0.94 }] },
              ]}
            >
              <View style={[styles.catRing, isActive && styles.catRingActive]}>
                <View style={styles.catCircle}>
                  <Image
                    source={cat.image}
                    style={styles.catImg}
                    resizeMode="cover"
                  />
                </View>
              </View>
              <Text
                style={[styles.catLabel, isActive && { color: COLORS.blue }]}
                numberOfLines={2}
              >
                {cat.shortLabel}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Filtered Category View OR Curated Discover Feed */}
      {selectedCat ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>{selectedCat}</Text>
              <Text style={styles.sectionSub}>
                {gridPool.length} items across{' '}
                {new Set(gridPool.map((i) => i.store)).size} stores
              </Text>
            </View>
            <Pressable
              onPress={() => setSelectedCat(null)}
              style={styles.seeAllPill}
            >
              <Text style={styles.seeAllText}>Clear</Text>
            </Pressable>
          </View>

          {renderFilterChips()}
          {renderProductGrid()}
        </View>
      ) : (
        <>
          {/* 1. Half Price This Week */}
          {halfPriceDeals.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Half price this week</Text>
                  <Text style={styles.sectionSub}>
                    {halfPriceDeals.length} deals · don't sleep on these
                  </Text>
                </View>
                <View style={styles.timerPill}>
                  <Ionicons name="time-outline" size={14} color={COLORS.hot} />
                  <Text style={styles.timerText}>{timeLeft}</Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalCards}
              >
                {halfPriceDeals.map((item) => (
                  <SpecialCard
                    key={item.id}
                    item={item}
                    width={152}
                    quantity={qtyMap[item.id] || 0}
                    onPress={onSelectProduct}
                    onIncrement={onIncrementItem}
                    onDecrement={onDecrementItem}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* 2. Stores Near You */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Stores near you</Text>
                <Text style={styles.sectionSub}>
                  {userLocation
                    ? `Local stock & catalogues around ${userLocation.suburb}`
                    : 'Catalogues refresh every Wednesday'}
                </Text>
              </View>
              <Pressable
                onPress={() => onNavigateTab('stores')}
                style={styles.seeAllPill}
              >
                <Text style={styles.seeAllText}>See all</Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalCards}
            >
              {DISCOVER_STORE_ORDER.map((sid) => (
                <VenueCard
                  key={sid}
                  storeId={sid}
                  items={itemsByStore[sid] || []}
                  userLocation={userLocation}
                  isFavourite={favStores.includes(sid)}
                  onPress={onOpenStore}
                />
              ))}
            </ScrollView>
          </View>

          {/* 3. Biggest Savings */}
          {biggestSavings.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Biggest savings</Text>
                  <Text style={styles.sectionSub}>Ranked by dollars off</Text>
                </View>
              </View>
              <View style={styles.savingsListWrap}>
                {biggestSavings.map((item, idx) => (
                  <SavingsRow
                    key={item.id}
                    item={item}
                    rank={idx + 1}
                    isLast={idx === biggestSavings.length - 1}
                    onPress={onSelectProduct}
                  />
                ))}
              </View>
            </View>
          )}

          {/* 4. Under $5 */}
          {underFiveDeals.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Under $5</Text>
                  <Text style={styles.sectionSub}>Cheap thrills</Text>
                </View>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalCards}
              >
                {underFiveDeals.map((item) => (
                  <SpecialCard
                    key={item.id}
                    item={item}
                    width={152}
                    quantity={qtyMap[item.id] || 0}
                    onPress={onSelectProduct}
                    onIncrement={onIncrementItem}
                    onDecrement={onDecrementItem}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* 5. Full Everyday + Specials Browse */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Browse range & deals</Text>
                <Text style={styles.sectionSub}>
                  Tap any item to compare Amazon AU, Coles, Woolies, ALDI & IGA
                </Text>
              </View>
              <Pressable
                onPress={() => onNavigateTab('search')}
                style={styles.seeAllPill}
              >
                <Text style={styles.seeAllText}>Search all</Text>
              </Pressable>
            </View>

            {renderFilterChips()}
            {renderProductGrid()}
          </View>
        </>
      )}

      <Text style={styles.footerNote}>
        Live Australian supermarket prices ·{' '}
        {lastSyncedAt
          ? `synced ${new Date(lastSyncedAt).toLocaleTimeString('en-AU', {
              hour: 'numeric',
              minute: '2-digit',
            })}`
          : `v${APP_VERSION_INFO.version}`}
      </Text>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  locButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  pinCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locTextWrap: {
    flex: 1,
  },
  locSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
  },
  locBoldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locBold: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  rightBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  updateDot: {
    position: 'absolute',
    right: 5,
    top: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.hot,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  brandLockup: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  wordmarkTop: {
    fontSize: 9.5,
    fontWeight: '900',
    color: COLORS.green,
    letterSpacing: 1.1,
    lineHeight: 11,
  },
  wordmark: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.blue,
    letterSpacing: -0.8,
    lineHeight: 19,
  },
  wordmarkDot: {
    color: COLORS.yellow,
  },
  horizontalPad: {
    paddingHorizontal: 16,
    gap: 10,
  },
  heroBanner: {
    width: 318,
    height: 188,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.ink,
    position: 'relative',
  },
  heroImg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  heroScrim: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '68%',
    backgroundColor: 'rgba(15, 20, 28, 0.34)',
  },
  heroTextCol: {
    position: 'absolute',
    left: 18,
    top: 18,
    bottom: 18,
    width: '58%',
    justifyContent: 'space-between',
  },
  heroKick: {
    fontSize: 11.5,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 1,
  },
  heroHeadline: {
    fontSize: 25,
    lineHeight: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  heroCta: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  heroCtaText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ink,
  },
  heroDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 12,
    marginBottom: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DCDDE1',
  },
  dotActive: {
    width: 16,
    backgroundColor: COLORS.ink,
  },
  catsStrip: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
  },
  catItem: {
    width: 72,
    alignItems: 'center',
    gap: 6,
  },
  catRing: {
    padding: 2.5,
    borderRadius: 38,
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  catRingActive: {
    borderColor: COLORS.blue,
  },
  catCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceAlt,
  },
  catImg: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.25 }],
  },
  catLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink2,
    textAlign: 'center',
    lineHeight: 14.5,
  },
  section: {
    marginTop: 26,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: -0.7,
  },
  sectionSub: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
    marginTop: 2,
  },
  seeAllPill: {
    backgroundColor: COLORS.blueSoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  seeAllText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.blue,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.hotSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  timerText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.hot,
  },
  horizontalCards: {
    paddingHorizontal: 16,
    gap: 12,
  },
  savingsListWrap: {
    paddingHorizontal: 16,
  },
  filterChipsRow: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 8,
  },
  filterChip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  filterChipActive: {
    backgroundColor: COLORS.ink,
  },
  filterChipYellow: {
    backgroundColor: COLORS.yellow,
  },
  filterChipGreen: {
    backgroundColor: COLORS.green,
  },
  filterChipText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.ink2,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  gridContainer: {
    paddingHorizontal: 16,
    gap: 18,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCell: {
    flex: 1,
  },
  emptyFilterBox: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 28,
    gap: 8,
  },
  emptyFilterTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
    textAlign: 'center',
  },
  emptyFilterSub: {
    fontSize: 13.5,
    fontWeight: '600',
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 4,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.faint,
    marginTop: 32,
  },
});
