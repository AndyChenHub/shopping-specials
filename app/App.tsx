import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, STORE_THEMES } from './src/theme/colors';
import {
  CatalogueInfo,
  DealFilter,
  SortOption,
  SpecialItem,
  StoreFilter,
  StoreId,
  StoreStat,
  UserStoreLocation,
} from './src/types/specials';
import {
  fetchSpecials,
  loadCachedFeedFromDevice,
  triggerWebSync,
} from './src/services/api';
import {
  loadSavedUserLocation,
  saveUserLocation,
  toLocationSearchContext,
} from './src/services/locationService';
import {
  loadSavedSpecials,
  persistSavedSpecials,
} from './src/services/savedStorage';
import {
  checkLatestIpaRelease,
  IpaReleaseCheckResult,
} from './src/services/versionChecker';
import { HeaderBar } from './src/components/HeaderBar';
import { FilterBar } from './src/components/FilterBar';
import { SpecialCard } from './src/components/SpecialCard';
import { SpecialDetailModal } from './src/components/SpecialDetailModal';
import { SavedListView } from './src/components/SavedListView';
import { ServerSettingsModal } from './src/components/ServerSettingsModal';
import { LocationStoreModal } from './src/components/LocationStoreModal';

const DEFAULT_CATEGORIES = [
  'Fruit & Veg',
  'Meat & Seafood',
  'Fridge & Dairy',
  'Bakery',
  'Freezer',
  'Pantry & Snacks',
  'Drinks',
  'Household & Pet',
  'Health & Beauty',
  'Special Buys',
];

type ActiveTab = 'browse' | 'saved';

