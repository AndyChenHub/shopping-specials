import React, { useMemo, useState } from 'react';
import {
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
  isSpecialItemHalfPrice,
  isSpecialItemOnSale,
} from '../services/normalizeClient';
import {
  CatalogueInfo,
  DealFilter,
  SpecialItem,
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
  const [dealFilter, setDealFilter] = useState<DealFilter>('all');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  const theme = STORE_THEMES[storeId];
  const meta = resolveLocalStoreMeta(storeId, userLocation);
  const { timeLeft } = getCatalogueResetInfo();

  const specialsList = useMemo(
    () => items.filter(isSpecialItemOnSale),
    [items]
  );

  const totalSaveDollars = useMemo(
    () =>
      specialsList.reduce(
        (sum, d) =>
          sum +
          (d.saveAmount ?? (d.wasPrice && d.wasPrice > d.price ? d.wasPrice - d.price : 0)),
        0
      ),
    [specialsList]
  );

  const availableCats = useMemo(() => {
    const set = new Set<string>();
    for (const i of items) {
      if (i.category) set.add(i.category);
    }
    const ordered = CLIENT_CATEGORIES.filter((c) => set.has(c));
    for (const c of set) {
      if (!ordered.includes(c)) ordered.push(c);
    }
    return ['all', ...ordered];
  }, [items]);

  const chipCounts = useMemo(() => {
    const catPool =
      selectedCat === 'all'
        ? items
        : items.filter((i) => i.category === selectedCat);
    const dealScoped = inStockOnly
      ? catPool.filter((i) => i.inStock === true)
      : catPool;
    const stockScoped = catPool.filter((i) => {
      if (dealFilter === 'half_price') return isSpecialItemHalfPrice(i);
      if (dealFilter === 'sale') return isSpecialItemOnSale(i);
      return true;
    });
    return {
      allCount: dealScoped.length,
      saleCount: dealScoped.filter(isSpecialItemOnSale).length,
      halfCount: dealScoped.filter(isSpecialItemHalfPrice).length,
      inStockCount: stockScoped.filter((i) => i.inStock === true).length,
    };
  }, [items, selectedCat, dealFilter, inStockOnly]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (selectedCat !== 'all' && i.category !== selectedCat) return false;
      if (dealFilter === 'half_price' && !isSpecialItemHalfPrice(i)) {
        return false;
      }
      if (dealFilter === 'sale' && !isSpecialItemOnSale(i)) {
        return false;
      }
      if (inStockOnly && i.inStock !== true) return false;
      return true;
    });
  }, [items, selectedCat, dealFilter, inStockOnly]);

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
                  <Text style={styles.statNum}>{specialsList.length}</Text>
                  <Text style={styles.statLabel}>Specials</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNum}>
                    ${Math.round(totalSaveDollars)}
                  </Text>
                  <Text style={styles.statLabel}>Total savings</Text>
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
                    onPress={() => setSelectedCat(c)}
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
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyStoreBox}>
            <Text style={styles.emptyStoreTitle}>No matching items</Text>
            <Text style={styles.emptyStoreSub}>
              Try clearing an aisle, deal or stock filter to view more products.
            </Text>
            <Pressable
              onPress={() => {
                setSelectedCat('all');
                setDealFilter('all');
                setInStockOnly(false);
              }}
              style={styles.resetStoreBtn}
            >
              <Text style={styles.resetStoreBtnText}>Reset filters</Text>
            </Pressable>
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
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    marginBottom: 16,
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
  gridRow: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 18,
  },
  cardCell: {
    flex: 1,
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
  resetStoreBtn: {
    marginTop: 6,
    backgroundColor: COLORS.blueSoft,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  resetStoreBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.blueDark,
  },
});