function MainApp() {
  const { width } = useWindowDimensions();
  const numColumns = width >= 1100 ? 4 : width >= 740 ? 3 : 2;

  const [activeTab, setActiveTab] = useState<ActiveTab>('browse');

  // Data state
  const [allItems, setAllItems] = useState<SpecialItem[]>([]);
  const [liveExtraItems, setLiveExtraItems] = useState<SpecialItem[]>([]);
  const [liveSearchedQuery, setLiveSearchedQuery] = useState<string>('');
  const searchSeqRef = useRef<number>(0);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [storeStats, setStoreStats] = useState<
    Partial<Record<StoreId, StoreStat>> | null
  >(null);
  const [catalogues, setCatalogues] = useState<
    Partial<Record<StoreId, CatalogueInfo | null>> | null
  >(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Loading & error state
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [liveSearching, setLiveSearching] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<StoreFilter>('all');
  const [dealFilter, setDealFilter] = useState<DealFilter>('all');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  // User location & local stores
  const [userLocation, setUserLocation] = useState<UserStoreLocation | null>(
    null
  );
  const [locationModalOpen, setLocationModalOpen] = useState<boolean>(false);
  const resumeDetailAfterLocationRef = useRef<SpecialItem | null>(null);

  // Saved shortlist & modals
  const [savedItems, setSavedItems] = useState<SpecialItem[]>([]);
  const [detailItem, setDetailItem] = useState<SpecialItem | null>(null);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  // IPA Release version checker
  const [releaseCheck, setReleaseCheck] =
    useState<IpaReleaseCheckResult | null>(null);
  const [checkingRelease, setCheckingRelease] = useState<boolean>(false);
  const [updateBannerDismissed, setUpdateBannerDismissed] =
    useState<boolean>(false);

  const runReleaseCheck = useCallback(async () => {
    try {
      setCheckingRelease(true);
      const res = await checkLatestIpaRelease();
      setReleaseCheck(res);
    } catch {
      // Ignore offline check errors silently
    } finally {
      setCheckingRelease(false);
    }
  }, []);

  useEffect(() => {
    runReleaseCheck();
  }, [runReleaseCheck]);

  const savedIdSet = useMemo(
    () => new Set(savedItems.map((i) => i.id)),
    [savedItems]
  );

  // Load saved deals & saved user location from AsyncStorage
  useEffect(() => {
    loadSavedSpecials().then(setSavedItems);
    loadSavedUserLocation().then(setUserLocation);
  }, []);

  const applySpecialsResponse = useCallback(
    (
      data: Awaited<ReturnType<typeof fetchSpecials>>,
      preserveLiveSearch = false
    ) => {
      setAllItems(data.items || []);
      if (!preserveLiveSearch) {
        setLiveExtraItems([]);
      }
      if (data.categories?.length) setCategories(data.categories);
      setStoreStats(data.storeStats || null);
      setCatalogues(data.catalogues || null);
      setLastSyncedAt(data.lastSyncedAt || null);
    },
    []
  );

  const loadCataloguesFromServer = useCallback(async () => {
    try {
      setErrorMsg(null);
      // Hydrate device cache immediately on cold boot so .ipa opens instantaneously
      const cached = await loadCachedFeedFromDevice();
      if (cached && cached.items?.length > 0) {
        applySpecialsResponse(cached);
        setInitialLoading(false);
      }

      const data = await fetchSpecials();
      applySpecialsResponse(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Unable to fetch specials';
      setErrorMsg(msg);
    } finally {
      setInitialLoading(false);
    }
  }, [applySpecialsResponse]);

  useEffect(() => {
    loadCataloguesFromServer();
  }, [loadCataloguesFromServer]);

  const handleSyncFromWeb = useCallback(async () => {
    try {
      setRefreshing(true);
      setErrorMsg(null);
      const updated = await triggerWebSync();
      applySpecialsResponse(updated);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to download specials from web';
      setErrorMsg(msg);
    } finally {
      setRefreshing(false);
    }
  }, [applySpecialsResponse]);

  const runLiveSearchForQuery = useCallback(
    async (rawQuery: string, explicitLoc?: UserStoreLocation | null) => {
      const q = rawQuery.trim();
      if (q.length < 2) {
        setLiveSearching(false);
        return;
      }
      const seq = ++searchSeqRef.current;
      const activeLoc =
        explicitLoc !== undefined ? explicitLoc : userLocation;
      try {
        setLiveSearching(true);
        const res = await fetchSpecials({
          q,
          live: true,
          locationCtx: toLocationSearchContext(activeLoc),
        });
        if (seq !== searchSeqRef.current) return;
        setLiveExtraItems(res.items || []);
        setLiveSearchedQuery(q.toLowerCase());
      } catch {
        // Keep local instant search results if offline
      } finally {
        if (seq === searchSeqRef.current) {
          setLiveSearching(false);
        }
      }
    },
    [userLocation]
  );

  const handleSaveLocation = useCallback(
    async (nextLoc: UserStoreLocation | null) => {
      await saveUserLocation(nextLoc);
      setUserLocation(nextLoc);

      const q = searchQuery.trim();
      if (q.length >= 2) {
        runLiveSearchForQuery(q, nextLoc);
      }

      // Sync regional catalogues & local store everyday inventory in background
      try {
        setRefreshing(true);
        const updated = await triggerWebSync(toLocationSearchContext(nextLoc));
        applySpecialsResponse(updated, q.length >= 2);
      } catch {
        // Ignore background refresh error if offline
      } finally {
        setRefreshing(false);
      }
    },
    [applySpecialsResponse, runLiveSearchForQuery, searchQuery]
  );

  const handleOpenLocationFromDetail = useCallback(() => {
    if (Platform.OS === 'ios' && detailItem) {
      resumeDetailAfterLocationRef.current = detailItem;
      setDetailItem(null);
      setTimeout(() => setLocationModalOpen(true), 280);
    } else {
      setLocationModalOpen(true);
    }
  }, [detailItem]);

  const handleCloseLocationModal = useCallback(() => {
    setLocationModalOpen(false);
    if (resumeDetailAfterLocationRef.current) {
      const target = resumeDetailAfterLocationRef.current;
      resumeDetailAfterLocationRef.current = null;
      setTimeout(() => setDetailItem(target), 280);
    }
  }, []);

  const handleLiveWebSearch = useCallback(() => {
    runLiveSearchForQuery(searchQuery);
  }, [runLiveSearchForQuery, searchQuery]);

  // Automatically search all stores (regular + on-sale items) as the user types!
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      searchSeqRef.current += 1;
      setLiveSearching(false);
      if (!q) {
        setLiveExtraItems([]);
        setLiveSearchedQuery('');
      }
      return;
    }

    const timer = setTimeout(() => {
      runLiveSearchForQuery(q);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, runLiveSearchForQuery]);

  const handleToggleSave = useCallback((item: SpecialItem) => {
    setSavedItems((prev) => {
      const exists = prev.some((p) => p.id === item.id);
      const next = exists ? prev.filter((p) => p.id !== item.id) : [item, ...prev];
      persistSavedSpecials(next);
      return next;
    });
  }, []);

  const handleClearSaved = useCallback(() => {
    setSavedItems([]);
    persistSavedSpecials([]);
  }, []);

  const isItemOnSale = useCallback((item: SpecialItem): boolean => {
    return Boolean(
      item.isOnSale ??
        (item.isHalfPrice ||
          (item.saveAmount !== null && item.saveAmount > 0) ||
          item.promoText)
    );
  }, []);

  // Pool of items matching the current search query (includes live full-range regular + sale items!)
  const queryMatchedPool = useMemo(() => {
    const qNorm = searchQuery.trim().toLowerCase();
    if (!qNorm) return allItems;

    const tokens = qNorm.split(/\s+/).filter(Boolean);
    const matchesTokens = (item: SpecialItem) => {
      const hay = `${item.title} ${item.brand || ''} ${item.category} ${
        item.promoText || ''
      } ${item.storeName}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    };

    const localMatches = allItems.filter(matchesTokens);

    // If live store search completed for this query, preserve ALL returned store items (regular & on-sale)
    const primaryLive =
      liveSearchedQuery === qNorm
        ? liveExtraItems
        : liveExtraItems.filter(matchesTokens);

    const out: SpecialItem[] = [];
    const seen = new Set<string>();
    for (const item of [...primaryLive, ...localMatches]) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        out.push(item);
      }
    }
    return out;
  }, [allItems, liveExtraItems, liveSearchedQuery, searchQuery]);

  // Dynamic counts for All Items / On Sale / ½ Price and Amazon live search pills
  const filterCounts = useMemo(() => {
    const hasSearch = searchQuery.trim().length > 0;
    const searchAndCatPool = queryMatchedPool.filter((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      return true;
    });

    const amazonCount = searchAndCatPool.filter((i) => i.store === 'amazon').length;
    const storeScoped =
      selectedStore === 'all'
        ? searchAndCatPool
        : searchAndCatPool.filter((i) => i.store === selectedStore);

    const effectiveStats: Partial<Record<StoreId, StoreStat>> = {
      ...(storeStats || {}),
    };
    if (hasSearch || selectedCategory !== 'All') {
      for (const st of ['woolworths', 'coles', 'aldi', 'iga', 'amazon'] as StoreId[]) {
        const list = searchAndCatPool.filter((i) => i.store === st);
        effectiveStats[st] = {
          count: list.length,
          onSaleCount: list.filter(isItemOnSale).length,
          halfPriceCount: list.filter((i) => i.isHalfPrice).length,
          status: 'ok',
        };
      }
    }

    return {
      totalItemsCount: storeScoped.length,
      totalOnSaleCount: storeScoped.filter(isItemOnSale).length,
      totalHalfPriceCount: storeScoped.filter((i) => i.isHalfPrice).length,
      inStockCount: storeScoped.filter((i) => i.inStock === true).length,
      amazonCount,
      effectiveStats,
    };
  }, [
    queryMatchedPool,
    searchQuery,
    selectedCategory,
    selectedStore,
    storeStats,
    isItemOnSale,
  ]);

  // Instant client-side filtering & sorting across all regular + sale items
  const filteredItems = useMemo(() => {
    const matches = queryMatchedPool.filter((item) => {
      if (selectedStore !== 'all' && item.store !== selectedStore) return false;
      if (dealFilter === 'half_price' && !item.isHalfPrice) return false;
      if (dealFilter === 'sale' && !isItemOnSale(item)) return false;
      if (inStockOnly && item.inStock !== true) return false;
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      return true;
    });

    if (sortBy === 'featured') return matches;

    return [...matches].sort((a, b) => {
      if (sortBy === 'discount') {
        return (b.discountPercent || 0) - (a.discountPercent || 0);
      }
      if (sortBy === 'savings') {
        return (b.saveAmount || 0) - (a.saveAmount || 0);
      }
      if (sortBy === 'price_asc') {
        return (a.price ?? 9999) - (b.price ?? 9999);
      }
      return 0;
    });
  }, [
    queryMatchedPool,
    selectedStore,
    dealFilter,
    inStockOnly,
    selectedCategory,
    sortBy,
    isItemOnSale,
  ]);

  // Active store catalogue validity banner when viewing a single supermarket
  const activeCatalogueBanner = useMemo(() => {
    if (selectedStore === 'all' || !catalogues) return null;
    const info = catalogues[selectedStore];
    if (!info) return null;
    const theme = STORE_THEMES[selectedStore];
    return { info, theme };
  }, [selectedStore, catalogues]);

  return (
    <SafeAreaView style={styles.safeRoot} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      <HeaderBar
        totalDeals={allItems.length}
        lastSyncedAt={lastSyncedAt}
        syncing={refreshing}
        hasAppUpdate={Boolean(releaseCheck?.hasUpdate)}
        userLocation={userLocation}
        onLocationPress={() => setLocationModalOpen(true)}
        onSyncPress={handleSyncFromWeb}
        onSettingsPress={() => setSettingsOpen(true)}
      />

      {releaseCheck?.hasUpdate && !updateBannerDismissed && (
        <View style={styles.updateBanner}>
          <View style={styles.updateBannerLeft}>
            <Ionicons name="sparkles" size={16} color={COLORS.accent} />
            <Text style={styles.updateBannerText} numberOfLines={1}>
              New iOS .ipa {releaseCheck.latestTag} is ready to download
            </Text>
          </View>
          <View style={styles.updateBannerActions}>
            <Pressable
              onPress={() => setSettingsOpen(true)}
              style={styles.updateBannerBtn}
            >
              <Text style={styles.updateBannerBtnText}>Update</Text>
            </Pressable>
            <Pressable
              onPress={() => setUpdateBannerDismissed(true)}
              hitSlop={8}
            >
              <Ionicons name="close" size={18} color={COLORS.textSecondary} />
            </Pressable>
          </View>
        </View>
      )}

      {activeTab === 'browse' ? (
        <>
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={(q) => {
              setSearchQuery(q);
              if (!q.trim()) setLiveExtraItems([]);
            }}
            onLiveWebSearch={handleLiveWebSearch}
            liveSearching={liveSearching}
            selectedStore={selectedStore}
            onStoreChange={setSelectedStore}
            dealFilter={dealFilter}
            onDealFilterChange={setDealFilter}
            inStockOnly={inStockOnly}
            onToggleInStockOnly={() => setInStockOnly((prev) => !prev)}
            totalItemsCount={filterCounts.totalItemsCount}
            totalOnSaleCount={filterCounts.totalOnSaleCount}
            totalHalfPriceCount={filterCounts.totalHalfPriceCount}
            inStockCount={filterCounts.inStockCount}
            amazonCount={filterCounts.amazonCount}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
            sortBy={sortBy}
            onSortChange={setSortBy}
            storeStats={filterCounts.effectiveStats}
          />

          {errorMsg && (
            <View style={styles.errorBanner}>
              <View style={styles.errorTextWrap}>
                <Ionicons name="warning-outline" size={18} color={COLORS.danger} />
                <Text style={styles.errorText} numberOfLines={2}>
                  {Platform.OS === 'web'
                    ? `Cannot reach backend (${errorMsg}). Ensure npm run server is running.`
                    : `Could not sync items (${errorMsg}). Check connection and retry.`}
                </Text>
              </View>
              <Pressable onPress={loadCataloguesFromServer} style={styles.retryBtn}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </Pressable>
            </View>
          )}

          {initialLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={styles.loadingTitle}>
                Downloading Products & Weekly Specials…
              </Text>
              <Text style={styles.loadingSubtitle}>
                Fetching items & sales from Woolworths, Coles, ALDI & IGA
              </Text>
            </View>
          ) : (
            <FlatList
              key={`grid-${numColumns}`}
              data={filteredItems}
              numColumns={numColumns}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.gridContent}
              columnWrapperStyle={styles.gridRow}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleSyncFromWeb}
                  tintColor={COLORS.accent}
                />
              }
              ListHeaderComponent={
                <View style={styles.listHeaderWrap}>
                  {activeCatalogueBanner && (
                    <View
                      style={[
                        styles.catalogueBanner,
                        {
                          backgroundColor: activeCatalogueBanner.theme.softBg,
                          borderColor: activeCatalogueBanner.theme.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name="newspaper-outline"
                        size={16}
                        color={activeCatalogueBanner.theme.primary}
                      />
                      <Text
                        style={[
                          styles.catalogueBannerText,
                          { color: activeCatalogueBanner.theme.primary },
                        ]}
                        numberOfLines={1}
                      >
                        {activeCatalogueBanner.info.name} •{' '}
                        {activeCatalogueBanner.info.validDates}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.resultsCountText}>
                    {liveSearching
                      ? `Searching all stores for "${searchQuery.trim()}"… • `
                      : ''}
                    Showing {filteredItems.length}{' '}
                    {filteredItems.length === 1 ? 'item' : 'items'}
                    {dealFilter === 'sale' ? ' • On Sale filter active' : ''}
                    {dealFilter === 'half_price' ? ' • ½ Price filter active' : ''}
                    {inStockOnly ? ' • In Stock filter active' : ''}
                    {userLocation
                      ? ` • ${userLocation.suburb} ${userLocation.postcode}`
                      : ''}
                    {' • Tap any item to compare prices & stock'}
                  </Text>
                </View>
              }
              ListEmptyComponent={
                <View style={styles.emptySearchWrap}>
                  <Ionicons name="search-outline" size={40} color={COLORS.textMuted} />
                  <Text style={styles.emptySearchTitle}>No matching items</Text>
                  <Text style={styles.emptySearchSub}>
                    Try clearing a filter or tap "Live Search" to search across Amazon
                    AU, Woolworths, Coles, ALDI & IGA.
                  </Text>
                  <Pressable
                    onPress={() => {
                      setSelectedStore('all');
                      setDealFilter('all');
                      setInStockOnly(false);
                      setSelectedCategory('All');
                      setSearchQuery('');
                    }}
                    style={styles.resetFiltersBtn}
                  >
                    <Text style={styles.resetFiltersText}>Reset All Filters</Text>
                  </Pressable>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.cardCell}>
                  <SpecialCard
                    item={item}
                    isSaved={savedIdSet.has(item.id)}
                    onPress={setDetailItem}
                    onToggleSave={handleToggleSave}
                  />
                </View>
              )}
            />
          )}
        </>
      ) : (
        <SavedListView
          savedItems={savedItems}
          onSelectItem={setDetailItem}
          onRemoveItem={handleToggleSave}
          onClearAll={handleClearSaved}
        />
      )}

      {/* Native-Style iOS Bottom Tab Bar */}
      <SafeAreaView edges={['bottom']} style={styles.tabBarSafe}>
        <View style={styles.tabBar}>
          <Pressable
            onPress={() => setActiveTab('browse')}
            style={styles.tabItem}
          >
            <Ionicons
              name={activeTab === 'browse' ? 'grid' : 'grid-outline'}
              size={22}
              color={activeTab === 'browse' ? COLORS.accent : COLORS.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'browse' && styles.tabLabelActive,
              ]}
            >
              Browse
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('saved')}
            style={styles.tabItem}
          >
            <View style={styles.tabIconWrap}>
              <Ionicons
                name={activeTab === 'saved' ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={activeTab === 'saved' ? COLORS.accent : COLORS.textMuted}
              />
              {savedItems.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{savedItems.length}</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'saved' && styles.tabLabelActive,
              ]}
            >
              Saved List
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <SpecialDetailModal
        item={detailItem}
        isSaved={detailItem ? savedIdSet.has(detailItem.id) : false}
        userLocation={userLocation}
        onOpenLocationPicker={handleOpenLocationFromDetail}
        onClose={() => setDetailItem(null)}
        onToggleSave={handleToggleSave}
      />

      <LocationStoreModal
        visible={locationModalOpen}
        currentLocation={userLocation}
        onClose={handleCloseLocationModal}
        onSaveLocation={handleSaveLocation}
      />

      <ServerSettingsModal
        visible={settingsOpen}
        releaseCheck={releaseCheck}
        checkingRelease={checkingRelease}
        onCheckRelease={runReleaseCheck}
        onClose={() => setSettingsOpen(false)}
        onSaved={loadCataloguesFromServer}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeRoot: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  updateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.accentSoft,
    borderBottomWidth: 1,
    borderBottomColor: '#C5D9FC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  updateBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  updateBannerText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.accent,
  },
  updateBannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  updateBannerBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 999,
    backgroundColor: COLORS.accent,
  },
  updateBannerBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  errorTextWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12.5,
    color: '#991B1B',
    fontWeight: '600',
  },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.danger,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  loadingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 6,
  },
  loadingSubtitle: {
    fontSize: 13.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  listHeaderWrap: {
    marginBottom: 8,
    gap: 8,
  },
  catalogueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  catalogueBannerText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
  },
  resultsCountText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  gridContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 24,
  },
  gridRow: {
    gap: 10,
    marginBottom: 10,
  },
  cardCell: {
    flex: 1,
  },
  emptySearchWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptySearchTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  emptySearchSub: {
    fontSize: 13.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  resetFiltersBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: COLORS.accentSoft,
  },
  resetFiltersText: {
    color: COLORS.accent,
    fontWeight: '700',
    fontSize: 13.5,
  },
  tabBarSafe: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  tabBar: {
    flexDirection: 'row',
    height: 54,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabIconWrap: {
    position: 'relative',
  },
  tabBadge: {
    position: 'absolute',
    right: -10,
    top: -4,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabLabelActive: {
    color: COLORS.accent,
    fontWeight: '800',
  },
});
